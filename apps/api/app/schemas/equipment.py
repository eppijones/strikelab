from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# Club schemas
class ClubBase(BaseModel):
    club_type: str
    club_label: Optional[str] = None
    brand_id: str
    model_name: str
    year: Optional[int] = None
    shaft_brand: Optional[str] = None
    shaft_model: Optional[str] = None
    shaft_flex: Optional[str] = None
    shaft_weight: Optional[float] = None
    loft: Optional[float] = None
    lie: Optional[float] = None
    length: Optional[float] = None
    swing_weight: Optional[str] = None
    notes: Optional[str] = None
    sort_order: int = 0


class ClubCreate(ClubBase):
    pass


class ClubUpdate(BaseModel):
    club_type: Optional[str] = None
    club_label: Optional[str] = None
    brand_id: Optional[str] = None
    model_name: Optional[str] = None
    year: Optional[int] = None
    shaft_brand: Optional[str] = None
    shaft_model: Optional[str] = None
    shaft_flex: Optional[str] = None
    shaft_weight: Optional[float] = None
    loft: Optional[float] = None
    lie: Optional[float] = None
    length: Optional[float] = None
    swing_weight: Optional[str] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None


class ClubResponse(ClubBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    bag_id: UUID
    created_at: datetime
    updated_at: datetime


# Bag schemas
class BagBase(BaseModel):
    name: str = "My Bag"
    is_primary: int = 1
    ball_brand: Optional[str] = None
    ball_model: Optional[str] = None


class BagCreate(BagBase):
    clubs: Optional[List[ClubCreate]] = None


class BagUpdate(BaseModel):
    name: Optional[str] = None
    is_primary: Optional[int] = None
    ball_brand: Optional[str] = None
    ball_model: Optional[str] = None


class BagResponse(BagBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    clubs: List[ClubResponse] = []


class BagListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    is_primary: int
    club_count: int = 0


# Club stats schemas
class ClubStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    club_label: str
    total_shots: int
    good_shots: int
    
    avg_carry: Optional[float] = None
    max_carry: Optional[float] = None
    min_carry: Optional[float] = None
    std_carry: Optional[float] = None
    avg_total: Optional[float] = None
    
    avg_ball_speed: Optional[float] = None
    avg_launch_angle: Optional[float] = None
    avg_spin_rate: Optional[float] = None
    avg_peak_height: Optional[float] = None
    
    avg_club_speed: Optional[float] = None
    avg_smash_factor: Optional[float] = None
    avg_attack_angle: Optional[float] = None
    avg_club_path: Optional[float] = None
    avg_face_angle: Optional[float] = None
    avg_face_to_path: Optional[float] = None
    
    avg_offline: Optional[float] = None
    dispersion_radius: Optional[float] = None
    
    distance_percentile: Optional[int] = None
    accuracy_percentile: Optional[int] = None
    
    last_updated: datetime


# Quick add club (simplified)
class QuickAddClub(BaseModel):
    club_type: str
    club_label: str
    brand_id: str
    model_name: str
