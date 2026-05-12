#!/usr/bin/env python3
"""Enrich Norwegian golf courses from OpenStreetMap (Overpass API).

OpenStreetMap data is licensed under the Open Database License (ODbL),
which permits commercial reuse with attribution. We use the public
Overpass API (https://overpass-api.de) to fetch every golf course and
driving range in Norway, then enrich the seeded `courses` rows by:

  • setting / refining latitude + longitude from OSM geometry
  • capturing the OSM relation/way id (`osm_id`) so future syncs are stable
  • flipping `has_driving_range` to true when an associated range exists
  • detecting "range-only" facilities and creating them as standalone
    Course rows with `holes_count = 0` and `has_driving_range = true`

Usage:

    cd apps/api
    python -m scripts.fetch_norway_courses              # update only
    python -m scripts.fetch_norway_courses --add-new    # also add new clubs
    python -m scripts.fetch_norway_courses --dry-run    # preview changes

Idempotent. Safe to run repeatedly.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request
import urllib.error
from typing import Any, Iterable, Optional

# Make `app.*` importable when running as a script.
sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
)

from sqlalchemy.orm import Session  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.models.course import Course  # noqa: E402


OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
]

# Country = Norway (ISO 3166-1 alpha-2 = NO).
# We pull every full golf course AND every standalone driving range.
OVERPASS_QUERY = """
[out:json][timeout:90];
area["ISO3166-1"="NO"][admin_level=2]->.no;
(
  nwr["leisure"="golf_course"](area.no);
  nwr["golf"="course"](area.no);
  nwr["golf"="driving_range"](area.no);
  nwr["leisure"="pitch"]["sport"="golf"](area.no);
);
out tags center;
"""


# Norwegian letters don't decompose via NFKD — substitute explicitly.
_NB_TRANSLATIONS = str.maketrans(
    {
        "æ": "ae", "Æ": "ae",
        "ø": "o",  "Ø": "o",
        "å": "aa", "Å": "aa",
    }
)


def _strip_accents(value: str) -> str:
    value = value.translate(_NB_TRANSLATIONS)
    return "".join(
        c
        for c in unicodedata.normalize("NFKD", value)
        if not unicodedata.combining(c)
    )


def _normalize_name(name: str) -> str:
    """Collapse a club name into a comparison key.

    'Bærum Golfklubb' -> 'baerum'
    'Oslo Golf Club' -> 'oslo'
    'Hauger GK' -> 'hauger'
    'Ålesund Golfklubb' -> 'aalesund'
    'Bamble Golfpark' -> 'bamble'
    'Borre Golfbane' -> 'borre'
    """
    if not name:
        return ""
    name = _strip_accents(name).lower()
    # Strip any parenthetical alias suffix: "Sandnes Golfklubb (Bærheim Golfpark)" -> "Sandnes Golfklubb"
    name = re.sub(r"\(.*?\)", "", name)
    # Norwegian + English club / facility suffixes.
    for token in (
        "golfklubb",
        "golfbane",
        "golfpark",
        "golfsenter",
        "golfstrombane",
        "country club",
        "golf club",
        "golf links",
        "golf links",
        "golf",
        "klubb",
        "links",
    ):
        name = re.sub(rf"\b{token}\b", "", name)
    name = re.sub(r"\bgk\b", "", name)
    name = re.sub(r"\bcc\b", "", name)
    # "og omegn" / "& omegn" / "and surroundings"
    name = re.sub(r"\b(og|&|and)\s+omegn\b", "", name)
    name = re.sub(r"\baktivitetspark\b", "", name)
    # "Trysilfjellet Golf" / "Hafjellfjellet" — fjellet may be a suffix.
    name = re.sub(r"fjellet\b", "", name)
    name = re.sub(r"[^a-z0-9]+", " ", name).strip()
    name = re.sub(r"\s+", " ", name)
    return name


# OSM rows whose `name` matches one of these patterns are individual
# sub-features (a single hole marker, a green polygon, a stand-alone
# "Range" rectangle) — NOT a golf facility we want as a Course row.
_JUNK_NAME_PATTERNS = [
    re.compile(r"^[ht]\d{1,3}$", re.IGNORECASE),         # H1..H18, T1..T14
    re.compile(r"^green\s+\d+$", re.IGNORECASE),
    re.compile(r"^hole\s+\d+$", re.IGNORECASE),
    re.compile(r"^tee\s*\d*$", re.IGNORECASE),
    re.compile(r"^\d+(st|nd|rd|th)$", re.IGNORECASE),    # "2nd"
    re.compile(r",\s*(front|back)\s*9", re.IGNORECASE),
    re.compile(r",\s*green\s*\d+", re.IGNORECASE),
    re.compile(r"^driving\s*range$", re.IGNORECASE),     # anonymous
    re.compile(r"^drivingrange$", re.IGNORECASE),
    re.compile(r"^range$", re.IGNORECASE),
    re.compile(r"diskgolf|disc\s*golf|frisbeegolf", re.IGNORECASE),
]


def _looks_like_real_facility(name: str, tags: dict[str, str]) -> bool:
    """Reject single-hole markers, anonymous range polygons, disc-golf, etc."""
    if tags.get("sport") in {"disc_golf", "frisbee_golf"}:
        return False
    if not name or len(name.strip()) < 3:
        return False
    for pat in _JUNK_NAME_PATTERNS:
        if pat.search(name.strip()):
            return False
    return True


def fetch_overpass(query: str = OVERPASS_QUERY) -> list[dict[str, Any]]:
    """Hit the Overpass API. Returns the raw `elements` array."""
    last_err: Optional[Exception] = None
    for url in OVERPASS_ENDPOINTS:
        try:
            print(f"  → Querying {url}")
            req = urllib.request.Request(
                url,
                data=("data=" + query).encode("utf-8"),
                headers={
                    "User-Agent": (
                        "StrikeLab/1.0 (open data import; "
                        "+https://strikelab.golf)"
                    )
                },
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
                return payload.get("elements", [])
        except (urllib.error.URLError, TimeoutError) as exc:
            last_err = exc
            print(f"  ! {url} failed: {exc}; trying next mirror.")
            time.sleep(2)
    raise RuntimeError(f"All Overpass mirrors failed: {last_err}")


def _coords(element: dict[str, Any]) -> tuple[Optional[float], Optional[float]]:
    if element.get("type") == "node":
        return element.get("lat"), element.get("lon")
    center = element.get("center") or {}
    return center.get("lat"), center.get("lon")


def _is_driving_range_only(tags: dict[str, str]) -> bool:
    return tags.get("golf") == "driving_range" and tags.get(
        "leisure"
    ) not in {"golf_course"}


def update_courses(
    db: Session,
    elements: Iterable[dict[str, Any]],
    *,
    add_new: bool = False,
    dry_run: bool = False,
) -> dict[str, int]:
    """Match OSM elements to seeded courses and enrich them.

    Returns counts: { matched, lat_lon_refined, range_flagged, added }.
    """
    norwegian = (
        db.query(Course).filter(Course.country_code == "NO").all()
    )
    by_key: dict[str, Course] = {
        _normalize_name(c.name): c for c in norwegian
    }
    # Sort seeded keys by length descending so the longest token wins on
    # substring matches (e.g. "north cape" beats "cape").
    seeded_keys_sorted = sorted(
        (k for k in by_key.keys() if k),
        key=lambda k: -len(k),
    )

    def _resolve(key: str) -> Optional[Course]:
        """Match an OSM key against seeded clubs.

        Strategy:
          1. Exact key hit (already populated in `by_key`).
          2. Substring hit: OSM key like "oslo bogstad" should resolve
             to the seeded "bogstad" row — and "vesteralen kjerringnes"
             to "vesteralen".
        """
        if key in by_key:
            return by_key[key]
        for seeded in seeded_keys_sorted:
            if not seeded:
                continue
            # Token-boundary aware substring match: avoid "los" matching "oslo".
            tokens = key.split()
            seeded_tokens = seeded.split()
            if all(t in tokens for t in seeded_tokens):
                return by_key[seeded]
        return None

    matched = 0
    refined = 0
    range_flagged = 0
    added = 0

    # Track keys we've already added in this run so a course with multiple
    # OSM elements (relation + way) doesn't create duplicate rows.
    added_keys: set[str] = set()

    for el in elements:
        tags = el.get("tags") or {}
        name = tags.get("name") or tags.get("name:no") or tags.get("name:en")
        if not name or not _looks_like_real_facility(name, tags):
            continue

        key = _normalize_name(name)
        if not key:
            continue

        course = _resolve(key)
        lat, lon = _coords(el)
        is_range_only = _is_driving_range_only(tags)

        if course is None:
            if not add_new:
                continue
            if key in added_keys:
                # Already created a row for this club from a sibling OSM element.
                continue
            new_course = Course(
                name=name.strip(),
                country="Norway",
                country_code="NO",
                course_type="range" if is_range_only else "parkland",
                holes_count=0 if is_range_only else None,
                has_driving_range=True,
                latitude=lat,
                longitude=lon,
                osm_id=f"{el.get('type')}/{el.get('id')}",
                website=tags.get("website") or tags.get("contact:website"),
                phone=tags.get("phone") or tags.get("contact:phone"),
                email=tags.get("email") or tags.get("contact:email"),
                is_verified=False,
            )
            if not dry_run:
                db.add(new_course)
            added_keys.add(key)
            # Make subsequent OSM elements with the same name match this row.
            by_key[key] = new_course
            added += 1
            continue

        matched += 1
        changes: list[str] = []

        if not course.osm_id:
            course.osm_id = f"{el.get('type')}/{el.get('id')}"
            changes.append("osm_id")

        if lat is not None and lon is not None:
            # Refine if missing OR if our seeded estimate is far off (>5 km).
            if course.latitude is None or course.longitude is None:
                course.latitude, course.longitude = lat, lon
                refined += 1
                changes.append("lat/lon")
            elif (
                abs(course.latitude - lat) > 0.05
                or abs(course.longitude - lon) > 0.1
            ):
                course.latitude, course.longitude = lat, lon
                refined += 1
                changes.append("lat/lon refined")

        if is_range_only and not course.has_driving_range:
            course.has_driving_range = True
            range_flagged += 1
            changes.append("range")

        if tags.get("website") and not course.website:
            course.website = tags["website"]
            changes.append("website")
        elif tags.get("contact:website") and not course.website:
            course.website = tags["contact:website"]
            changes.append("website")

        if tags.get("phone") and not course.phone:
            course.phone = tags["phone"]
            changes.append("phone")
        if tags.get("email") and not course.email:
            course.email = tags["email"]
            changes.append("email")

        if changes and dry_run:
            print(f"    {course.name}: {', '.join(changes)}")

    if not dry_run:
        db.commit()

    return {
        "matched": matched,
        "lat_lon_refined": refined,
        "range_flagged": range_flagged,
        "added": added,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enrich Norwegian courses from OpenStreetMap."
    )
    parser.add_argument(
        "--add-new",
        action="store_true",
        help="Also create new Course rows for OSM facilities not in our seed.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print proposed changes without writing to the database.",
    )
    args = parser.parse_args()

    print("Fetching golf facilities in Norway from OpenStreetMap (ODbL)…")
    elements = fetch_overpass()
    print(f"  ← {len(elements)} OSM elements returned")

    db = SessionLocal()
    try:
        stats = update_courses(
            db, elements, add_new=args.add_new, dry_run=args.dry_run
        )
    finally:
        db.close()

    print("\nDone.")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    if args.dry_run:
        print("\n(dry-run — no changes were committed)")


if __name__ == "__main__":
    main()
