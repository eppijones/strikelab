from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets

from app.database import get_db
from app.models.user import User, Invite, FriendLink
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
    Token,
    TokenRefresh,
    InviteCreate,
    InviteResponse,
)
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    decode_token,
)

router = APIRouter()


def _language_from_accept_header(accept: str | None, fallback: str = "en") -> str:
    """Pick a sane default language from the Accept-Language header.

    Anything that resolves to Norwegian (nb / nn / no) → `no`. Otherwise
    fall back to English. Used at registration time so a Norwegian
    visitor doesn't have to flip a setting before reading the app.
    """
    if not accept:
        return fallback
    primary = accept.split(",", 1)[0].strip().lower()
    if primary.startswith("nb") or primary.startswith("nn") or primary.startswith("no"):
        return "no"
    if primary.startswith("en"):
        return "en"
    return fallback


@router.post("/register", response_model=Token)
def register(data: UserCreate, request: Request, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Geo-default language: if the client didn't explicitly pass `language`
    # (or passed the schema default "en"), peek at Accept-Language so a
    # Norwegian visitor lands in Norwegian without flipping a switch.
    language = data.language
    if language == "en":
        language = _language_from_accept_header(request.headers.get("accept-language"), "en")

    # Create user
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        language=language,
        units=data.units,
        persona=data.persona or "improver",
        home_club_id=data.home_club_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=Token)
def refresh_token(data: TokenRefresh, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/invite/create", response_model=InviteResponse)
def create_invite(
    data: InviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = Invite(
        creator_id=current_user.id,
        token=secrets.token_urlsafe(32),
        email=data.email,
        message=data.message,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    
    return InviteResponse.model_validate(invite)


@router.post("/invite/accept")
def accept_invite(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(Invite).filter(
        Invite.token == token,
        Invite.used == False
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired invite"
        )
    
    if invite.expires_at and invite.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite has expired"
        )
    
    # Create friend links (bidirectional)
    friend_link_1 = FriendLink(
        user_id=invite.creator_id,
        friend_id=current_user.id,
        status="accepted",
    )
    friend_link_2 = FriendLink(
        user_id=current_user.id,
        friend_id=invite.creator_id,
        status="accepted",
    )
    
    invite.used = True
    invite.used_by_id = current_user.id
    
    db.add(friend_link_1)
    db.add(friend_link_2)
    db.commit()
    
    return {"message": "Friend request accepted"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile."""
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        if hasattr(current_user, key):
            setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)
