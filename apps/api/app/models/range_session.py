"""Driving-range sessions synced from StrikeLab Caddie (Watch → iPhone → API)."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class RangeSession(Base):
    """One practice / range session; `id` is the client-generated session UUID."""

    __tablename__ = "range_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Full StrikeLab envelope or session document for analytics on web.
    payload = Column(JSON, nullable=False)

    schema_version = Column(Integer, nullable=False, default=1)
    shot_count = Column(Integer, nullable=False, default=0)
    start_time = Column(DateTime(timezone=True), nullable=True, index=True)
    location = Column(String(200), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="range_sessions")
