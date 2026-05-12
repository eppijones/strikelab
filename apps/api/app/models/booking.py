"""StrikeLab Tee — booking surface ORM models.

These mirror migration `010_booking_tee.py`. The relationships keep the
existing `TeeTime` table as the single source of truth for "I'm playing here at
this time" while `tee_sheets` + `tee_sheet_slots` describe what a course is
selling on a given day. A `booking_holds` row is created when a user picks a
slot, a `bookings` row is the final record once payment clears.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Time,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class BookingPreferences(Base):
    __tablename__ = "booking_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    time_bands = Column(JSONB, nullable=True)
    max_wind_ms = Column(Float, nullable=True)
    max_rain_pct = Column(Float, nullable=True)
    min_temp_c = Column(Float, nullable=True)
    course_types = Column(ARRAY(String(40)), nullable=True)
    solo_only = Column(Boolean, nullable=False, default=False)
    no_groups_behind_min = Column(Integer, nullable=True)
    walking_only = Column(Boolean, nullable=False, default=False)
    favorite_course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
    )
    default_player_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)
    show_to_pairs = Column(Boolean, nullable=False, default=False)
    handicap_visible = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class TeeSheet(Base):
    """Per-course/day publish of available slots."""

    __tablename__ = "tee_sheets"
    __table_args__ = (
        UniqueConstraint("course_id", "date", name="uq_tee_sheets_course_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    date = Column(Date, nullable=False)
    opens_at = Column(Time, nullable=False)
    closes_at = Column(Time, nullable=False)
    interval_min = Column(Integer, nullable=False, default=8)
    peak_price = Column(Float, nullable=True)
    off_price = Column(Float, nullable=True)
    golden_price = Column(Float, nullable=True)
    currency = Column(String(8), nullable=False, default="NOK")
    version = Column(Integer, nullable=False, default=1)
    provider = Column(String(40), nullable=False, default="internal")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    course = relationship("Course")
    slots = relationship(
        "TeeSheetSlot",
        back_populates="tee_sheet",
        cascade="all, delete-orphan",
        order_by="TeeSheetSlot.tee_time",
    )


class TeeSheetSlot(Base):
    __tablename__ = "tee_sheet_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tee_sheet_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tee_sheets.id", ondelete="CASCADE"),
        nullable=False,
    )
    tee_time = Column(DateTime, nullable=False)
    players_total = Column(Integer, nullable=False, default=4)
    players_taken = Column(Integer, nullable=False, default=0)
    price_amount = Column(Float, nullable=True)
    currency = Column(String(8), nullable=False, default="NOK")
    peak = Column(Boolean, nullable=False, default=False)
    golden = Column(Boolean, nullable=False, default=False)
    twilight = Column(Boolean, nullable=False, default=False)
    restrictions = Column(JSONB, nullable=True)
    is_blocked = Column(Boolean, nullable=False, default=False)
    provider_ref = Column(String(120), nullable=True)

    tee_sheet = relationship("TeeSheet", back_populates="slots")
    player_links = relationship(
        "SlotPlayerLink",
        back_populates="slot",
        cascade="all, delete-orphan",
    )

    @property
    def available(self) -> int:
        return max(0, self.players_total - self.players_taken)


class SlotPlayerLink(Base):
    __tablename__ = "slot_player_links"
    __table_args__ = (
        UniqueConstraint("slot_id", "tee_time_id", name="uq_slot_player_link"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tee_sheet_slots.id", ondelete="CASCADE"),
        nullable=False,
    )
    tee_time_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tee_times.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    seat_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    slot = relationship("TeeSheetSlot", back_populates="player_links")


class Playmate(Base):
    """A person the user has played with — registered or anonymous."""

    __tablename__ = "playmates"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "friend_user_id", name="uq_playmates_user_friend"
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    friend_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    display_name = Column(String(120), nullable=True)
    phone = Column(String(40), nullable=True)
    handicap = Column(Float, nullable=True)
    last_played_at = Column(DateTime, nullable=True)
    rounds_together = Column(Integer, nullable=False, default=0)
    public_handicap_visible = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class BookingHold(Base):
    """Persisted version of the in-memory `_HOLDS` dict."""

    __tablename__ = "booking_holds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    slot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tee_sheet_slots.id", ondelete="CASCADE"),
        nullable=True,
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
    )
    course_name = Column(String(200), nullable=False)
    tee_time = Column(DateTime, nullable=False)
    players = Column(Integer, nullable=False, default=1)
    player_payload = Column(JSONB, nullable=True)
    provider = Column(String(40), nullable=False, default="internal")
    provider_ref = Column(String(120), nullable=True)
    price_amount = Column(Float, nullable=True)
    currency = Column(String(8), nullable=False, default="NOK")
    total_amount = Column(Float, nullable=True)
    payment_method = Column(String(40), nullable=True)
    status = Column(String(20), nullable=False, default="held")
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    tee_time_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tee_times.id", ondelete="CASCADE"),
        nullable=True,
    )
    slot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tee_sheet_slots.id", ondelete="SET NULL"),
        nullable=True,
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="SET NULL"),
        nullable=True,
    )
    course_name = Column(String(200), nullable=False)
    tee_time = Column(DateTime, nullable=False)
    players_count = Column(Integer, nullable=False, default=1)
    players_payload = Column(JSONB, nullable=True)
    total_amount = Column(Float, nullable=True)
    currency = Column(String(8), nullable=False, default="NOK")
    payment_id = Column(String(120), nullable=True)
    payment_method = Column(String(40), nullable=True)
    payment_status = Column(String(20), nullable=True)
    split_mode = Column(String(20), nullable=False, default="together")
    qr_code = Column(String(240), nullable=True)
    check_in_code = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, default="confirmed")
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    course = relationship("Course")


class CourseConditions(Base):
    __tablename__ = "course_conditions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    captured_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    for_date = Column(Date, nullable=True)

    hourly = Column(JSONB, nullable=True)
    green_speed = Column(Float, nullable=True)
    fairway_state = Column(String(20), nullable=True)
    rough_state = Column(String(20), nullable=True)
    mowed_hrs_ago = Column(Integer, nullable=True)
    wind_ms = Column(Float, nullable=True)
    temp_c = Column(Float, nullable=True)
    sun_pct = Column(Float, nullable=True)
    cloud_pct = Column(Float, nullable=True)
    rain_pct = Column(Float, nullable=True)
    sunrise = Column(String(8), nullable=True)
    sunset = Column(String(8), nullable=True)
    golden_start = Column(String(8), nullable=True)
    source = Column(String(40), nullable=False, default="met.no")
