from datetime import datetime
from typing import Any

from app.services.connectors.base import BaseConnector, NormalizedSession, NormalizedShot


class TopgolfConnector(BaseConnector):
    """
    Topgolf/Toptracer connector stub.
    
    In production, this would:
    1. Authenticate with Topgolf/Toptracer API
    2. Fetch session data
    3. Normalize to our internal schema
    
    Note: Toptracer provides less detailed data than TrackMan
    """
    
    source_name = "topgolf"
    
    def parse_raw(self, data: Any) -> NormalizedSession:
        """Parse Topgolf API response into normalized session."""
        shots = self.extract_shots(data)
        
        return NormalizedSession(
            source=self.source_name,
            session_type="range",
            session_date=datetime.fromisoformat(data.get("date", datetime.utcnow().isoformat())),
            name=f"Topgolf Session",
            shots=shots,
            raw_data=data,
        )
    
    def extract_shots(self, data: Any) -> list[NormalizedShot]:
        """
        Extract shots from Topgolf API response.
        
        Toptracer typically provides:
        - Carry distance
        - Total distance
        - Ball speed
        - Launch angle
        - Offline distance
        - Basic spin estimate
        
        Does NOT typically provide:
        - Club speed
        - Face/path data
        - Impact location
        """
        shots = []
        raw_shots = data.get("shots", [])
        
        for i, rs in enumerate(raw_shots, start=1):
            shot = NormalizedShot(
                shot_number=rs.get("shot_number", i),
                club=self.map_club_name(rs.get("club", "Unknown")),
                carry_distance=rs.get("carry"),
                total_distance=rs.get("total"),
                ball_speed=rs.get("ball_speed"),
                launch_angle=rs.get("launch_angle"),
                spin_rate=rs.get("spin_rate"),  # Often estimated
                offline_distance=rs.get("offline"),
            )
            shots.append(shot)
        
        return shots
