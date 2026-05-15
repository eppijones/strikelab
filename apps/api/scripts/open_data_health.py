"""Print operational health for the StrikeLab Open Golf API data layer."""
from __future__ import annotations

from sqlalchemy import func

from app.database import SessionLocal
from app.models import Course, CourseGeometry, DataSource


def main() -> None:
    db = SessionLocal()
    try:
        print("StrikeLab Open Golf Data")
        print(f"  sources: {db.query(func.count(DataSource.id)).scalar() or 0}")
        print(
            "  norway_courses: "
            f"{db.query(func.count(Course.id)).filter(Course.country_code == 'NO').scalar() or 0}"
        )
        print(f"  geometries: {db.query(func.count(CourseGeometry.id)).scalar() or 0}")
        latest = db.query(func.max(CourseGeometry.updated_at)).scalar()
        print(f"  latest_geometry_at: {latest or '—'}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
