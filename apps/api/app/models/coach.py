import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class CoachReport(Base):
    __tablename__ = "coach_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Report content (Diagnose → Interpret → Prescribe → Validate)
    diagnosis = Column(Text, nullable=True)
    # "Your face-to-path variance increased 40% compared to last session. 
    #  Strike score dropped from 82 to 71, primarily in the 7-iron block."
    
    interpretation = Column(Text, nullable=True)
    # "You logged 'stress' and energy 2/5. Combined with the late timing pattern,
    #  this suggests tension is affecting your release sequence."
    
    prescription = Column(Text, nullable=True)
    # "Drill: 10 slow-motion swings focusing on passive hands through impact.
    #  Constraint: Pause at top for 2 seconds before starting down."
    
    validation = Column(Text, nullable=True)
    # "Success metric: Face-to-path under 2° on next 7-iron session.
    #  Monitor: Smash factor should return to 1.41+ baseline."
    
    next_best_move = Column(Text, nullable=True)
    # "Short session tomorrow: 20 balls, 7-iron only, with pause drill.
    #  Log energy and feel before starting."
    
    # Linked metrics that support the analysis
    linked_metrics = Column(JSON, nullable=True)
    # {
    #   "strike_score_delta": -11,
    #   "face_to_path_variance": 4.2,
    #   "feel_correlation": {"tag": "stress", "metric_impact": "face_angle"}
    # }
    
    # Report metadata
    report_type = Column(String(50), default="session")  # session, weekly, trend
    language = Column(String(5), default="en")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="coach_reports")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True)
    
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    
    # Context attached to the message
    context = Column(JSON, nullable=True)
    # {"session_id": "...", "shot_ids": [...], "report_id": "..."}
    
    created_at = Column(DateTime, default=datetime.utcnow)
