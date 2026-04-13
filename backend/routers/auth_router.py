"""Authentication routes - X OAuth + username/password fallback."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import bcrypt

from database import get_db
from models import User
from auth import (
    create_app_token,
    get_authorization_url,
    exchange_code_for_token,
    get_x_user_profile,
)
from config import get_settings
from schemas import UserRegister, UserLogin, UserOut, TokenOut
from routers.deps import get_current_user

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


# --- X OAuth endpoints ---

@router.get("/login-x")
async def login_x():
    """Get X OAuth authorization URL."""
    url, state = get_authorization_url()
    return {"authorization_url": url}


@router.get("/callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Handle X OAuth callback — create/update user, redirect with token."""
    token_data = await exchange_code_for_token(code, state)
    if not token_data:
        return RedirectResponse(f"{settings.frontend_url}/login?error=oauth_failed")

    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse(f"{settings.frontend_url}/login?error=no_token")

    profile = await get_x_user_profile(access_token)
    if not profile:
        return RedirectResponse(f"{settings.frontend_url}/login?error=profile_failed")

    x_user_id = profile["id"]
    x_username = profile["username"]
    x_name = profile.get("name", x_username)
    x_pic = profile.get("profile_image_url", "")

    # Find or create user
    user = db.query(User).filter(User.x_user_id == x_user_id).first()
    if user:
        user.x_username = x_username
        user.x_display_name = x_name
        user.x_profile_image_url = x_pic
        user.x_access_token = access_token
        user.display_name = x_name
        user.last_login = datetime.now(timezone.utc)
    else:
        user = User(
            x_user_id=x_user_id,
            x_username=x_username,
            x_display_name=x_name,
            x_profile_image_url=x_pic,
            x_access_token=access_token,
            display_name=x_name,
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    jwt_token = create_app_token(user.id, x_username)
    return RedirectResponse(
        f"{settings.frontend_url}/auth/success?token={jwt_token}"
    )


# --- Username/password endpoints ---

@router.post("/register", response_model=TokenOut, status_code=201)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new account."""
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=409, detail="Username already taken")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        display_name=data.display_name or data.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_app_token(user.id, user.username)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login with username and password."""
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_app_token(user.id, user.username)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user
