from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, Any


class CourseBase(BaseModel):
    name: str
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    course_type: Optional[str] = None
    par: Optional[int] = None
    holes_count: Optional[int] = None
    slope_rating: Optional[float] = None
    course_rating: Optional[float] = None
    total_yards: Optional[int] = None
    total_meters: Optional[int] = None
    holes: Optional[list[dict[str, Any]]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_driving_range: Optional[bool] = None
    has_practice_area: Optional[bool] = None
    has_putting_green: Optional[bool] = None
    has_par3_course: Optional[bool] = None
    has_simulator: Optional[bool] = None
    facilities: Optional[dict[str, Any]] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    designer: Optional[str] = None
    established: Optional[int] = None
    ngf_club_id: Optional[str] = None
    osm_id: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    course_type: Optional[str] = None
    par: Optional[int] = None
    holes_count: Optional[int] = None
    slope_rating: Optional[float] = None
    course_rating: Optional[float] = None
    total_yards: Optional[int] = None
    total_meters: Optional[int] = None
    holes: Optional[list[dict[str, Any]]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_driving_range: Optional[bool] = None
    has_practice_area: Optional[bool] = None
    has_putting_green: Optional[bool] = None
    has_par3_course: Optional[bool] = None
    has_simulator: Optional[bool] = None
    facilities: Optional[dict[str, Any]] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    designer: Optional[str] = None
    established: Optional[int] = None


class CourseResponse(CourseBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_verified: bool = False
    created_by_user_id: Optional[UUID] = None
    created_at: datetime


class CourseImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str] = []


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
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    course_id: Optional[UUID] = None
    tee_time: datetime
    players: Optional[list[str]] = None
    notes: Optional[str] = None
    prep_notes: Optional[str] = None
    focus_areas: Optional[list[str]] = None
    booking_source: Optional[str] = None
    booking_reference: Optional[str] = None
    status: str
    session_id: Optional[UUID] = None
    created_at: datetime
    course: Optional[CourseResponse] = None
