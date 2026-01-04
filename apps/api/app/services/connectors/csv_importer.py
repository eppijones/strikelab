import csv
import io
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session as DBSession

from app.models.session import Session
from app.models.shot import Shot
from app.services.connectors.base import BaseConnector, NormalizedSession, NormalizedShot


class CSVImporter(BaseConnector):
    """Generic CSV importer for launch monitor data."""
    
    source_name = "csv"
    
    # Column name mappings (various formats to our standard)
    COLUMN_MAPPINGS = {
        # Shot number
        "shot_number": ["shot_number", "shot", "shot #", "shot_no", "#"],
        
        # Club
        "club": ["club", "club_name", "club name", "club type"],
        
        # Distances
        "carry_distance": ["carry_distance", "carry", "carry_dist", "carry (m)", "carry (yds)"],
        "total_distance": ["total_distance", "total", "total_dist", "total (m)", "total (yds)"],
        
        # Ball data
        "ball_speed": ["ball_speed", "ball speed", "ball_spd", "ball spd (mph)", "ball spd"],
        "launch_angle": ["launch_angle", "launch", "launch_ang", "vla", "launch (deg)"],
        "spin_rate": ["spin_rate", "spin", "total spin", "spin (rpm)"],
        "spin_axis": ["spin_axis", "spin axis", "axis", "spin axis (deg)"],
        
        # Club data
        "club_speed": ["club_speed", "club speed", "club_spd", "club spd (mph)"],
        "smash_factor": ["smash_factor", "smash", "smash factor"],
        "attack_angle": ["attack_angle", "attack", "aoa", "angle of attack"],
        
        # Face data
        "face_angle": ["face_angle", "face", "face angle", "face (deg)"],
        "face_to_path": ["face_to_path", "face to path", "ftp", "face-to-path"],
        
        # Offline
        "offline_distance": ["offline_distance", "offline", "side", "side (m)", "side (yds)"],
    }
    
    def parse_raw(self, data: str) -> NormalizedSession:
        """Parse CSV string into normalized session."""
        shots = self.extract_shots(data)
        
        return NormalizedSession(
            source=self.source_name,
            session_type="range",
            session_date=datetime.utcnow(),
            shots=shots,
            raw_data={"row_count": len(shots)},
        )
    
    def extract_shots(self, data: str) -> list[NormalizedShot]:
        """Extract shots from CSV data."""
        reader = csv.DictReader(io.StringIO(data))
        
        # Map header columns to our standard names
        column_map = self._build_column_map(reader.fieldnames or [])
        
        shots = []
        for i, row in enumerate(reader, start=1):
            shot = self._parse_row(row, column_map, i)
            if shot:
                shots.append(shot)
        
        return shots
    
    def _build_column_map(self, headers: list[str]) -> dict[str, str]:
        """Build mapping from CSV headers to our standard field names."""
        column_map = {}
        headers_lower = {h.lower().strip(): h for h in headers}
        
        for our_field, possible_names in self.COLUMN_MAPPINGS.items():
            for name in possible_names:
                if name.lower() in headers_lower:
                    column_map[our_field] = headers_lower[name.lower()]
                    break
        
        return column_map
    
    def _parse_row(
        self, row: dict, column_map: dict[str, str], row_num: int
    ) -> Optional[NormalizedShot]:
        """Parse a single CSV row into a NormalizedShot."""
        
        def get_float(field: str) -> Optional[float]:
            col = column_map.get(field)
            if not col or col not in row:
                return None
            try:
                val = row[col].strip()
                if not val or val in ["-", "N/A", "n/a", ""]:
                    return None
                return float(val)
            except (ValueError, AttributeError):
                return None
        
        def get_str(field: str) -> Optional[str]:
            col = column_map.get(field)
            if not col or col not in row:
                return None
            return row[col].strip() if row[col] else None
        
        # Get club (required)
        club = get_str("club")
        if not club:
            club = "Unknown"
        else:
            club = self.map_club_name(club)
        
        # Get shot number
        shot_num_col = column_map.get("shot_number")
        if shot_num_col and shot_num_col in row:
            try:
                shot_number = int(row[shot_num_col])
            except (ValueError, TypeError):
                shot_number = row_num
        else:
            shot_number = row_num
        
        return NormalizedShot(
            shot_number=shot_number,
            club=club,
            carry_distance=get_float("carry_distance"),
            total_distance=get_float("total_distance"),
            ball_speed=get_float("ball_speed"),
            club_speed=get_float("club_speed"),
            smash_factor=get_float("smash_factor"),
            launch_angle=get_float("launch_angle"),
            spin_rate=get_float("spin_rate"),
            spin_axis=get_float("spin_axis"),
            face_angle=get_float("face_angle"),
            face_to_path=get_float("face_to_path"),
            attack_angle=get_float("attack_angle"),
            offline_distance=get_float("offline_distance"),
        )
    
    def import_csv(
        self,
        csv_content: str,
        user_id: UUID,
        session_name: str,
        session_type: str,
        db: DBSession,
    ) -> dict:
        """Import CSV content and create session with shots in database."""
        
        # Parse CSV
        normalized = self.parse_raw(csv_content)
        
        if not normalized.shots:
            return {
                "success": False,
                "session_id": None,
                "shots_imported": 0,
                "errors": ["No valid shots found in CSV"],
                "warnings": [],
            }
        
        # Create session
        session = Session(
            user_id=user_id,
            source=self.source_name,
            session_type=session_type,
            name=session_name,
            session_date=normalized.session_date,
            raw_data=normalized.raw_data,
        )
        db.add(session)
        db.flush()  # Get session ID
        
        # Create shots
        for ns in normalized.shots:
            shot = Shot(
                session_id=session.id,
                shot_number=ns.shot_number,
                club=ns.club,
                carry_distance=ns.carry_distance,
                total_distance=ns.total_distance,
                ball_speed=ns.ball_speed,
                club_speed=ns.club_speed,
                smash_factor=ns.smash_factor,
                launch_angle=ns.launch_angle,
                spin_rate=ns.spin_rate,
                spin_axis=ns.spin_axis,
                face_angle=ns.face_angle,
                face_to_path=ns.face_to_path,
                attack_angle=ns.attack_angle,
                offline_distance=ns.offline_distance,
            )
            db.add(shot)
        
        db.commit()
        db.refresh(session)
        
        return {
            "success": True,
            "session_id": str(session.id),
            "shots_imported": len(normalized.shots),
            "errors": [],
            "warnings": [],
        }
