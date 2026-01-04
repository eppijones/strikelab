import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Shot(Base):
    __tablename__ = "shots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    
    # Shot metadata
    shot_number = Column(Integer, nullable=False)
    club = Column(String(50), nullable=False)
    target_distance = Column(Float, nullable=True)
    
    # Ball flight data
    carry_distance = Column(Float, nullable=True)  # meters
    total_distance = Column(Float, nullable=True)  # meters
    ball_speed = Column(Float, nullable=True)  # m/s
    launch_angle = Column(Float, nullable=True)  # degrees
    spin_rate = Column(Float, nullable=True)  # rpm
    spin_axis = Column(Float, nullable=True)  # degrees (positive = draw spin)
    peak_height = Column(Float, nullable=True)  # meters
    land_angle = Column(Float, nullable=True)  # degrees
    hang_time = Column(Float, nullable=True)  # seconds
    offline_distance = Column(Float, nullable=True)  # meters (positive = right)
    
    # Club data
    club_speed = Column(Float, nullable=True)  # m/s
    smash_factor = Column(Float, nullable=True)
    attack_angle = Column(Float, nullable=True)  # degrees
    club_path = Column(Float, nullable=True)  # degrees
    
    # Face data
    face_angle = Column(Float, nullable=True)  # degrees
    face_to_path = Column(Float, nullable=True)  # degrees
    face_to_target = Column(Float, nullable=True)  # degrees
    
    # Impact location
    impact_height = Column(Float, nullable=True)  # mm from center
    impact_offset = Column(Float, nullable=True)  # mm from center (positive = toe)
    
    # Mishit tracking
    is_mishit = Column(Boolean, default=False)
    mishit_type = Column(String(50), nullable=True)  # thin, fat, toe, heel, shank
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="shots")
