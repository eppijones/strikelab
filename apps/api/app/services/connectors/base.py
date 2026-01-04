from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Any
from datetime import datetime


@dataclass
class NormalizedShot:
    """Universal shot representation across all connectors."""
    shot_number: int
    club: str
    carry_distance: Optional[float] = None
    total_distance: Optional[float] = None
    ball_speed: Optional[float] = None
    club_speed: Optional[float] = None
    smash_factor: Optional[float] = None
    launch_angle: Optional[float] = None
    spin_rate: Optional[float] = None
    spin_axis: Optional[float] = None
    face_angle: Optional[float] = None
    face_to_path: Optional[float] = None
    attack_angle: Optional[float] = None
    offline_distance: Optional[float] = None
    peak_height: Optional[float] = None
    land_angle: Optional[float] = None
    hang_time: Optional[float] = None
    club_path: Optional[float] = None
    face_to_target: Optional[float] = None
    impact_height: Optional[float] = None
    impact_offset: Optional[float] = None
    is_mishit: bool = False
    mishit_type: Optional[str] = None


@dataclass
class NormalizedSession:
    """Universal session representation across all connectors."""
    source: str
    session_type: str
    session_date: datetime
    name: Optional[str] = None
    notes: Optional[str] = None
    raw_data: Optional[dict[str, Any]] = None
    shots: list[NormalizedShot] = None
    
    def __post_init__(self):
        if self.shots is None:
            self.shots = []


class BaseConnector(ABC):
    """Base class for all data source connectors."""
    
    source_name: str = "unknown"
    
    # Standard club name mappings
    CLUB_ALIASES = {
        # Driver
        "dr": "Driver",
        "driver": "Driver",
        "1w": "Driver",
        "d": "Driver",
        
        # Woods
        "3w": "3 Wood",
        "3-wood": "3 Wood",
        "3 wood": "3 Wood",
        "5w": "5 Wood",
        "5-wood": "5 Wood",
        "5 wood": "5 Wood",
        "7w": "7 Wood",
        "7-wood": "7 Wood",
        
        # Hybrids
        "2h": "2 Hybrid",
        "2-hybrid": "2 Hybrid",
        "3h": "3 Hybrid",
        "3-hybrid": "3 Hybrid",
        "4h": "4 Hybrid",
        "4-hybrid": "4 Hybrid",
        "5h": "5 Hybrid",
        "5-hybrid": "5 Hybrid",
        
        # Irons
        "3i": "3 Iron",
        "3-iron": "3 Iron",
        "3 iron": "3 Iron",
        "4i": "4 Iron",
        "4-iron": "4 Iron",
        "4 iron": "4 Iron",
        "5i": "5 Iron",
        "5-iron": "5 Iron",
        "5 iron": "5 Iron",
        "6i": "6 Iron",
        "6-iron": "6 Iron",
        "6 iron": "6 Iron",
        "7i": "7 Iron",
        "7-iron": "7 Iron",
        "7 iron": "7 Iron",
        "8i": "8 Iron",
        "8-iron": "8 Iron",
        "8 iron": "8 Iron",
        "9i": "9 Iron",
        "9-iron": "9 Iron",
        "9 iron": "9 Iron",
        
        # Wedges
        "pw": "PW",
        "pitching wedge": "PW",
        "pitching": "PW",
        "gw": "GW",
        "gap wedge": "GW",
        "gap": "GW",
        "aw": "GW",
        "approach wedge": "GW",
        "sw": "SW",
        "sand wedge": "SW",
        "sand": "SW",
        "lw": "LW",
        "lob wedge": "LW",
        "lob": "LW",
        "52": "52 Wedge",
        "52 degree": "52 Wedge",
        "52°": "52 Wedge",
        "54": "54 Wedge",
        "54 degree": "54 Wedge",
        "54°": "54 Wedge",
        "56": "56 Wedge",
        "56 degree": "56 Wedge",
        "56°": "56 Wedge",
        "58": "58 Wedge",
        "58 degree": "58 Wedge",
        "58°": "58 Wedge",
        "60": "60 Wedge",
        "60 degree": "60 Wedge",
        "60°": "60 Wedge",
        
        # Putter
        "putter": "Putter",
        "pt": "Putter",
    }
    
    def map_club_name(self, raw_club: str) -> str:
        """Normalize club names to standard format."""
        if not raw_club:
            return "Unknown"
        
        normalized = raw_club.lower().strip()
        return self.CLUB_ALIASES.get(normalized, raw_club.title())
    
    @abstractmethod
    def parse_raw(self, data: Any) -> NormalizedSession:
        """Parse raw data into normalized format."""
        pass
    
    @abstractmethod
    def extract_shots(self, data: Any) -> list[NormalizedShot]:
        """Extract shots from raw data."""
        pass
