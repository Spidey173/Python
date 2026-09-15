from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, Token, UserResponse
from app.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
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

    user = User(
        username=clean_username,
        email=clean_email,
        hashed_password=hash_password(user_in.password),
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

    token = create_access_token(data={"sub": user.username})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    identifier = (user_in.username or user_in.identifier or "").strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username or email is required."
        )
    res = await db.execute(
        select(User).where(
            (func.lower(User.username) == identifier.lower()) | 
            (func.lower(User.email) == identifier.lower())
        )
    )
    user = res.scalars().first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(data={"sub": user.username})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


STATIC_GUEST_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW"


@router.post("/guest", response_model=Token)
async def guest_login(db: AsyncSession = Depends(get_db)):
    # Create or fetch a demo guest session
    guest_uuid = uuid.uuid4().hex[:8]
    guest_user = User(
        username=f"runner_{guest_uuid}",
        email=f"guest_{guest_uuid}@pythonquest.io",
        hashed_password=STATIC_GUEST_HASH,
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

    token = create_access_token(data={"sub": guest_user.username})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(guest_user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
