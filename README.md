# StrikeLab

**A precision instrument for the serious player.**

StrikeLab is a unified golf performance platform: personal trainer, AI coach,
on-course caddie, booking system, and Apple Watch companion in one. Diagnose →
prescribe → validate. Every session becomes a plan.

## Surfaces

| Surface | Where | Stack |
|---|---|---|
| Web app | `apps/web` | React 18 · Vite · Tailwind 3 · TanStack Query · Geist + Instrument Serif |
| Backend | `apps/api` | FastAPI · SQLAlchemy · PostgreSQL · Alembic · Clerk/JWT |
| iOS Caddie | `apps/ios` | SwiftUI · CoreLocation · MapKit · WatchConnectivity |
| Apple Watch | `apps/watch` | SwiftUI · HealthKit · CoreMotion · Digital Crown |
| Design tokens | `packages/design-tokens` | CSS vars + JSON twin |
| Swift tokens | `packages/design-swift` | Swift Package Mirror |
| Shared types | `packages/domain` | TypeScript |

## Quick Start

```bash
# Web (port 5173)
cd apps/web
npm install
npm run dev

# API (port 8000)
cd apps/api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
docker compose up -d   # local Postgres
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# iOS / Watch
open apps/ios/StrikeLabCaddie.xcodeproj
```

## Run all three locally (web + iPhone + Apple Watch)

The iPhone and Watch live on a different host than your Mac, so they
can't reach `localhost:8000`. They need to hit your Mac's LAN IP.

1. **Start the API on your Mac.**
   ```bash
   cd apps/api
   source venv/bin/activate
   docker compose up -d
   alembic upgrade head
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the web app.**
   ```bash
   cd apps/web
   npm install
   npm run dev -- --host 0.0.0.0
   ```

3. **Find your Mac's LAN IP.**
   ```bash
   ifconfig | grep 'inet ' | grep -v 127.0.0.1
   ```

4. **Point the iPhone app at that IP.**
   ```bash
   cp apps/ios/Config/Local.xcconfig.sample apps/ios/Config/Local.xcconfig
   # Edit Local.xcconfig:
   # DEV_HOST = 192.168.1.42
   ```
   `Local.xcconfig` is git-ignored. The Xcode project already wires
   Debug to `apps/ios/Config/Debug.xcconfig`, so no manual Xcode
   configuration step is needed.

   Alternative: open the iPhone app, go to Profile → StrikeLab API,
   and paste the URL directly. This overrides the bundled default.

5. **Build the iPhone + Watch app.** Open
   `apps/ios/StrikeLabCaddie.xcodeproj`, run the iPhone app, and let
   Xcode install the paired Watch app if needed.

6. **Use one account everywhere.** Register or sign in on the web app,
   then sign in on the iPhone with the same account. Tokens are stored
   in the iOS Keychain and re-bridged to the Watch.

7. **Keep everything on the same Wi-Fi.** Mac, iPhone, and paired Watch must
   share the LAN. The Watch reaches the API through the phone via
   `WatchConnectivity`; the phone pushes its base URL + bearer token
   to the Watch via application context.

### Troubleshooting

- **`NSURLErrorDomain Code=-1003` / "could not connect"** on iPhone:
  ATS is now configured with `NSAllowsLocalNetworking`, so `http://`
  to a LAN IP works. If it still fails, you're probably using
  `localhost` instead of the Mac IP (`localhost` on the phone means
  the phone, not the Mac).
- **Web at `http://<mac-ip>:5173` hits CORS:** make sure the API is
  running with `debug=true` (the local default). Debug mode allows
  localhost plus common private LAN origins.
- **Watch shows no caddie data:** the phone has to be running an
  active round AND have computed caddie advice. The app pushes
  yardages/club via application context only when both conditions
  hold.

## Information Architecture

The web app uses two nav rails: a primary **HQ · SESSIONS · REPORTS · PLAN · BAG · DATA**
header, and a secondary **PLAY · LAB** rail.

```
HQ          /                 → Command Center
SESSIONS    /sessions         → Range / sim / course history
            /sessions/:id     → Per-session analytics
            /sessions/:id/log → Subjective log
REPORTS     /coach            → Diagnose / Prescribe / Validate
            /coach/chat       → AI coach conversation
PLAN        /training         → 8-week training blocks
BAG         /my-bag           → Active bag + Shot DNA per club
DATA        /connectors       → TrackMan / Foresight / CSV / API

PLAY        /play             → On-course missions hub
            /rounds           → Round history (synced from iOS Caddie)
            /rounds/:id       → Scorecard + shot map + DNA
            /calendar         → Booking + tee times
            /courses          → Course library
LAB         /lab              → Swing video library
            /lab/analyze/:id  → Manual-pose biomechanics analyzer
            /lab/compare      → Side-by-side swing compare
```

Public routes: `/marketing`, `/login`, `/register`, `/onboarding`.

## Brand

- **Name:** StrikeLab (formal: StrikeLab Golf)
- **Tagline:** Get dialed in.
- **Voice:** Direct. Diagnostic. Confident. Numbers carry the argument; copy stays out of the way.
- **Type:** Geist (UI), Geist Mono (data), Instrument Serif italic (emphasis).
- **Color:** Dark warm bg (`#0A0B0A`), bone ink (`#EDE8DE`), single Signal Lime accent (`oklch(0.88 0.18 125)`).

## Design tokens

Source of truth is `packages/design-tokens/tokens.json`. The CSS twin
(`tokens.css`) is mirrored inline in `apps/web/src/index.css` and the Swift
twin lives in `packages/design-swift/Sources/StrikeLabDesign/SLColors.swift`
(plus the iOS app's `apps/ios/StrikeLabCaddie/Theme/Theme.swift` which keeps
legacy aliases pointing to the new tokens).

## Backend

```
/auth         JWT + invites
/sessions     Range / sim sessions + CSV import
/log          Session logs + templates
/connectors   TrackMan / Foresight / Topgolf / GSPro / CSV
/coach        Reports + chat
/courses      Course library + tee times + facility filters
/training     Plans + drills
/equipment    Bags + clubs + per-club stats
/rounds       On-course rounds (synced from iOS Caddie)
/caddie       Ghost Caddie recommendations
/dna          Player Shot DNA aggregation
/booking      Tee-time search + hold + confirm
/friends      Social connections
```

## Course catalog — Norway

The catalog ships with every Norges Golfforbund (NGF) member club —
**156 clubs across all 16 fylker** including Svalbard and North Cape.
Each row carries city, fylke (`region`), hole count, par, course type,
website, approximate lat/lon, and the practice-facility flags GolfBox /
NGF expose: `has_driving_range`, `has_practice_area`, `has_putting_green`,
`has_par3_course`, `has_simulator`. The seed file is
`apps/api/app/seed/data/norway_clubs.json`.

To refine coordinates and discover stand-alone driving ranges from
OpenStreetMap (Open Database License, ODbL):

```bash
cd apps/api
python -m scripts.fetch_norway_courses             # update lat/lon + osm_id
python -m scripts.fetch_norway_courses --add-new   # also add new ranges
python -m scripts.fetch_norway_courses --dry-run   # preview only
```

The script queries the Overpass API for every `leisure=golf_course` and
`golf=driving_range` in Norway and merges the results into the catalog.

## Production Deployment

Production is one Vercel project at `https://strikelab.golf`:

| Path | Runtime | Notes |
|---|---|---|
| `/` | Vite static web app | Built from `apps/web` |
| `/api/*` | Vercel Python Function | FastAPI from `apps/api` |
| audio uploads | Vercel Blob | Used when `MEDIA_STORAGE=vercel_blob` |
| app data | PostgreSQL | Set `DATABASE_URL` in Vercel |

Required Vercel environment variables:

```env
DATABASE_URL=
CLERK_ISSUER=
CLERK_JWKS_URL=
CLERK_AUDIENCE=
CLERK_SECRET_KEY=
BLOB_READ_WRITE_TOKEN=
SECRET_KEY=
MEDIA_STORAGE=vercel_blob
GOLFCOURSEAPI_KEY=
PUBLIC_API_BASE_URL=https://strikelab.golf/api
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_URL=/api
```

Beginner deploy workflow:

1. Make changes locally.
2. Test the API/web/iPhone app.
3. Commit the changes.
4. Push to GitHub `main`.
5. Vercel builds and deploys `strikelab.golf` automatically.
6. If something breaks, use Vercel rollback or revert the Git commit and push again.

For GitHub Actions deploys, add repository secrets:

```env
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=prj_SOzmJINaugb50gJ8EBCI5480IfdO
```

Do not commit passwords, API tokens, `.env.local`, or Vercel/Clerk secrets.

## Legacy Deployment Notes

| Component | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Now served from root `vercel.json` |
| Backend | Fly.io / Render | Legacy option: `apps/api/Dockerfile` |
| Database | Supabase / Neon | PostgreSQL |
| iOS / Watch | App Store | TestFlight first |

## Architecture Doc

See `PLAN.md` for the unified architecture, IA, design system, and roadmap.

## License

Private — StrikeLab Golf.
