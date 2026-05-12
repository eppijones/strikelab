"""Caddie / on-course models.

These mirror the StrikeLab Caddie iOS data model so rounds and shots logged on
device sync into the unified backend and surface in the web app.
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Round(Base):
    __tablename__ = "rounds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    course_name = Column(String(200), nullable=False)

    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    selected_tee = Column(String(50), nullable=True)

    is_complete = Column(Boolean, default=False)
    current_hole_number = Column(Integer, default=1)

    # Course-level totals derived from the holes JSON below
    total_par = Column(Integer, default=72)
    total_gross = Column(Integer, default=0)
    total_net = Column(Integer, default=0)

    # Hole-by-hole detail stored as JSON for offline-first parity with the iOS app
    # Each item: {hole_number, par, handicap_index, strokes_received,
    #             gross_strokes, net_strokes, putts, fairway_hit, gir, notes}
    holes = Column(JSON, nullable=True)

    # Optional player + course handicap snapshots taken at the start of the round
    player_handicap_index = Column(Float, nullable=True)
    course_handicap = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Optimistic-concurrency token. Bumped on every successful write
    # (PATCH /rounds/{id}, POST shots, POST shots/bulk). Clients may
    # pass `If-Match: <version>` to detect stale writes — see
    # `app/routers/rounds.py`.
    version = Column(Integer, nullable=False, default=1, server_default="1")

    user = relationship("User")
    shots = relationship("RoundShot", back_populates="round", cascade="all, delete-orphan")


class RoundShot(Base):
    """A single GPS-tagged shot logged on the watch and synced to the phone."""

    __tablename__ = "round_shots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_id = Column(UUID(as_uuid=True), ForeignKey("rounds.id"), nullable=False)

    hole_number = Column(Integer, nullable=False)
    shot_number = Column(Integer, nullable=False)
    club = Column(String(20), nullable=False)

    timestamp = Column(DateTime, default=datetime.utcnow)

    start_lat = Column(Float, nullable=True)
    start_lon = Column(Float, nullable=True)
    end_lat = Column(Float, nullable=True)
    end_lon = Column(Float, nullable=True)

    distance_yards = Column(Float, nullable=True)
    distance_meters = Column(Float, nullable=True)

    confidence = Column(Float, nullable=True)
    is_manual = Column(Boolean, default=False)
    is_distance_manual = Column(Boolean, default=False)

    # Shot DNA enrichment (all optional)
    motion_data = Column(JSON, nullable=True)
    heart_rate_at_shot = Column(Float, nullable=True)
    heart_rate_variability = Column(Float, nullable=True)
    # Full 60 s HR window + RR intervals captured around the impact
    # moment. Populated by the watch via the EnhancedShotEvent payload.
    biometric_data = Column(JSON, nullable=True)
    weather = Column(JSON, nullable=True)
    outcome = Column(String(20), nullable=True)
    miss_direction = Column(String(20), nullable=True)
    lie_type = Column(String(20), nullable=True)
    shot_context = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    round = relationship("Round", back_populates="shots")


class PlayerShotDNA(Base):
    """Aggregate Shot DNA profile for a user — recomputed from shots."""

    __tablename__ = "player_shot_dna"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)

    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    total_shots = Column(Integer, default=0)
    consistency_score = Column(Float, nullable=True)

    # Per-club aggregates: { "DRV": ClubDNA-as-dict, ... }
    club_profiles = Column(JSON, nullable=True)

    stress_profile = Column(JSON, nullable=True)
    fatigue_profile = Column(JSON, nullable=True)
    common_mistakes = Column(JSON, nullable=True)

    # Phase 5 DNA fingerprints — populated by /dna/recompute when ≥3
    # motion-attached shots per club are available.
    tempo_signature = Column(JSON, nullable=True)
    plane_signature = Column(JSON, nullable=True)
    pressure_response = Column(JSON, nullable=True)


class GhostAdvice(Base):
    """A Ghost Caddie recommendation tied to a hole / shot context.

    These are produced server-side by `/caddie/recommend` so the web mirror and
    the watch can reference the same advisory text.
    """

    __tablename__ = "ghost_advice"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    round_id = Column(UUID(as_uuid=True), ForeignKey("rounds.id"), nullable=True)

    hole_number = Column(Integer, nullable=True)
    distance_yards = Column(Float, nullable=True)
    suggested_club = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=True)

    commit_phrase = Column(Text, nullable=True)
    rationale = Column(Text, nullable=True)
    feel_target = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
