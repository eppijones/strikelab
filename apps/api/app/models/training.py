import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class TrainingPlan(Base):
    __tablename__ = "training_plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Plan metadata
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    focus_area = Column(String(100), nullable=True)  # strike, face_control, distance, dispersion
    
    # Plan structure
    # {
    #   "weeks": 4,
    #   "sessions_per_week": 3,
    #   "schedule": [
    #     {"day": "monday", "type": "drill", "duration_minutes": 45},
    #     {"day": "wednesday", "type": "pressure", "duration_minutes": 30},
    #     {"day": "friday", "type": "testing", "duration_minutes": 60}
    #   ]
    # }
    structure = Column(JSON, nullable=True)
    
    # Drill blocks
    drill_ids = Column(JSON, nullable=True)  # List of drill UUIDs
    
    # Validation metrics
    validation_metrics = Column(JSON, nullable=True)
    # {"strike_score": {"baseline": 71, "target": 80}, ...}
    
    # Progress tracking
    week_number = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Adherence tracking
    adherence_data = Column(JSON, nullable=True)
    # [{"week": 1, "planned": 3, "completed": 2}, ...]
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="training_plans")


class Drill(Base):
    __tablename__ = "drills"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Drill info
    name = Column(String(200), nullable=False)
    name_no = Column(String(200), nullable=True)  # Norwegian name
    description = Column(Text, nullable=True)
    description_no = Column(Text, nullable=True)  # Norwegian description
    
    # Categorization
    category = Column(String(50), nullable=True)  # technique, pressure, speed, feel
    focus_area = Column(String(100), nullable=True)  # strike, face_control, tempo
    clubs = Column(JSON, nullable=True)  # ["7 Iron", "PW"]
    
    # Drill parameters
    reps = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Instructions
    instructions = Column(JSON, nullable=True)
    # ["Step 1...", "Step 2...", ...]
    instructions_no = Column(JSON, nullable=True)
    
    # Constraints/rules
    constraints = Column(JSON, nullable=True)
    # ["Eyes closed on backswing", "Pause 2s at top"]
    
    # Success criteria
    success_metric = Column(String(200), nullable=True)
    success_threshold = Column(Float, nullable=True)
    
    # System drill vs user-created
    is_system = Column(Boolean, default=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class SwingVideo(Base):
    __tablename__ = "swing_videos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True)
    shot_id = Column(UUID(as_uuid=True), ForeignKey("shots.id"), nullable=True)
    
    # Video metadata
    view_type = Column(String(20), nullable=False)  # face_on, dtl (down the line)
    club = Column(String(50), nullable=True)
    
    # Storage
    video_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Processing status
    status = Column(String(20), default="uploaded")  # uploaded, processing, analyzed, failed
    
    # Key frames (extracted positions)
    key_frames = Column(JSON, nullable=True)
    # {
    #   "address": {"timestamp": 0.5, "url": "..."},
    #   "top": {"timestamp": 1.2, "url": "..."},
    #   "impact": {"timestamp": 1.8, "url": "..."},
    #   "finish": {"timestamp": 2.5, "url": "..."}
    # }
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="swing_videos")
    analysis = relationship("SwingAnalysis", back_populates="video", uselist=False)


class SwingAnalysis(Base):
    __tablename__ = "swing_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("swing_videos.id"), nullable=False)
    
    # Pose metrics
    pose_data = Column(JSON, nullable=True)
    # {
    #   "address": {"spine_angle": 32, "knee_flex": 25, ...},
    #   "top": {"shoulder_turn": 90, "hip_turn": 45, ...},
    #   "impact": {"shaft_lean": 8, "hip_open": 40, ...}
    # }
    
    # AI feedback
    feedback = Column(JSON, nullable=True)
    # {
    #   "positives": ["Good spine angle at address", "Full shoulder turn"],
    #   "areas_to_improve": ["Early extension through impact"],
    #   "drills": ["drill_uuid_1", "drill_uuid_2"]
    # }
    
    # Comparison to previous
    comparison = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    video = relationship("SwingVideo", back_populates="analysis")


class MetricSnapshot(Base):
    """Track metric trends over time for dashboard and comparison"""
    __tablename__ = "metric_snapshots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Snapshot date (usually end of session or weekly rollup)
    snapshot_date = Column(DateTime, nullable=False)
    snapshot_type = Column(String(20), default="session")  # session, weekly, monthly
    
    # Scores
    strike_score = Column(Float, nullable=True)
    face_control_score = Column(Float, nullable=True)
    distance_control_score = Column(Float, nullable=True)
    dispersion_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)
    
    # Key metrics by club
    metrics_by_club = Column(JSON, nullable=True)
    # {
    #   "Driver": {"avg_carry": 245, "smash": 1.42, "spin": 2400},
    #   "7 Iron": {"avg_carry": 165, "smash": 1.41, "spin": 6200}
    # }
    
    # Handicap estimate
    handicap_estimate = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
