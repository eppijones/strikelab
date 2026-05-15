from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.booking import CourseConditionsResponse
from app.schemas.catalog import BrandResponse, ClubModelResponse


class PublicAttribution(BaseModel):
    source_id: str
    name: str
    license_name: str
    license_url: Optional[str] = None
    attribution: str
    source_url: Optional[str] = None


class PublicDataSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    license_name: str
    license_url: Optional[str] = None
    attribution: str
    source_url: Optional[str] = None
    terms_url: Optional[str] = None
    refresh_interval_hours: Optional[int] = None
    is_open: bool = True
    notes: Optional[str] = None
    updated_at: datetime


class PublicCourseResponse(BaseModel):
    id: UUID
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
    ngf_club_id: Optional[str] = None
    osm_id: Optional[str] = None
    golfcourseapi_id: Optional[str] = None
    is_verified: bool = False
    geometry_summary: Optional[dict[str, Any]] = None
    data_sources: list[PublicAttribution] = []
    updated_at: Optional[datetime] = None


class PublicCourseGeometryResponse(BaseModel):
    course_id: UUID
    geometry_version: str
    features: dict[str, Any]
    summary: Optional[dict[str, Any]] = None
    validation: Optional[dict[str, Any]] = None
    confidence: Optional[float] = None
    attribution: Optional[str] = None
    captured_at: datetime
    updated_at: datetime
    source: Optional[PublicAttribution] = None


class PublicCourseConditionSourcesResponse(BaseModel):
    course_id: UUID
    source: str
    data_sources: list[PublicAttribution] = []


class PublicTeeSheetSlotSummary(BaseModel):
    tee_time: datetime
    players_total: int
    available: int
    price_amount: Optional[float] = None
    currency: str = "NOK"
    peak: bool = False
    golden: bool = False
    twilight: bool = False


class PublicTeeSheetSummaryResponse(BaseModel):
    course_id: UUID
    course_name: str
    date: date
    provider: str = "internal"
    currency: str = "NOK"
    slots: list[PublicTeeSheetSlotSummary]
    conditions: Optional[CourseConditionsResponse] = None
    data_sources: list[PublicAttribution] = []


class PublicApiIndexResponse(BaseModel):
    name: str = "StrikeLab Open Golf API"
    scope: str = "Norway-first public read-only golf data"
    version: str = "v1"
    endpoints: list[str]
    terms: str
    attribution_required: bool = True


class PublicProviderStatus(BaseModel):
    provider: str
    configured: bool
    authenticated: Optional[bool] = None
    sample_query: Optional[str] = None
    sample_count: Optional[int] = None
    norway_sample_count: Optional[int] = None
    rate_limit_plan_hint: str
    recommendation: str


class PublicProviderSearchResponse(BaseModel):
    provider: str
    query: str
    count: int
    courses: list[PublicCourseResponse]
    note: Optional[str] = None


PublicBrandResponse = BrandResponse
PublicClubModelResponse = ClubModelResponse
