from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
import logging

try:
    import jwt
except ImportError:
    from jose import jwt

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, Token, UserResponse
from app.security import (
    async_hash_password,
    async_verify_password,
    create_access_token,
    create_refresh_token,
    generate_csrf_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
)
from app.rate_limiter import rate_limiter

logger = logging.getLogger("pyforge.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
async def register(
    user_in: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    clean_username = user_in.username.strip()
    clean_email = user_in.email.strip().lower()

    if len(clean_username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long."
        )

    # Check username & email case-insensitively
    existing = await db.execute(
        select(User).where(
            (func.lower(User.username) == clean_username.lower()) | 
            (func.lower(User.email) == clean_email.lower())
        )
    )
    existing_user = existing.scalars().first()
    if existing_user:
        if existing_user.username.lower() == clean_username.lower():
            detail = "This username is already taken. Please choose another."
        else:
            detail = "This email is already registered. Please sign in instead."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

    # Non-blocking password hashing offloaded to threadpool
    hashed_password = await async_hash_password(user_in.password)

    user = User(
        username=clean_username,
        email=clean_email,
        hashed_password=hashed_password,
        role="user",
        xp=0,
        coins=100,
        level=1,
        lives=5,
        streak=1
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Dual-token generation
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    csrf_token = generate_csrf_token(user.username)

    # Set HttpOnly + CSRF cookies
    set_auth_cookies(response, access_token, refresh_token, csrf_token)

    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
async def login(
    user_in: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    identifier = (user_in.username or user_in.identifier or "").strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username or email is required."
        )

    # 1. Rate Limiting Check (Distributed Redis or in-memory fallback)
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}:{identifier.lower()}"
    is_locked, retry_after = await rate_limiter.is_locked(rate_key)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )

    # 2. Fast-Path Indexed Lookup
    res = await db.execute(
        select(User).where(
            (User.username == identifier) | 
            (User.email == identifier.lower()) |
            (func.lower(User.username) == identifier.lower())
        )
    )
    user = res.scalars().first()

    # 3. Non-Blocking Bcrypt Verification offloaded to threadpool
    password_valid = False
    if user:
        password_valid = await async_verify_password(user_in.password, user.hashed_password)

    if not user or not password_valid:
        # Record failed attempt
        is_now_locked, lockout_seconds = await rate_limiter.record_failure(
            rate_key, max_attempts=5, window_seconds=60, lockout_seconds=30
        )
        if is_now_locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked for {lockout_seconds} seconds due to multiple failed login attempts.",
                headers={"Retry-After": str(lockout_seconds)}
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Reset rate limiting counter on success
    await rate_limiter.clear_failures(rate_key)

    # Dual-Token Generation & Cookie Dispatch
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    csrf_token = generate_csrf_token(user.username)

    set_auth_cookies(response, access_token, refresh_token, csrf_token)

    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/guest", response_model=Token)
async def guest_login(
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    guest_uuid = uuid.uuid4().hex[:8]
    hashed_pwd = await async_hash_password("guest_pass_123")
    guest_user = User(
        username=f"runner_{guest_uuid}",
        email=f"guest_{guest_uuid}@pythonquest.io",
        hashed_password=hashed_pwd,
        role="guest",
        xp=0,
        coins=100,
        level=1,
        lives=5,
        streak=1
    )
    db.add(guest_user)
    await db.commit()
    await db.refresh(guest_user)

    access_token = create_access_token(data={"sub": guest_user.username})
    refresh_token = create_refresh_token(data={"sub": guest_user.username})
    csrf_token = generate_csrf_token(guest_user.username)

    set_auth_cookies(response, access_token, refresh_token, csrf_token)

    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(guest_user))


@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Silent token refresh: reads refresh_token HttpOnly cookie,
    validates signature & expiry, and sets a fresh access_token cookie.
    """
    raw_refresh = request.cookies.get("refresh_token")
    if not raw_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie missing"
        )

    try:
        payload = jwt.decode(raw_refresh, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type", "refresh")
        if not username or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload"
            )
    except Exception:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or invalid"
        )

    res = await db.execute(select(User).where(User.username == username))
    user = res.scalars().first()
    if not user:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    new_access_token = create_access_token(data={"sub": user.username})
    new_csrf_token = generate_csrf_token(user.username)

    # Renew access token cookie while preserving refresh token
    set_auth_cookies(response, access_token=new_access_token, csrf_token=new_csrf_token)

    return Token(access_token=new_access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/logout")
async def logout(response: Response):
    """Clear all HttpOnly session and CSRF cookies."""
    clear_auth_cookies(response)
    return {"status": "ok", "message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
