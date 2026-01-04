import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Session metadata
    source = Column(String(50), nullable=False)  # trackman, topgolf, foresight, csv
    session_type = Column(String(50), default="range")  # range, simulator, round
    name = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    session_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Raw data from connector
    raw_data = Column(JSON, nullable=True)
    
    # Computed statistics (cached)
    computed_stats = Column(JSON, nullable=True)
    # Example: {
    #   "shot_count": 50,
    #   "clubs_used": ["Driver", "7 Iron", "PW"],
    #   "avg_carry": { "Driver": 245.5, "7 Iron": 165.2 },
    #   "strike_score": 78,
    #   "face_control_score": 82,
    #   "distance_control_score": 75,
    #   "dispersion_score": 80
    # }
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    shots = relationship("Shot", back_populates="session", cascade="all, delete-orphan")
    log = relationship("SessionLog", back_populates="session", uselist=False, cascade="all, delete-orphan")
    coach_reports = relationship("CoachReport", back_populates="session", cascade="all, delete-orphan")
