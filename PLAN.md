# StrikeLab Golf - Architecture Plan

## Overview

StrikeLab is a premium golf performance lab for obsessed amateurs pursuing scratch. It merges objective launch monitor data with subjective session logs, AI coaching reports, adaptive training plans, and course/calendar context to drive a closed-loop improvement engine.

**Core Mechanic:** Diagnose → Interpret → Prescribe → Validate

**Position:** Decision engine, not dashboard.

**Voice:** Confident minimal coach-like microcopy.

## Repository Structure

```
/
├── PLAN.md                    # This file
├── README.md                  # Setup + deployment guide
├── .gitignore
├── docker-compose.yml         # Local dev environment
├── apps/
│   ├── web/                   # React + Vite + TypeScript frontend
│   └── api/                   # FastAPI backend
└── data/
    └── sample_session.csv     # Demo import file
```

## Tech Stack

### Frontend
- React 18 + Vite + TypeScript
- TailwindCSS
- React Router v6
- Zustand (global state)
- TanStack Query
- Recharts + custom Canvas charts
- i18next (bilingual EN/NO)
- Framer Motion

### Backend
- FastAPI (Python 3.11)
- PostgreSQL + SQLAlchemy + Alembic
- JWT + refresh tokens
- Connector framework (TrackMan, Topgolf, Foresight, CSV)

---

## STRIKELAB SCANDINAVIAN REDESIGN (VOLVO x TESLA)

### Design Philosophy

Transform from dark "neural cyber" to **Scandinavian Minimal premium**:
- VolvoCars.com aesthetic + Tesla telemetry clarity
- Light theme primary, warm dark optional
- Sage green as the ONLY primary accent (no blue, no neon)
- Generous whitespace, calm layouts
- Subtle ReactBits-inspired animated backgrounds
- Premium golf performance tool, not gaming dashboard

### Design Tokens

#### Light Theme (Primary)

```css
--color-bg-primary: #FAFAF9;      /* Warm off-white */
--color-bg-secondary: #FFFFFF;    /* Pure white */
--color-bg-surface: #F5F5F4;      /* Stone 100 */
--color-bg-elevated: #FFFFFF;
--color-bg-card: #FFFFFF;

--color-text-primary: #1C1917;    /* Stone 900 */
--color-text-secondary: #57534E;  /* Stone 600 */
--color-text-muted: #A8A29E;      /* Stone 400 */

--color-accent: #4A7C59;          /* Sage green - golf native */
--color-accent-secondary: #7C9885;
--color-accent-strong: #2F5D3A;
--color-highlight: #D4A574;       /* Champagne - rare moments */

--color-border: rgba(28, 25, 23, 0.08);
```

#### Dark Theme (Optional)

```css
--color-bg-primary: #1A1918;      /* Warm charcoal */
--color-bg-secondary: #262524;
--color-bg-surface: #1F1E1D;

--color-text-primary: #F5F5F4;
--color-text-secondary: #D6D3D1;
--color-text-muted: #A8A29E;

--color-accent: #7C9885;          /* Lighter sage for dark */
--color-accent-strong: #4A7C59;
--color-highlight: #D4A574;
```

### Typography

- **Display/Headers:** Inter (optical sizing, -0.02em tracking)
- **Body:** Inter (optical sizing, excellent readability)
- **Mono:** JetBrains Mono

### Motion

- Fast transitions: 150ms ease
- Normal transitions: 250ms ease
- Smooth transitions: 400ms cubic-bezier(0.16, 1, 0.3, 1)
- Subtle hover lifts, soft focus states
- Aurora/dot backgrounds with reduced-motion support

### Components

- Card radius: 20-24px
- Button radius: 12-16px (pill option available)
- Soft borders (stone @ 8%)
- Elevated soft shadows

### Background Components

Located in `apps/web/src/components/ui/backgrounds/`:
- **DotGrid.tsx** - Subtle animated dot pattern
- **AuroraGlow.tsx** - Soft gradient aurora effect
- **NoiseTexture.tsx** - Subtle grain overlay for depth
- **GridPattern.tsx** - Refined grid pattern
- **BackgroundStudio.tsx** - Compositor with presets and reduced-motion support

---

## Bilingual Requirement

All UI copy must exist in both:
- English (`apps/web/src/i18n/en.json`)
- Norwegian (`apps/web/src/i18n/no.json`)

Templates like "ØKT – LOGG" and "ØKT – NYÅRSPLAN" must have English equivalents.

---

## Database Schema

### Core Entities
- **User** - Authentication + preferences
- **FriendLink** - User connections
- **Invite** - Friend invite tokens
- **Session** - Range/sim/round data
- **Shot** - Individual shot metrics
- **SessionLogTemplate** - Log structure definitions
- **SessionLog** - Subjective session data
- **CoachReport** - AI-generated reports
- **Course** - Golf course data
- **TeeTime** - Scheduled rounds
- **TrainingPlan** - Weekly training plans
- **Drill** - Training exercises
- **SwingVideo** - Uploaded videos
- **SwingAnalysis** - Video analysis results

## Connector Architecture

All data sources normalize to a universal internal schema:
- TrackMan → NormalizedSession/Shot
- Topgolf → NormalizedSession/Shot
- Foresight → NormalizedSession/Shot
- CSV Import → NormalizedSession/Shot

The rest of the app is source-agnostic.

## API Endpoints

### Auth & Friends
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/invite/create
- POST /auth/invite/accept
- GET /friends

### Connectors
- GET /connectors
- POST /connectors/{id}/connect
- POST /sessions/import/csv
- POST /sessions/import/connector/{id}

### Sessions
- GET /sessions
- GET /sessions/{id}
- GET /sessions/{id}/shots

### Session Logs
- GET /log/templates
- POST /log/templates
- POST /log/submit
- GET /log/{session_id}

### Coach
- POST /coach/report
- POST /chat

### Courses & Tee Times
- GET /courses/search
- GET /courses/{id}
- POST /tee-times
- GET /tee-times

## Deployment

| Component | Platform | Config |
|-----------|----------|--------|
| Frontend | Vercel | Auto-deploy from `apps/web` |
| Backend | Fly.io or Render | Docker deploy from `apps/api` |
| Database | Supabase | PostgreSQL free tier |

## Brand

- **Name:** StrikeLab (formal: StrikeLab Golf)
- **Domain:** StrikeLab.golf
- **Slogan:** "Get Dialed In."
- **Secondary:** "Every session becomes a plan."

---

## Implementation Status

### Phase 1: Design System Foundation ✅

| File | Status |
|------|--------|
| `apps/web/src/index.css` | ✅ Complete - Scandinavian tokens |
| `apps/web/tailwind.config.ts` | ✅ Complete - New colors, spacing, shadows |
| `apps/web/index.html` | ✅ Complete - Inter font loading |
| `apps/web/src/i18n/en.json` | ✅ Complete - Full UI copy |
| `apps/web/src/i18n/no.json` | ✅ Complete - Full UI copy |

### Phase 2: Background Components ✅

| File | Status |
|------|--------|
| `components/ui/backgrounds/DotGrid.tsx` | ✅ Created |
| `components/ui/backgrounds/AuroraGlow.tsx` | ✅ Created |
| `components/ui/backgrounds/NoiseTexture.tsx` | ✅ Created |
| `components/ui/backgrounds/GridPattern.tsx` | ✅ Created |
| `components/ui/backgrounds/BackgroundStudio.tsx` | ✅ Created |
| `components/ui/backgrounds/index.ts` | ✅ Created |

### Phase 3: Core UI Components ✅

| File | Status |
|------|--------|
| `components/ui/Card.tsx` | ✅ Updated - Soft shadows, warm white |
| `components/ui/Button.tsx` | ✅ Updated - Sage fills, pill option |
| `components/ui/Badge.tsx` | ✅ Updated - Muted sage tones |
| `components/ui/Input.tsx` | ✅ Updated - Larger, spacious |
| `components/ui/Toggle.tsx` | ✅ Updated - Sage accent |
| `components/ui/index.ts` | ✅ Updated - New exports |

### Phase 4: Global Layout ✅

| File | Status |
|------|--------|
| `components/layout/Shell.tsx` | ✅ Updated - Warm bg, dot pattern |
| `components/layout/Sidebar.tsx` | ✅ Updated - White bg, sage highlights |

### Phase 5: Pages ✅

| File | Status |
|------|--------|
| `pages/Dashboard.tsx` | ✅ Complete redesign |
| `pages/Sessions.tsx` | ✅ Updated |
| `pages/Login.tsx` | ✅ Updated |

### Remaining Pages (Future)

| File | Priority |
|------|----------|
| `pages/Register.tsx` | Medium |
| `pages/SessionDetail.tsx` | High |
| `pages/CoachChat.tsx` | High |
| `pages/MyBag.tsx` | High |
| `pages/Stats.tsx` | High |
| `pages/Connectors.tsx` | Medium |
| `pages/Courses.tsx` | Medium |
| `pages/Calendar.tsx` | Medium |
| `pages/TrainingPlan.tsx` | Medium |
| `pages/Settings.tsx` | Low |

---

## Success Criteria

1. ✅ Light theme feels premium - VolvoCars.com level of refinement
2. ✅ Dark theme is warm - Cozy, never cold/cyber
3. ✅ Sage green is dominant - No blue accents anywhere
4. ✅ Typography is crisp - Inter with optical sizing
5. ✅ Whitespace is generous - Content breathes
6. ✅ Animations are subtle - Reduced-motion respected
7. ✅ Bilingual complete - All UI copy in EN + NO
8. Tesla clarity - Data presentation clean and scannable
9. Golf-native feel - Premium golf club aesthetic
10. No gaming aesthetic - Zero cyber/neon remnants
