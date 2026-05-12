"""Pydantic schemas for the StrikeLab Tee booking surface."""
from datetime import date, datetime, time
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ─────────────────────────────────────────────────────────────────────
# Preferences
# ─────────────────────────────────────────────────────────────────────


class BookingPreferencesBase(BaseModel):
    time_bands: Optional[list[str]] = None
    max_wind_ms: Optional[float] = None
    max_rain_pct: Optional[float] = None
    min_temp_c: Optional[float] = None
    course_types: Optional[list[str]] = None
    solo_only: bool = False
    no_groups_behind_min: Optional[int] = None
    walking_only: bool = False
    favorite_course_id: Optional[UUID] = None
    default_player_ids: Optional[list[UUID]] = None
    show_to_pairs: bool = False
    handicap_visible: bool = False


class BookingPreferencesUpdate(BaseModel):
    time_bands: Optional[list[str]] = None
    max_wind_ms: Optional[float] = None
    max_rain_pct: Optional[float] = None
    min_temp_c: Optional[float] = None
    course_types: Optional[list[str]] = None
    solo_only: Optional[bool] = None
    no_groups_behind_min: Optional[int] = None
    walking_only: Optional[bool] = None
    favorite_course_id: Optional[UUID] = None
    default_player_ids: Optional[list[UUID]] = None
    show_to_pairs: Optional[bool] = None
    handicap_visible: Optional[bool] = None


class BookingPreferencesResponse(BookingPreferencesBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID


# ─────────────────────────────────────────────────────────────────────
# Conditions / weather
# ─────────────────────────────────────────────────────────────────────


class HourlyCondition(BaseModel):
    h: int
    t: float
    w: float
    dir: Optional[str] = None
    sun: float = 0.5
    cloud: float = 0.0
    rain: float = 0.0


class CourseConditionsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    course_id: UUID
    captured_at: datetime
    for_date: Optional[date] = None
    hourly: Optional[list[HourlyCondition]] = None
    green_speed: Optional[float] = None
    fairway_state: Optional[str] = None
    rough_state: Optional[str] = None
    mowed_hrs_ago: Optional[int] = None
    wind_ms: Optional[float] = None
    temp_c: Optional[float] = None
    sun_pct: Optional[float] = None
    cloud_pct: Optional[float] = None
    rain_pct: Optional[float] = None
    sunrise: Optional[str] = None
    sunset: Optional[str] = None
    golden_start: Optional[str] = None
    source: str = "met.no"


# ─────────────────────────────────────────────────────────────────────
# Tee sheet
# ─────────────────────────────────────────────────────────────────────


class TeeSheetSlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    tee_time: datetime
    players_total: int
    players_taken: int
    available: int = 0
    price_amount: Optional[float] = None
    currency: str = "NOK"
    peak: bool = False
    golden: bool = False
    twilight: bool = False
    is_blocked: bool = False
    provider_ref: Optional[str] = None
    # Opt-in slot occupants (initials + handicap if visible).
    occupants: list[dict[str, Any]] = []


class TeeSheetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    course_id: UUID
    course_name: str
    date: date
    opens_at: time
    closes_at: time
    interval_min: int
    currency: str = "NOK"
    provider: str = "internal"
    slots: list[TeeSheetSlotResponse]
    conditions: Optional[CourseConditionsResponse] = None


# ─────────────────────────────────────────────────────────────────────
# Window + recommendation
# ─────────────────────────────────────────────────────────────────────


class BestWindow(BaseModel):
    label: str  # "morning-calm", "golden", "twilight"
    label_no: str
    label_en: str
    start_hour: int
    end_hour: int
    range: str  # "08:00 — 11:00"
    conditions_summary: str  # "18° · 4 m/s · stimp 11.2"
    free_slots: int
    accent: str = "moss"  # moss | sun | fjord


class RecommendedSlot(BaseModel):
    course_id: UUID
    course_name: str
    course_city: Optional[str] = None
    course_region: Optional[str] = None
    course_type: Optional[str] = None
    drive_min: Optional[int] = None
    drive_km: Optional[float] = None
    slot_id: UUID
    tee_time: datetime
    available: int
    price_amount: Optional[float] = None
    currency: str = "NOK"
    score: float
    why: list[str] = []
    window_label: Optional[str] = None  # golden / morning-calm / twilight
    sun_pct: Optional[float] = None
    wind_ms: Optional[float] = None
    temp_c: Optional[float] = None
    rain_pct: Optional[float] = None


class DiscoverResponse(BaseModel):
    bucket: str  # "best-now" | "tonight" | "tomorrow" | "weekend" | "twilight"
    best_now: list[RecommendedSlot] = []
    today_window: list[RecommendedSlot] = []
    tonight: list[RecommendedSlot] = []
    weekend: list[RecommendedSlot] = []
    favorites: list[RecommendedSlot] = []
    nearby: list[RecommendedSlot] = []


# ─────────────────────────────────────────────────────────────────────
# Hold + confirm
# ─────────────────────────────────────────────────────────────────────


class HoldPlayerInput(BaseModel):
    user_id: Optional[UUID] = None
    name: str
    handicap: Optional[float] = None
    phone: Optional[str] = None


class HoldRequest(BaseModel):
    slot_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    course_name: str
    tee_time: datetime
    players: int = 1
    player_payload: Optional[list[HoldPlayerInput]] = None
    provider: str = "internal"
    provider_ref: Optional[str] = None
    price_amount: Optional[float] = None
    currency: str = "NOK"


class HoldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    slot_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    course_name: str
    tee_time: datetime
    players: int
    provider: str
    provider_ref: Optional[str] = None
    price_amount: Optional[float] = None
    currency: str = "NOK"
    total_amount: Optional[float] = None
    payment_method: Optional[str] = None
    status: str
    expires_at: datetime


class ConfirmRequest(BaseModel):
    hold_id: UUID
    payment_method: str = Field(default="vipps", description="vipps | apple_pay | card")
    payment_token: Optional[str] = None
    split_mode: str = "together"
    notes: Optional[str] = None


class ConfirmResponse(BaseModel):
    booking_id: UUID
    tee_time_id: Optional[UUID] = None
    course_name: str
    tee_time: datetime
    status: str
    check_in_code: Optional[str] = None
    payment_method: str
    payment_status: str
    pass_url: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────
# Pass / Boarding pass
# ─────────────────────────────────────────────────────────────────────


class PassPlayer(BaseModel):
    name: str
    initials: str
    handicap: Optional[float] = None
    is_you: bool = False


class PassResponse(BaseModel):
    booking_id: UUID
    course_id: Optional[UUID] = None
    course_name: str
    course_city: Optional[str] = None
    course_region: Optional[str] = None
    course_type: Optional[str] = None
    tee_time: datetime
    countdown_seconds: int
    players: list[PassPlayer]
    forecast_temp_c: Optional[float] = None
    forecast_wind_ms: Optional[float] = None
    forecast_wind_dir: Optional[str] = None
    forecast_state: Optional[str] = None  # "dry" | "rain" | "showers"
    drive_min: Optional[int] = None
    check_in_code: Optional[str] = None
    qr_code: Optional[str] = None
    cancel_free_until: Optional[datetime] = None
    status: str = "confirmed"


# ─────────────────────────────────────────────────────────────────────
# Playmate
# ─────────────────────────────────────────────────────────────────────


class PlaymateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    friend_user_id: Optional[UUID] = None
    display_name: Optional[str] = None
    handicap: Optional[float] = None
    last_played_at: Optional[datetime] = None
    rounds_together: int = 0
    public_handicap_visible: bool = False
