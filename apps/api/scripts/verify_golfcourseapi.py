"""Verify Golf Course API credentials and basic catalog coverage."""
from __future__ import annotations

from app.services.providers import golfcourseapi


def main() -> None:
    if not golfcourseapi.configured():
        print("GOLFCOURSEAPI_KEY is not configured")
        raise SystemExit(1)

    for query in ("pebble beach", "oslo", "miklagard"):
        rows = golfcourseapi.search(query, limit=5)
        print(f"{query}: {len(rows)} result(s)")
        if rows:
            detail = golfcourseapi.get_course(rows[0].id)
            course = golfcourseapi.to_public_course(detail)
            print(
                f"  first={course.name} country={course.country_code or course.country} "
                f"holes={course.holes_count} slope={course.slope_rating}"
            )


if __name__ == "__main__":
    main()
