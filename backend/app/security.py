from datetime import datetime, timedelta, timezone
from typing import Optional
import hmac
import hashlib
import secrets

try:
    import jwt
except ImportError:
    from jose import jwt

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from starlette.concurrency import run_in_threadpool
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


# --- Bcrypt Password Operations ---
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


async def async_hash_password(password: str) -> str:
    """Non-blocking password hashing offloaded to Starlette worker threadpool."""
    return await run_in_threadpool(hash_password, password)


async def async_verify_password(plain_password: str, hashed_password: str) -> bool:
    """Non-blocking password verification offloaded to Starlette worker threadpool."""
    return await run_in_threadpool(verify_password, plain_password, hashed_password)


# --- JWT Token Generation ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# --- CSRF Defense-in-Depth ---
def generate_csrf_token(entropy: Optional[str] = None) -> str:
    salt = entropy or secrets.token_hex(16)
    signature = hmac.new(
        settings.CSRF_SECRET_KEY.encode("utf-8"),
        salt.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return f"{salt}.{signature}"


def verify_csrf_token(token: str) -> bool:
    if not token or "." not in token:
        return False
    salt, sig = token.split(".", 1)
    expected_sig = hmac.new(
        settings.CSRF_SECRET_KEY.encode("utf-8"),
        salt.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(sig, expected_sig)


# --- Cookie Management ---
def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: Optional[str] = None,
    csrf_token: Optional[str] = None
):
    """
    Set production-grade HttpOnly cookies for session management.
    credentials: "include" sends cookies automatically without bearer exposure.
    """
    # 1. HttpOnly Access Token (Short-lived, path-wide)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    # 2. HttpOnly Refresh Token (Long-lived, scoped to auth routes)
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            domain=settings.COOKIE_DOMAIN,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            path=f"{settings.API_V1_STR}/auth",
        )

    # 3. JavaScript-readable CSRF Token (SameSite=Lax defense)
    if csrf_token:
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            domain=settings.COOKIE_DOMAIN,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            path="/",
        )


def clear_auth_cookies(response: Response):
    """Clear all authentication and CSRF cookies on logout."""
    response.delete_cookie(key="access_token", path="/", domain=settings.COOKIE_DOMAIN)
    response.delete_cookie(key="refresh_token", path=f"{settings.API_V1_STR}/auth", domain=settings.COOKIE_DOMAIN)
    response.delete_cookie(key="csrf_token", path="/", domain=settings.COOKIE_DOMAIN)


# --- User Authentication Dependencies ---
async def get_current_user_optional(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    # Check HttpOnly cookie first, then fallback to Bearer header
    raw_token = request.cookies.get("access_token") or token
    if not raw_token:
        return None
    try:
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except Exception:
        return None

    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    raw_token = request.cookies.get("access_token") or token
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user
