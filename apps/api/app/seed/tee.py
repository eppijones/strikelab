"""Seed StrikeLab Tee with 5 demo NO clubs × 14 days of tee sheets +
hourly weather conditions.

The data mirrors the numbers in `StrikeLabResearch/Golf Booking System/data.js`
so the implemented surface looks identical to the prototype out of the box.

Run standalone:
    python -m app.seed.tee
"""
from __future__ import annotations

import os
import random
import sys
from datetime import date, datetime, time as dt_time, timedelta
from typing import Any

from sqlalchemy.orm import Session

if __name__ == "__main__" and __package__ is None:
    sys.path.insert(
        0,
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    )

from app.database import Base, SessionLocal, engine
from app.models.booking import CourseConditions, TeeSheet, TeeSheetSlot
from app.models.course import Course


# ─────────────────────────────────────────────────────────────────────
# Course definitions (faithful to data.js).
# ─────────────────────────────────────────────────────────────────────


COURSE_DEFS: list[dict[str, Any]] = [
    {
        "name": "Losby Golfklubb",
        "city": "Lørenskog",
        "region": "Akershus",
        "country": "Norway",
        "country_code": "NO",
        "course_type": "parkland",
        "holes_count": 18,
        "par": 72,
        "total_meters": 6087,
        "latitude": 59.9277,
        "longitude": 11.0470,
        "established": 1996,
        "website": "https://www.losbygolf.no",
        "is_verified": True,
        "booking_provider": "internal",
        "peak_price": 1100,
        "off_price": 750,
        "golden_price": 950,
        "window": ("golden", 18, 21),
        "hourly": [
            (5, 11, 3, "SW", 0.10, 0.6, 0.0),
            (6, 13, 3, "SW", 0.20, 0.5, 0.0),
            (7, 15, 4, "SW", 0.35, 0.4, 0.0),
            (8, 17, 5, "W", 0.55, 0.3, 0.0),
            (9, 19, 6, "W", 0.70, 0.3, 0.0),
            (10, 20, 6, "W", 0.82, 0.2, 0.0),
            (11, 21, 7, "W", 0.92, 0.2, 0.0),
            (12, 22, 7, "W", 0.98, 0.1, 0.0),
            (13, 22, 8, "NW", 1.00, 0.1, 0.0),
            (14, 22, 8, "NW", 0.96, 0.2, 0.0),
            (15, 21, 7, "NW", 0.88, 0.3, 0.0),
            (16, 20, 6, "N", 0.78, 0.4, 0.0),
            (17, 19, 5, "N", 0.65, 0.4, 0.0),
            (18, 18, 4, "N", 0.50, 0.3, 0.0),
            (19, 17, 3, "N", 0.34, 0.2, 0.0),
            (20, 15, 2, "N", 0.20, 0.2, 0.0),
            (21, 13, 2, "N", 0.05, 0.3, 0.0),
        ],
        "sunrise": "04:38",
        "sunset": "21:08",
        "golden_start": "19:45",
    },
    {
        "name": "Larvik Golfklubb",
        "city": "Larvik",
        "region": "Vestfold",
        "country": "Norway",
        "country_code": "NO",
        "course_type": "links",
        "holes_count": 18,
        "par": 71,
        "total_meters": 5742,
        "latitude": 59.0530,
        "longitude": 10.0290,
        "established": 1989,
        "website": "https://www.larvikgolf.no",
        "is_verified": True,
        "booking_provider": "internal",
        "peak_price": 950,
        "off_price": 650,
        "golden_price": 800,
        "window": ("calm-after-wind", 17, 19),
        "hourly": [
            (5, 12, 6, "SW", 0.10, 0.4, 0.0),
            (6, 13, 7, "SW", 0.22, 0.3, 0.0),
            (7, 14, 8, "SW", 0.38, 0.3, 0.0),
            (8, 16, 9, "W", 0.55, 0.2, 0.0),
            (9, 18, 10, "W", 0.72, 0.2, 0.0),
            (10, 19, 11, "W", 0.85, 0.2, 0.0),
            (11, 20, 12, "W", 0.94, 0.1, 0.0),
            (12, 21, 13, "W", 1.00, 0.1, 0.0),
            (13, 21, 13, "NW", 0.97, 0.1, 0.0),
            (14, 20, 12, "NW", 0.90, 0.2, 0.0),
            (15, 20, 11, "NW", 0.82, 0.2, 0.0),
            (16, 19, 9, "N", 0.72, 0.2, 0.0),
            (17, 18, 7, "N", 0.60, 0.2, 0.0),
            (18, 17, 5, "N", 0.46, 0.2, 0.0),
            (19, 16, 4, "N", 0.32, 0.2, 0.0),
            (20, 15, 3, "N", 0.18, 0.3, 0.0),
            (21, 14, 3, "N", 0.04, 0.4, 0.0),
        ],
        "sunrise": "04:48",
        "sunset": "21:35",
        "golden_start": "20:10",
    },
    {
        "name": "Miklagard Golf",
        "city": "Kløfta",
        "region": "Akershus",
        "country": "Norway",
        "country_code": "NO",
        "course_type": "championship",
        "holes_count": 18,
        "par": 73,
        "total_meters": 6321,
        "latitude": 60.0670,
        "longitude": 11.1180,
        "established": 1992,
        "website": "https://www.miklagardgolf.no",
        "is_verified": True,
        "booking_provider": "internal",
        "peak_price": 1350,
        "off_price": 950,
        "golden_price": 1200,
        "window": ("morning-calm", 8, 11),
        "hourly": [
            (5, 10, 2, "SE", 0.10, 0.3, 0.0),
            (6, 12, 2, "SE", 0.22, 0.2, 0.0),
            (7, 14, 3, "SE", 0.38, 0.2, 0.0),
            (8, 16, 3, "S", 0.55, 0.1, 0.0),
            (9, 18, 4, "S", 0.72, 0.1, 0.0),
            (10, 20, 5, "S", 0.85, 0.1, 0.0),
            (11, 21, 5, "S", 0.94, 0.1, 0.0),
            (12, 22, 6, "SW", 1.00, 0.1, 0.0),
            (13, 23, 6, "SW", 0.97, 0.1, 0.0),
            (14, 23, 7, "SW", 0.90, 0.2, 0.0),
            (15, 22, 6, "SW", 0.82, 0.2, 0.0),
            (16, 21, 6, "W", 0.72, 0.2, 0.0),
            (17, 20, 5, "W", 0.60, 0.2, 0.0),
            (18, 19, 4, "W", 0.46, 0.2, 0.0),
            (19, 18, 3, "NW", 0.32, 0.2, 0.0),
            (20, 16, 2, "NW", 0.18, 0.2, 0.0),
            (21, 14, 2, "N", 0.04, 0.2, 0.0),
        ],
        "sunrise": "04:35",
        "sunset": "21:12",
        "golden_start": "19:50",
    },
    {
        "name": "Tyrifjord Golfklubb",
        "city": "Vikersund",
        "region": "Buskerud",
        "country": "Norway",
        "country_code": "NO",
        "course_type": "lakeside",
        "holes_count": 18,
        "par": 71,
        "total_meters": 5810,
        "latitude": 59.9700,
        "longitude": 10.0220,
        "established": 1995,
        "website": "https://www.tyrifjord.no",
        "is_verified": True,
        "booking_provider": "internal",
        "peak_price": 750,
        "off_price": 500,
        "golden_price": 650,
        "window": ("midday", 14, 17),
        "hourly": [
            (5, 10, 4, "S", 0.10, 0.5, 0.0),
            (6, 12, 5, "S", 0.20, 0.4, 0.0),
            (7, 14, 5, "S", 0.35, 0.3, 0.0),
            (8, 16, 6, "S", 0.55, 0.3, 0.0),
            (9, 18, 6, "SW", 0.72, 0.2, 0.0),
            (10, 19, 7, "SW", 0.84, 0.2, 0.0),
            (11, 20, 7, "SW", 0.92, 0.1, 0.0),
            (12, 21, 8, "SW", 0.98, 0.1, 0.0),
            (13, 22, 8, "SW", 1.00, 0.1, 0.0),
            (14, 22, 8, "W", 0.94, 0.2, 0.0),
            (15, 21, 7, "W", 0.86, 0.2, 0.0),
            (16, 20, 6, "W", 0.74, 0.3, 0.0),
            (17, 19, 5, "W", 0.62, 0.3, 0.0),
            (18, 18, 4, "NW", 0.48, 0.3, 0.0),
            (19, 16, 3, "NW", 0.32, 0.3, 0.0),
            (20, 14, 3, "N", 0.18, 0.3, 0.0),
            (21, 12, 2, "N", 0.04, 0.4, 0.0),
        ],
        "sunrise": "04:42",
        "sunset": "21:18",
        "golden_start": "19:55",
    },
    {
        "name": "Atlungstad Golfklubb",
        "city": "Stange",
        "region": "Innlandet",
        "country": "Norway",
        "country_code": "NO",
        "course_type": "farmland",
        "holes_count": 18,
        "par": 72,
        "total_meters": 5950,
        "latitude": 60.7167,
        "longitude": 11.2167,
        "established": 1996,
        "website": "https://www.atlungstad-golf.no",
        "is_verified": True,
        "booking_provider": "internal",
        "peak_price": 700,
        "off_price": 480,
        "golden_price": 600,
        "window": ("morning", 6, 9),
        "hourly": [
            (5, 9, 2, "E", 0.10, 0.3, 0.0),
            (6, 11, 2, "E", 0.22, 0.2, 0.0),
            (7, 13, 3, "E", 0.38, 0.2, 0.0),
            (8, 15, 3, "SE", 0.55, 0.2, 0.0),
            (9, 17, 4, "S", 0.72, 0.2, 0.0),
            (10, 19, 5, "S", 0.85, 0.1, 0.0),
            (11, 20, 5, "S", 0.94, 0.1, 0.0),
            (12, 21, 6, "SW", 1.00, 0.1, 0.0),
            (13, 22, 6, "SW", 0.97, 0.1, 0.0),
            (14, 22, 7, "SW", 0.90, 0.2, 0.0),
            (15, 21, 6, "SW", 0.82, 0.2, 0.0),
            (16, 20, 5, "W", 0.72, 0.2, 0.0),
            (17, 19, 4, "W", 0.60, 0.2, 0.0),
            (18, 18, 3, "W", 0.46, 0.2, 0.0),
            (19, 16, 2, "NW", 0.32, 0.2, 0.0),
            (20, 14, 2, "NW", 0.18, 0.2, 0.0),
            (21, 12, 1, "N", 0.04, 0.3, 0.0),
        ],
        "sunrise": "04:22",
        "sunset": "21:48",
        "golden_start": "20:25",
    },
]


# ─────────────────────────────────────────────────────────────────────
# Upsert helpers
# ─────────────────────────────────────────────────────────────────────


def _upsert_course(db: Session, defn: dict[str, Any]) -> Course:
    course = (
        db.query(Course)
        .filter(Course.name == defn["name"], Course.country_code == defn["country_code"])
        .first()
    )
    payload = {
        k: v
        for k, v in defn.items()
        if k
        not in {
            "peak_price",
            "off_price",
            "golden_price",
            "window",
            "hourly",
            "sunrise",
            "sunset",
            "golden_start",
        }
    }
    if course:
        for field, value in payload.items():
            setattr(course, field, value)
    else:
        course = Course(**payload)
        db.add(course)
        db.flush()
    return course


def _hourly_for_date(defn: dict[str, Any], target: date) -> list[dict]:
    """Add small per-day jitter so each day looks alive."""
    seed = int(target.toordinal()) ^ hash(defn["name"])
    rng = random.Random(seed)
    out = []
    for h, t, w, direction, sun, cloud, rain in defn["hourly"]:
        out.append(
            {
                "h": h,
                "t": round(t + rng.uniform(-1.5, 1.5), 1),
                "w": round(max(0.0, w + rng.uniform(-1.0, 1.5)), 1),
                "dir": direction,
                "sun": round(max(0.0, min(1.0, sun + rng.uniform(-0.05, 0.05))), 3),
                "cloud": round(max(0.0, min(1.0, cloud + rng.uniform(-0.05, 0.1))), 3),
                "rain": round(max(0.0, min(1.0, rain + rng.uniform(-0.05, 0.18))), 3),
            }
        )
    return out


def _seed_conditions(db: Session, course: Course, defn: dict[str, Any], target: date):
    hourly = _hourly_for_date(defn, target)
    rep = next((h for h in hourly if h["h"] == 14), hourly[len(hourly) // 2])
    avg_rain = sum(h["rain"] for h in hourly) / len(hourly)

    existing = (
        db.query(CourseConditions)
        .filter(
            CourseConditions.course_id == course.id,
            CourseConditions.for_date == target,
        )
        .first()
    )
    fields = dict(
        course_id=course.id,
        for_date=target,
        hourly=hourly,
        green_speed=10.0,
        fairway_state="firm",
        rough_state="medium",
        mowed_hrs_ago=2,
        wind_ms=rep["w"],
        temp_c=rep["t"],
        sun_pct=rep["sun"],
        cloud_pct=rep["cloud"],
        rain_pct=round(avg_rain, 3),
        sunrise=defn["sunrise"],
        sunset=defn["sunset"],
        golden_start=defn["golden_start"],
        source="seed",
    )
    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        existing.captured_at = datetime.utcnow()
    else:
        db.add(CourseConditions(**fields, captured_at=datetime.utcnow()))


def _seed_sheet(db: Session, course: Course, defn: dict[str, Any], target: date):
    """Wipe and rebuild the day's tee sheet so re-running is idempotent."""
    existing = (
        db.query(TeeSheet)
        .filter(TeeSheet.course_id == course.id, TeeSheet.date == target)
        .first()
    )
    if existing:
        db.delete(existing)
        db.flush()

    sheet = TeeSheet(
        course_id=course.id,
        date=target,
        opens_at=dt_time(6, 0),
        closes_at=dt_time(20, 0),
        interval_min=8,
        peak_price=defn["peak_price"],
        off_price=defn["off_price"],
        golden_price=defn["golden_price"],
        currency="NOK",
        provider="internal",
    )
    db.add(sheet)
    db.flush()

    seed = int(target.toordinal()) ^ hash(defn["name"]) ^ 0xBEEF
    rng = random.Random(seed)

    for hour in range(6, 20):
        for minute in range(0, 60, 8):
            r = rng.random()
            r2 = rng.random()
            if r < 0.18:
                avail = 0
            elif r < 0.45:
                avail = max(1, int(round(r2 * 4)))
            else:
                avail = 4
            taken = 4 - avail
            peak = 9 <= hour <= 17
            golden = hour >= 18
            twilight = hour >= 19
            price = (
                defn["peak_price"]
                if peak
                else defn["golden_price"]
                if golden
                else defn["off_price"]
            )
            slot = TeeSheetSlot(
                tee_sheet_id=sheet.id,
                tee_time=datetime.combine(target, dt_time(hour, minute)),
                players_total=4,
                players_taken=taken,
                price_amount=float(price),
                currency="NOK",
                peak=peak,
                golden=golden,
                twilight=twilight,
                is_blocked=False,
            )
            db.add(slot)


# ─────────────────────────────────────────────────────────────────────
# Public entrypoint
# ─────────────────────────────────────────────────────────────────────


def seed_tee(db: Session, days: int = 14) -> dict[str, int]:
    today = datetime.utcnow().date()
    courses_created = 0
    sheets_created = 0
    conditions_created = 0

    for defn in COURSE_DEFS:
        course = _upsert_course(db, defn)
        courses_created += 1

        for offset in range(days):
            target = today + timedelta(days=offset)
            _seed_conditions(db, course, defn, target)
            conditions_created += 1
            _seed_sheet(db, course, defn, target)
            sheets_created += 1

    db.commit()
    return {
        "courses": courses_created,
        "sheets": sheets_created,
        "conditions": conditions_created,
    }


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        result = seed_tee(db)
    finally:
        db.close()
    print(
        f"Tee seed complete: {result['courses']} courses, {result['sheets']} sheets, "
        f"{result['conditions']} condition snapshots."
    )


if __name__ == "__main__":
    main()
