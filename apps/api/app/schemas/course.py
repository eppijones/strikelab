from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class CourseCreate(BaseModel):
    name: str
    city: Optional[str] = None
    country: Optional[str] = None
    par: Optional[int] = None
    slope_rating: Optional[float] = None
    course_rating: Optional[float] = None
    holes: Optional[list[dict[str, Any]]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    website: Optional[str] = None
    phone: Optional[str] = None


class CourseResponse(BaseModel):
    id: UUID
    name: str
    city: Optional[str]
    country: Optional[str]
    par: Optional[int]
    slope_rating: Optional[float]
    course_rating: Optional[float]
    holes: Optional[list[dict[str, Any]]]
    latitude: Optional[float]
    longitude: Optional[float]
    website: Optional[str]
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TeeTimeCreate(BaseModel):
    course_id: Optional[UUID] = None
    tee_time: datetime
    players: Optional[list[str]] = None
    notes: Optional[str] = None
    prep_notes: Optional[str] = None
    focus_areas: Optional[list[str]] = None
    booking_source: Optional[str] = None
    booking_reference: Optional[str] = None


class TeeTimeResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: Optional[UUID]
    tee_time: datetime
    players: Optional[list[str]]
    notes: Optional[str]
    prep_notes: Optional[str]
    focus_areas: Optional[list[str]]
    booking_source: Optional[str]
    booking_reference: Optional[str]
    status: str
    session_id: Optional[UUID]
    created_at: datetime
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True
