"""Catalog seeder — idempotent upserts for brands, club_models,
connectors, and the course catalog.

Run standalone:
    python -m app.seed.catalog

Or call `seed_catalog(db)` from anywhere with an open SQLAlchemy session.
"""
from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from typing import Any

from sqlalchemy.orm import Session

# Ensure repo root is on path when run as a script.
if __name__ == "__main__" and __package__ is None:
    sys.path.insert(
        0,
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    )

from app.database import Base, SessionLocal, engine
from app.models import Brand, ClubModel, Connector, Course


_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def _load(filename: str) -> list[dict[str, Any]]:
    path = os.path.join(_DATA_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "model"


def _build_model_id(brand_id: str, name: str) -> str:
    return f"{brand_id}__{_slugify(name)}"


def seed_brands(db: Session) -> int:
    rows = _load("brands.json")
    count = 0
    for row in rows:
        existing = db.get(Brand, row["id"])
        if existing:
            for k, v in row.items():
                setattr(existing, k, v)
        else:
            db.add(Brand(**row))
        count += 1
    db.commit()
    return count


def seed_club_models(db: Session) -> int:
    rows = _load("club_models.json")
    count = 0
    for row in rows:
        model_id = _build_model_id(row["brand_id"], row["name"])
        payload = dict(row)
        payload["id"] = model_id
        existing = db.get(ClubModel, model_id)
        if existing:
            for k, v in payload.items():
                setattr(existing, k, v)
        else:
            db.add(ClubModel(**payload))
        count += 1
    db.commit()
    return count


def seed_connectors(db: Session) -> int:
    rows = _load("connectors.json")
    count = 0
    for row in rows:
        existing = db.get(Connector, row["id"])
        if existing:
            for k, v in row.items():
                setattr(existing, k, v)
        else:
            db.add(Connector(**row))
        count += 1
    db.commit()
    return count


def _upsert_course(db: Session, row: dict[str, Any]) -> None:
    """Idempotent upsert of a Course row.

    Match precedence:
      1. ngf_club_id (if both new row and existing carry one — exact match)
      2. (name, city) — case-insensitive match
    """
    ngf_id = row.get("ngf_club_id")
    existing = None
    if ngf_id:
        existing = (
            db.query(Course).filter(Course.ngf_club_id == ngf_id).first()
        )
    if existing is None:
        existing = (
            db.query(Course)
            .filter(Course.name == row["name"], Course.city == row.get("city"))
            .first()
        )

    if existing is not None:
        for k, v in row.items():
            # Don't overwrite an existing non-null value with a null,
            # so manually-edited fields survive a re-seed.
            if v is None and getattr(existing, k, None) is not None:
                continue
            setattr(existing, k, v)
    else:
        db.add(Course(**row))


def seed_courses(db: Session) -> int:
    """Upsert verified course catalog entries (international + signature)."""
    rows = _load("courses.json")
    for row in rows:
        _upsert_course(db, row)
    db.commit()
    return len(rows)


def seed_norway_clubs(db: Session) -> int:
    """Upsert every Norwegian Golf Federation (NGF) member club.

    Source: the NGF / GolfBox public club directory plus club websites.
    Each row carries city + region (fylke), holes count, par, course type,
    website, approximate lat/lon, and the practice-facility flags.
    Latitude / longitude are publicly known coordinates — they can be
    refined by `scripts/fetch_norway_courses.py`, which queries the
    OpenStreetMap Overpass API (ODbL).
    """
    rows = _load("norway_clubs.json")
    for row in rows:
        _upsert_course(db, row)
    db.commit()
    return len(rows)


def seed_catalog(db: Session | None = None) -> dict[str, int]:
    """Run all catalog seeders. Creates a session if one isn't provided."""
    own = db is None
    db = db or SessionLocal()
    try:
        Base.metadata.create_all(bind=engine)
        results = {
            "brands": seed_brands(db),
            "club_models": seed_club_models(db),
            "connectors": seed_connectors(db),
            "courses": seed_courses(db),
            "norway_clubs": seed_norway_clubs(db),
        }
        return results
    finally:
        if own:
            db.close()


if __name__ == "__main__":
    print("Seeding catalog (idempotent)...")
    results = seed_catalog()
    for key, value in results.items():
        print(f"  {key}: {value} rows upserted")
    print("Done.")
