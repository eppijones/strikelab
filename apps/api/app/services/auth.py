from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from jose.utils import base64url_decode
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.user import User

settings = get_settings()
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None


def _clerk_jwks_url() -> str | None:
    if settings.clerk_jwks_url:
        return settings.clerk_jwks_url
    if settings.clerk_issuer:
        return f"{settings.clerk_issuer.rstrip('/')}/.well-known/jwks.json"
    return None


def _clerk_configured() -> bool:
    return bool(settings.clerk_issuer and _clerk_jwks_url())


def _clerk_key_for_token(token: str) -> dict | None:
    jwks_url = _clerk_jwks_url()
    if not jwks_url:
        return None
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        response = httpx.get(jwks_url, timeout=5.0)
        response.raise_for_status()
        keys = response.json().get("keys", [])
    except Exception:
        return None
    for key in keys:
        if key.get("kid") == kid:
            return key
    return None


def decode_clerk_token(token: str) -> Optional[dict]:
    """Verify a Clerk session JWT and return its claims.

    Clerk signs session tokens with RS256. The issuer is required; audience
    is optional because Clerk templates can omit it for first-party clients.
    """
    if not _clerk_configured():
        return None
    key = _clerk_key_for_token(token)
    if not key:
        return None
    options = {"verify_aud": bool(settings.clerk_audience)}
    try:
        return jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
            audience=settings.clerk_audience or None,
            options=options,
        )
    except JWTError:
        return None


def decode_any_token(token: str) -> Optional[dict]:
    """Accept Clerk session tokens first, then legacy StrikeLab JWTs."""
    clerk_payload = decode_clerk_token(token)
    if clerk_payload:
        return {**clerk_payload, "auth_provider": "clerk"}
    legacy_payload = decode_token(token)
    if legacy_payload:
        return {**legacy_payload, "auth_provider": "legacy"}
    return None


def _email_from_clerk_claims(payload: dict) -> str | None:
    email = payload.get("email") or payload.get("email_address")
    if isinstance(email, str) and email:
        return email.lower()
    claims = payload.get("claims")
    if isinstance(claims, dict):
        nested = claims.get("email") or claims.get("email_address")
        if isinstance(nested, str) and nested:
            return nested.lower()
    return None


def _display_name_from_clerk_claims(payload: dict, email: str | None) -> str:
    for key in ("name", "full_name", "username", "given_name"):
        val = payload.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return email.split("@", 1)[0] if email else "StrikeLab Player"


def _get_or_create_clerk_user(payload: dict, db: Session) -> User:
    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Clerk token")

    user = db.query(User).filter(User.clerk_user_id == str(clerk_user_id)).first()
    if user:
        return user

    email = _email_from_clerk_claims(payload) or f"{clerk_user_id}@clerk.strikelab.local"
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.clerk_user_id = str(clerk_user_id)
    else:
        user = User(
            email=email,
            clerk_user_id=str(clerk_user_id),
            password_hash=None,
            display_name=_display_name_from_clerk_claims(payload, email),
            persona="improver",
        )
        db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_any_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("auth_provider") == "clerk":
        return _get_or_create_clerk_user(payload, db)
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return the current user if a valid bearer token is present, else None."""
    if credentials is None:
        return None

    payload = decode_any_token(credentials.credentials)
    if not payload:
        return None

    if payload.get("auth_provider") == "clerk":
        return _get_or_create_clerk_user(payload, db)

    user_id = payload.get("sub")
    if not user_id:
        return None

    return db.query(User).filter(User.id == user_id).first()
