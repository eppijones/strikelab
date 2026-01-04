from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    language: str = "en"
    units: str = "yards"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    handicap_index: Optional[float] = None
    goal_handicap: Optional[float] = None
    dream_handicap: Optional[float] = None
    practice_frequency: Optional[str] = None
    onboarding_completed: bool = False
    language: str
    units: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    handicap_index: Optional[float] = None
    language: Optional[str] = None
    units: Optional[str] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    refresh_token: str


class InviteCreate(BaseModel):
    email: Optional[str] = None
    message: Optional[str] = None


class InviteResponse(BaseModel):
    id: UUID
    token: str
    email: Optional[str]
    message: Optional[str]
    used: bool
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class FriendResponse(BaseModel):
    id: UUID
    display_name: str
    handicap_index: Optional[float]
    status: str

    class Config:
        from_attributes = True
