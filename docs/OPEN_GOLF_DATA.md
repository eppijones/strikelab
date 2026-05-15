# StrikeLab Open Golf Data

StrikeLab exposes a Norway-first public read-only golf data API under `/public`.
It is designed for factual course metadata, course conditions, equipment catalog
metadata, and source attribution. Personal player data, rounds, bookings, holds,
occupants, and private caddie recommendations are not public data.

## Public Endpoints

- `GET /public`
- `GET /public/health`
- `GET /public/sources`
- `GET /public/regions?country_code=NO`
- `GET /public/courses?country_code=NO`
- `GET /public/courses/{course_id}`
- `GET /public/courses/{course_id}/geometry`
- `GET /public/courses/{course_id}/conditions`
- `GET /public/courses/{course_id}/tee-sheet-summary`
- `GET /public/equipment/brands`
- `GET /public/equipment/club-models`
- `GET /public/plays-like?distance_m=145&wind_ms=5&temp_c=8`
- `GET /public/providers/golfcourseapi/status`
- `GET /public/providers/golfcourseapi/search?q=pebble%20beach`
- `POST /public/providers/golfcourseapi/import/{provider_id}`

## Legal Rules

- Preserve the `data_sources` attribution returned by course and tee-sheet
  endpoints.
- OpenStreetMap-derived course geometry is ODbL data. Database extracts that
  include OSM-derived geometry need ODbL attribution and share-alike review.
- MET Norway and Open-Meteo weather data require source attribution.
- StrikeLab equipment catalog entries are factual metadata only. Do not copy
  manufacturer marketing copy, images, or proprietary fitting databases without
  permission.
- Do not combine public course facts with private player performance data in
  public API responses.

## Refresh Operations

From `apps/api`:

```bash
python -m app.seed.catalog
python -m scripts.fetch_norway_courses --dry-run
python -m scripts.fetch_norway_courses --geometry --dry-run
python -m scripts.fetch_norway_courses --geometry
```

## Golf Course API

Configure the key only on the backend:

```bash
GOLFCOURSEAPI_KEY=...
GOLFCOURSEAPI_BASE_URL=https://api.golfcourseapi.com/v1
```

Do not ship the Golf Course API key to web, iPhone, or Watch builds. Devices use
StrikeLab `/public/providers/golfcourseapi/*`, which normalizes provider data
into the same public course shape as the Norway catalog.

Current verification notes:

- `pebble beach` returns a valid course and tee data.
- `oslo` and `miklagard` returned zero results during verification, so this
  provider should not be upgraded for Norway coverage until their catalog proves
  Norwegian clubs are available.
- Free tier is suitable for backend enrichment and manual imports. Upgrade to
  Pro only if StrikeLab needs more than 300 provider requests/day, e.g. bulk US
  import or high-volume global search. Enterprise is only needed for very large
  partner/developer API traffic.

Recommended production cadence:

- Data sources/catalog seed: on deploy and monthly.
- OSM course geometry: weekly.
- Conditions: cached per course/date with short TTL, warmed by app traffic.
- Public health: monitor `/public/health` for source and geometry counts.
