"""
Demo Data Seeder for StrikeLab

Run with: python -m app.seed.demo_data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta
import random
from uuid import uuid4

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Session as SessionModel, Shot, SessionLogTemplate, SessionLog,
    CoachReport, Course, Drill
)
from app.services.auth import hash_password
from app.seed.templates import get_templates


def seed_database():
    """Seed the database with demo data."""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Seeding database...")
        
        # Check if already seeded
        existing_user = db.query(User).filter(User.email == "demo@strikelab.golf").first()
        if existing_user:
            print("Database already seeded. Skipping.")
            return
        
        # Create demo user
        demo_user = User(
            id=uuid4(),
            email="demo@strikelab.golf",
            password_hash=hash_password("demo123"),
            display_name="Demo Golfer",
            handicap_index=8.5,
            language="en",
            units="yards",
        )
        db.add(demo_user)
        db.flush()
        print(f"Created demo user: demo@strikelab.golf / demo123")
        
        # Seed templates
        for template_data in get_templates():
            template = SessionLogTemplate(
                name=template_data["name"],
                language=template_data["language"],
                description=template_data["description"],
                structure=template_data["structure"],
                is_default=template_data["is_default"],
                is_system=template_data["is_system"],
            )
            db.add(template)
        print(f"Created {len(get_templates())} session log templates")
        
        # Create demo session with shots
        session = SessionModel(
            id=uuid4(),
            user_id=demo_user.id,
            source="csv",
            session_type="range",
            name="Demo Range Session",
            session_date=datetime.utcnow() - timedelta(days=1),
            computed_stats={
                "shot_count": 25,
                "clubs_used": ["Driver", "7 Iron", "PW", "56 Wedge", "5 Iron"],
                "strike_score": 78,
                "face_control_score": 82,
                "distance_control_score": 75,
                "dispersion_score": 80,
            },
        )
        db.add(session)
        db.flush()
        
        # Generate demo shots
        shots_data = [
            # Driver shots
            {"club": "Driver", "carry": 245, "spin": 2400, "smash": 1.41},
            {"club": "Driver", "carry": 251, "spin": 2300, "smash": 1.42},
            {"club": "Driver", "carry": 238, "spin": 2600, "smash": 1.40},
            {"club": "Driver", "carry": 248, "spin": 2400, "smash": 1.42},
            {"club": "Driver", "carry": 243, "spin": 2500, "smash": 1.40},
            # 7 Iron shots
            {"club": "7 Iron", "carry": 165, "spin": 6200, "smash": 1.41},
            {"club": "7 Iron", "carry": 168, "spin": 6000, "smash": 1.41},
            {"club": "7 Iron", "carry": 163, "spin": 6400, "smash": 1.40},
            {"club": "7 Iron", "carry": 170, "spin": 5900, "smash": 1.42},
            {"club": "7 Iron", "carry": 166, "spin": 6100, "smash": 1.41},
            # PW shots
            {"club": "PW", "carry": 125, "spin": 8900, "smash": 1.32},
            {"club": "PW", "carry": 127, "spin": 8700, "smash": 1.32},
            {"club": "PW", "carry": 123, "spin": 9200, "smash": 1.31},
            {"club": "PW", "carry": 128, "spin": 8600, "smash": 1.32},
            {"club": "PW", "carry": 126, "spin": 8800, "smash": 1.32},
            # 56 Wedge shots
            {"club": "56 Wedge", "carry": 85, "spin": 10200, "smash": 1.18},
            {"club": "56 Wedge", "carry": 82, "spin": 10600, "smash": 1.16},
            {"club": "56 Wedge", "carry": 87, "spin": 9900, "smash": 1.17},
            {"club": "56 Wedge", "carry": 84, "spin": 10400, "smash": 1.17},
            {"club": "56 Wedge", "carry": 86, "spin": 10100, "smash": 1.18},
            # 5 Iron shots
            {"club": "5 Iron", "carry": 185, "spin": 5200, "smash": 1.43},
            {"club": "5 Iron", "carry": 188, "spin": 5000, "smash": 1.43},
            {"club": "5 Iron", "carry": 182, "spin": 5400, "smash": 1.42},
            {"club": "5 Iron", "carry": 190, "spin": 4900, "smash": 1.43},
            {"club": "5 Iron", "carry": 186, "spin": 5100, "smash": 1.43},
        ]
        
        for i, shot_data in enumerate(shots_data, start=1):
            shot = Shot(
                session_id=session.id,
                shot_number=i,
                club=shot_data["club"],
                carry_distance=shot_data["carry"] + random.uniform(-2, 2),
                total_distance=shot_data["carry"] + random.uniform(8, 15),
                ball_speed=shot_data["carry"] * 0.65 + random.uniform(-1, 1),
                club_speed=shot_data["carry"] * 0.46 + random.uniform(-1, 1),
                smash_factor=shot_data["smash"],
                launch_angle=random.uniform(10, 18) if shot_data["club"] == "Driver" else random.uniform(16, 26),
                spin_rate=shot_data["spin"] + random.uniform(-200, 200),
                spin_axis=random.uniform(-3, 3),
                face_angle=random.uniform(-1.5, 1.5),
                face_to_path=random.uniform(-1, 1),
                attack_angle=random.uniform(-5, 3),
                offline_distance=random.uniform(-8, 8),
            )
            db.add(shot)
        
        print(f"Created demo session with {len(shots_data)} shots")
        
        # Create demo session log
        session_log = SessionLog(
            session_id=session.id,
            user_id=demo_user.id,
            energy_level=4,
            mental_state=3,
            intent="Working on face control with irons",
            routine_discipline=True,
            feel_tags=["focused", "smooth"],
            shot_blocks=[
                {"name": "Warmup", "hit_target": True, "miss_pattern": None},
                {"name": "Main Session", "hit_target": True, "miss_pattern": "slight push"},
            ],
            what_worked="Tempo was good. Face felt square at impact.",
            take_forward="Maintain pause at top before starting down",
            dont_overthink="Don't worry about distance - focus on strike quality",
            coach_note="Energy correlates with better face control - stay rested before sessions",
            fatigue_mode=False,
        )
        db.add(session_log)
        print("Created demo session log")
        
        # Create demo coach report
        coach_report = CoachReport(
            session_id=session.id,
            user_id=demo_user.id,
            diagnosis="Session contained 25 valid shots across 5 clubs. Face control solid (score: 82). Strike quality needs attention in driver block.",
            interpretation="You logged 'focused' and energy 4/5. The smooth tempo feel correlated with your best face numbers in the iron shots.",
            prescription="Drill: 10 slow-motion swings focusing on passive hands through impact. Constraint: Pause 2 seconds at top before starting down.",
            validation="Success metric: Face-to-path under 2° on next iron session. Monitor smash factor to ensure strike quality doesn't suffer.",
            next_best_move="Short session tomorrow: 20 balls, 7-iron only, with pause drill. Log energy and feel before starting.",
            linked_metrics={
                "strike_score": 78,
                "face_control_score": 82,
                "feel_correlation": {"tag": "smooth", "metric_impact": "face_to_path"},
            },
            report_type="session",
            language="en",
        )
        db.add(coach_report)
        print("Created demo coach report")
        
        # Create demo courses
        courses = [
            {
                "name": "Oslo Golf Club",
                "city": "Oslo",
                "country": "Norway",
                "par": 72,
                "slope_rating": 131,
                "course_rating": 72.5,
            },
            {
                "name": "Bogstad GK",
                "city": "Oslo",
                "country": "Norway",
                "par": 72,
                "slope_rating": 128,
                "course_rating": 71.8,
            },
            {
                "name": "Holtsmark GK",
                "city": "Drammen",
                "country": "Norway",
                "par": 72,
                "slope_rating": 125,
                "course_rating": 70.2,
            },
        ]
        
        for course_data in courses:
            course = Course(**course_data)
            db.add(course)
        print(f"Created {len(courses)} demo courses")
        
        # Create demo drills
        drills = [
            {
                "name": "Pause at Top",
                "name_no": "Pause på toppen",
                "description": "Hold for 2 seconds at the top of your backswing before starting down",
                "description_no": "Hold 2 sekunder på toppen av baksving før du starter ned",
                "category": "technique",
                "focus_area": "tempo",
                "clubs": ["7 Iron"],
                "reps": 10,
                "instructions": [
                    "Take your normal address",
                    "Make a full backswing",
                    "Pause for a full 2 seconds at the top",
                    "Start down smoothly",
                    "Focus on passive hands"
                ],
                "constraints": ["No rushing the transition"],
                "success_metric": "Face-to-path",
                "success_threshold": 2.0,
            },
            {
                "name": "Eyes Closed Backswing",
                "name_no": "Øyne lukket på baksving",
                "description": "Close your eyes during the backswing to enhance feel and body awareness",
                "description_no": "Lukk øynene under baksvingen for å forbedre følelse og kroppsbevissthet",
                "category": "feel",
                "focus_area": "awareness",
                "clubs": ["7 Iron", "PW"],
                "reps": 10,
                "instructions": [
                    "Set up normally with eyes open",
                    "Close eyes as you begin the backswing",
                    "Open eyes at the top",
                    "Complete the swing normally"
                ],
                "constraints": ["Start with half swings"],
                "success_metric": "Strike quality",
            },
            {
                "name": "Gate Drill",
                "name_no": "Port-øvelse",
                "description": "Place two tees creating a gate for the club to pass through",
                "description_no": "Plasser to pegger som lager en port som kølla skal passere gjennom",
                "category": "technique",
                "focus_area": "path",
                "clubs": ["7 Iron"],
                "reps": 15,
                "instructions": [
                    "Place two tees about 4 inches apart",
                    "Position gate just outside the ball",
                    "Swing without hitting the tees",
                    "Focus on in-to-out path"
                ],
                "success_metric": "Club path",
                "success_threshold": 2.0,
            },
        ]
        
        for drill_data in drills:
            drill = Drill(**drill_data, is_system=True)
            db.add(drill)
        print(f"Created {len(drills)} demo drills")
        
        db.commit()
        print("\nDatabase seeded successfully!")
        print("\nDemo credentials:")
        print("  Email: demo@strikelab.golf")
        print("  Password: demo123")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
