import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class SessionLogTemplate(Base):
    __tablename__ = "session_log_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    language = Column(String(5), default="en")  # en, no
    description = Column(Text, nullable=True)
    
    # Template structure as JSON
    # Example:
    # {
    #   "pre_session": {
    #     "energy": {"type": "scale", "min": 1, "max": 5, "label": "Energy Level"},
    #     "mental_state": {"type": "scale", "min": 1, "max": 5, "label": "Mental State"},
    #     "intent": {"type": "text", "placeholder": "What are you working on?"},
    #     "routine_discipline": {"type": "boolean", "label": "Following routine?"},
    #     "feel_tags": {"type": "tags", "options": ["calm", "heavy", "late", "stress", "focused"]}
    #   },
    #   "shot_blocks": [
    #     {"name": "Warmup", "fields": ["hit_target", "miss_pattern"]},
    #     {"name": "Main Session", "fields": ["hit_target", "miss_pattern", "notes"]}
    #   ],
    #   "post_session": {
    #     "what_worked": {"type": "text", "label": "What worked?"},
    #     "take_forward": {"type": "text", "label": "What to take forward?"},
    #     "dont_overthink": {"type": "text", "label": "What not to overthink?"},
    #     "coach_note": {"type": "text", "label": "Note to self"}
    #   },
    #   "fatigue_mode": true
    # }
    structure = Column(JSON, nullable=False)
    
    is_default = Column(Boolean, default=False)
    is_system = Column(Boolean, default=True)  # System templates can't be deleted
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    logs = relationship("SessionLog", back_populates="template")


class SessionLog(Base):
    __tablename__ = "session_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("session_log_templates.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tee_time_id = Column(UUID(as_uuid=True), ForeignKey("tee_times.id"), nullable=True)
    
    # Pre-session fields
    energy_level = Column(Integer, nullable=True)  # 1-5
    mental_state = Column(Integer, nullable=True)  # 1-5
    intent = Column(Text, nullable=True)
    routine_discipline = Column(Boolean, nullable=True)
    feel_tags = Column(JSON, nullable=True)  # ["calm", "focused"]
    
    # Shot blocks data
    shot_blocks = Column(JSON, nullable=True)
    # Example:
    # [
    #   {"name": "Warmup", "hit_target": true, "miss_pattern": "push"},
    #   {"name": "Main Session", "hit_target": false, "miss_pattern": "pull", "notes": "..."}
    # ]
    
    # Post-session fields
    what_worked = Column(Text, nullable=True)
    take_forward = Column(Text, nullable=True)
    dont_overthink = Column(Text, nullable=True)
    coach_note = Column(Text, nullable=True)
    
    # Voice note (future)
    voice_note_url = Column(String(500), nullable=True)
    voice_transcription = Column(Text, nullable=True)
    
    # Fatigue mode flag
    fatigue_mode = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="log")
    template = relationship("SessionLogTemplate", back_populates="logs")
