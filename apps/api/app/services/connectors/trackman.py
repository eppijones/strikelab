from datetime import datetime
from typing import Any

from app.services.connectors.base import BaseConnector, NormalizedSession, NormalizedShot


class TrackManConnector(BaseConnector):
    """
    TrackMan connector stub.
    
    In production, this would:
    1. Handle OAuth authentication with TrackMan
    2. Fetch data from TrackMan API
    3. Normalize to our internal schema
    """
    
    source_name = "trackman"
    
    # TrackMan-specific club mappings
    TRACKMAN_CLUBS = {
        "DR": "Driver",
        "3W": "3 Wood",
        "5W": "5 Wood",
        "7W": "7 Wood",
        "3H": "3 Hybrid",
        "4H": "4 Hybrid",
        "5H": "5 Hybrid",
        "3I": "3 Iron",
        "4I": "4 Iron",
        "5I": "5 Iron",
        "6I": "6 Iron",
        "7I": "7 Iron",
        "8I": "8 Iron",
        "9I": "9 Iron",
        "PW": "PW",
        "GW": "GW",
        "SW": "SW",
        "LW": "LW",
    }
    
    def map_club_name(self, raw_club: str) -> str:
        """Map TrackMan club codes to standard names."""
        if raw_club in self.TRACKMAN_CLUBS:
            return self.TRACKMAN_CLUBS[raw_club]
        return super().map_club_name(raw_club)
    
    def parse_raw(self, data: Any) -> NormalizedSession:
        """
        Parse TrackMan API response into normalized session.
        
        Expected data format (stub):
        {
            "session_id": "...",
            "date": "2024-01-01T10:00:00Z",
            "shots": [...]
        }
        """
        shots = self.extract_shots(data)
        
        return NormalizedSession(
            source=self.source_name,
            session_type="range",
            session_date=datetime.fromisoformat(data.get("date", datetime.utcnow().isoformat())),
            name=f"TrackMan Session {data.get('session_id', '')}",
            shots=shots,
            raw_data=data,
        )
    
    def extract_shots(self, data: Any) -> list[NormalizedShot]:
        """
        Extract shots from TrackMan API response.
        
        TrackMan data typically includes:
        - Ball: speed, launch angle, spin rate, spin axis, carry, total
        - Club: speed, attack angle, path
        - Face: angle, face to path, impact location
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
                club_speed=rs.get("club_speed"),
                smash_factor=rs.get("smash_factor"),
                launch_angle=rs.get("launch_angle"),
                spin_rate=rs.get("spin_rate"),
                spin_axis=rs.get("spin_axis"),
                face_angle=rs.get("face_angle"),
                face_to_path=rs.get("face_to_path"),
                attack_angle=rs.get("attack_angle"),
                club_path=rs.get("club_path"),
                offline_distance=rs.get("offline"),
                peak_height=rs.get("apex"),
                land_angle=rs.get("land_angle"),
                hang_time=rs.get("hang_time"),
                impact_height=rs.get("impact_height"),
                impact_offset=rs.get("impact_offset"),
            )
            shots.append(shot)
        
        return shots
