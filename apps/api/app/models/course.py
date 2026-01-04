import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic info
    name = Column(String(200), nullable=False)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Course data
    par = Column(Integer, nullable=True)
    slope_rating = Column(Float, nullable=True)
    course_rating = Column(Float, nullable=True)
    
    # Hole data (optional)
    holes = Column(JSON, nullable=True)
    # [
    #   {"number": 1, "par": 4, "handicap": 7, "yards": 385},
    #   ...
    # ]
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # External IDs for booking integrations
    golfbox_id = Column(String(100), nullable=True)
    gimmie_id = Column(String(100), nullable=True)
    teeone_id = Column(String(100), nullable=True)
    
    # Metadata
    website = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tee_times = relationship("TeeTime", back_populates="course")


class TeeTime(Base):
    __tablename__ = "tee_times"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    
    # Tee time details
    tee_time = Column(DateTime, nullable=False)
    players = Column(JSON, nullable=True)  # ["John", "Jane", ...]
    notes = Column(Text, nullable=True)
    
    # Pre-round prep
    prep_notes = Column(Text, nullable=True)
    focus_areas = Column(JSON, nullable=True)  # ["tempo", "face control"]
    
    # Booking info
    booking_source = Column(String(50), nullable=True)  # golfbox, gimmie, teeone, manual
    booking_reference = Column(String(100), nullable=True)
    
    # Status
    status = Column(String(20), default="scheduled")  # scheduled, completed, cancelled
    
    # Link to session log (if completed)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="tee_times")
    course = relationship("Course", back_populates="tee_times")
