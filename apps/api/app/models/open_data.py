import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class DataSource(Base):
    """Public/open data source metadata used for legal attribution."""

    __tablename__ = "data_sources"

    id = Column(String(80), primary_key=True)
    name = Column(String(160), nullable=False)
    category = Column(String(40), nullable=False)
    license_name = Column(String(120), nullable=False)
    license_url = Column(String(500), nullable=True)
    attribution = Column(Text, nullable=False)
    source_url = Column(String(500), nullable=True)
    terms_url = Column(String(500), nullable=True)
    refresh_interval_hours = Column(Integer, nullable=True)
    is_open = Column(Boolean, nullable=False, default=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CourseGeometry(Base):
    """Hole and feature geometry collected from open map sources."""

    __tablename__ = "course_geometries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(String(80), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    osm_id = Column(String(80), nullable=True)
    geometry_version = Column(String(40), nullable=False, default="v1")
    features = Column(JSONB, nullable=False, default=dict)
    summary = Column(JSONB, nullable=True)
    validation = Column(JSONB, nullable=True)
    confidence = Column(Float, nullable=True)
    attribution = Column(Text, nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    course = relationship("Course")
    source = relationship("DataSource")
