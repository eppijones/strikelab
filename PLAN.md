# StrikeLab Golf - Architecture Plan

## Overview

StrikeLab is a premium golf performance lab for obsessed amateurs pursuing scratch. It merges objective launch monitor data with subjective session logs, AI coaching reports, adaptive training plans, and course/calendar context to drive a closed-loop improvement engine.

**Core Mechanic:** Diagnose → Interpret → Prescribe → Validate

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

### Backend
- FastAPI (Python 3.11)
- PostgreSQL + SQLAlchemy + Alembic
- JWT + refresh tokens
- Connector framework (TrackMan, Topgolf, Foresight, CSV)

## Design System

### Colors
- **Obsidian:** #0A0A0F (base background)
- **Graphite:** #141419 (elevated surfaces)
- **Surface:** #1A1A22 (cards)
- **Border:** rgba(255, 255, 255, 0.08)
- **Ice White:** #F4F4F6 (primary text)
- **Muted:** #8A8A99 (secondary text)
- **Electric Cyan:** #23D5FF (signature accent)
- **Cyan Glow:** rgba(35, 213, 255, 0.3)

### Typography
- Primary: Inter
- Display: Inter Tight

### Motion
- Fast transitions: 150ms ease
- Normal transitions: 250ms ease
- Subtle hover lifts, glow active states
- Animated gradient backgrounds (hero/nav)

### Components
- Card radius: 20-24px
- Button radius: 12px
- Thin borders (white @ 8%)
- Deep soft shadows

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
