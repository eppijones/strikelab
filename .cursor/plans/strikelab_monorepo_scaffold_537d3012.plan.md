---
name: StrikeLab Monorepo Scaffold
overview: Generate a complete production-ready monorepo for StrikeLab Golf with React/Vite frontend, FastAPI backend, PostgreSQL schema, premium dark UI with Electric Cyan accents, bilingual support (EN/NO), connector architecture, and all MVP modules including session logging, coach reports, and training plans.
todos:
  - id: root-files
    content: Create PLAN.md, README.md, .gitignore, docker-compose.yml, sample CSV
    status: completed
  - id: web-config
    content: Setup React/Vite/TS with Tailwind, package.json, configs
    status: completed
    dependencies:
      - root-files
  - id: web-design-system
    content: Build design tokens, CSS variables, UI primitives (Button, Card, Input)
    status: completed
    dependencies:
      - web-config
  - id: web-i18n
    content: Setup i18next with EN/NO translations
    status: completed
    dependencies:
      - web-config
  - id: web-stores
    content: Create Zustand stores (auth, settings, session)
    status: completed
    dependencies:
      - web-config
  - id: web-api-layer
    content: Build TanStack Query hooks for all endpoints
    status: completed
    dependencies:
      - web-config
  - id: web-layout
    content: Create Shell, Sidebar, Nav with premium dark UI
    status: completed
    dependencies:
      - web-design-system
  - id: web-pages
    content: Build all 12 page components with routing
    status: completed
    dependencies:
      - web-layout
      - web-api-layer
  - id: web-charts
    content: Implement Recharts + dispersion ellipse canvas
    status: completed
    dependencies:
      - web-design-system
  - id: api-config
    content: Setup FastAPI with requirements, config, database connection
    status: completed
    dependencies:
      - root-files
  - id: api-models
    content: Create all SQLAlchemy models + Alembic migration
    status: completed
    dependencies:
      - api-config
  - id: api-schemas
    content: Build Pydantic schemas for all entities
    status: completed
    dependencies:
      - api-models
  - id: api-routers
    content: Implement all API routers (auth, sessions, logs, coach, etc.)
    status: completed
    dependencies:
      - api-schemas
  - id: api-connectors
    content: Build connector framework + CSV importer
    status: completed
    dependencies:
      - api-schemas
  - id: api-coach-engine
    content: Implement coach report generation service
    status: completed
    dependencies:
      - api-schemas
  - id: api-seed
    content: Create demo data + bilingual templates seeder
    status: completed
    dependencies:
      - api-models
---

# StrikeLab Golf - Full Monorepo Scaffold Plan

## Repository Structure

```
/
├── PLAN.md                    # Architecture documentation
├── README.md                  # Setup + deployment guide
├── .gitignore
├── apps/
│   ├── web/                   # React + Vite + TypeScript frontend
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── public/
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── index.css         # Tailwind + design tokens
│   │       ├── i18n/             # Bilingual translations
│   │       │   ├── index.ts
│   │       │   ├── en.json
│   │       │   └── no.json
│   │       ├── stores/           # Zustand stores
│   │       │   ├── authStore.ts
│   │       │   ├── settingsStore.ts (units + language)
│   │       │   └── sessionStore.ts
│   │       ├── api/              # TanStack Query hooks
│   │       │   ├── client.ts
│   │       │   ├── auth.ts
│   │       │   ├── sessions.ts
│   │       │   ├── logs.ts
│   │       │   └── coach.ts
│   │       ├── components/
│   │       │   ├── ui/           # Design system primitives
│   │       │   ├── layout/       # Shell, Sidebar, Nav
│   │       │   ├── charts/       # Recharts + dispersion
│   │       │   └── cards/        # Premium card variants
│   │       ├── pages/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── Sessions.tsx
│   │       │   ├── SessionDetail.tsx
│   │       │   ├── SessionLog.tsx
│   │       │   ├── Connectors.tsx
│   │       │   ├── CoachReport.tsx
│   │       │   ├── TrainingPlan.tsx
│   │       │   ├── SwingLab.tsx
│   │       │   ├── Calendar.tsx
│   │       │   ├── Friends.tsx
│   │       │   ├── Login.tsx
│   │       │   └── Register.tsx
│   │       └── lib/
│   │           ├── utils.ts
│   │           └── constants.ts
│   │
│   └── api/                   # FastAPI backend
│       ├── requirements.txt
│       ├── alembic.ini
│       ├── alembic/
│       │   └── versions/
│       ├── app/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── database.py
│       │   ├── models/           # SQLAlchemy models
│       │   │   ├── __init__.py
│       │   │   ├── user.py
│       │   │   ├── session.py
│       │   │   ├── shot.py
│       │   │   ├── log.py
│       │   │   ├── coach.py
│       │   │   ├── course.py
│       │   │   └── training.py
│       │   ├── schemas/          # Pydantic schemas
│       │   ├── routers/          # API routes
│       │   │   ├── auth.py
│       │   │   ├── sessions.py
│       │   │   ├── logs.py
│       │   │   ├── connectors.py
│       │   │   ├── coach.py
│       │   │   ├── courses.py
│       │   │   └── friends.py
│       │   ├── services/
│       │   │   ├── auth.py
│       │   │   ├── coach_engine.py
│       │   │   └── connectors/
│       │   │       ├── base.py
│       │   │       ├── trackman.py
│       │   │       ├── topgolf.py
│       │   │       ├── foresight.py
│       │   │       └── csv_importer.py
│       │   └── seed/
│       │       ├── demo_data.py
│       │       └── templates.py
│       └── Dockerfile
│
├── data/
│   └── sample_session.csv        # Demo import file
└── docker-compose.yml            # Local dev environment
```

---

## Database Schema Overview

```mermaid
erDiagram
    User ||--o{ Session : owns
    User ||--o{ FriendLink : has
    User ||--o{ Invite : creates
    User ||--o{ TeeTime : books
    Session ||--o{ Shot : contains
    Session ||--o| SessionLog : has
    Session ||--o{ CoachReport : generates
    SessionLogTemplate ||--o{ SessionLog : uses
    Course ||--o{ TeeTime : hosts
    User ||--o{ TrainingPlan : follows
    TrainingPlan ||--o{ Drill : includes
    User ||--o{ SwingVideo : uploads
    SwingVideo ||--o| SwingAnalysis : analyzed

    User {
        uuid id PK
        string email
        string password_hash
        string display_name
        float handicap_index
        string language
        string units
        timestamp created_at
    }

    Session {
        uuid id PK
        uuid user_id FK
        string source
        string session_type
        timestamp session_date
        json raw_data
        json computed_stats
    }

    Shot {
        uuid id PK
        uuid session_id FK
        int shot_number
        string club
        float carry_distance
        float total_distance
        float ball_speed
        float club_speed
        float smash_factor
        float launch_angle
        float spin_rate
        float spin_axis
        float face_angle
        float face_to_path
        float attack_angle
        float offline_distance
        boolean is_mishit
        string mishit_type
    }

    SessionLog {
        uuid id PK
        uuid session_id FK
        uuid template_id FK
        int energy_level
        int mental_state
        string intent
        boolean routine_discipline
        json feel_tags
        json shot_blocks
        text what_worked
        text take_forward
        text dont_overthink
        text coach_note
        boolean fatigue_mode
    }

    SessionLogTemplate {
        uuid id PK
        string name
        string language
        json structure
        boolean is_default
    }

    CoachReport {
        uuid id PK
        uuid session_id FK
        text diagnosis
        text interpretation
        text prescription
        text validation
        text next_best_move
        json linked_metrics
    }
```

---

## UI Routes and Sidebar Navigation

| Route | Page | Sidebar Label |

|-------|------|---------------|

| `/` | Dashboard | Home |

| `/sessions` | Sessions List | Sessions |

| `/sessions/:id` | Session Detail | - |

| `/sessions/:id/log` | Session Log Form | - |

| `/connectors` | Connectors Hub | Connectors |

| `/coach` | Coach Reports | Coach |

| `/training` | Training Plan | Training |

| `/swing-lab` | Swing Lab | Swing Lab |

| `/calendar` | Calendar + Tee Times | Calendar |

| `/friends` | Friends + Compare | Friends |

| `/login` | Login | - |

| `/register` | Register | - |

Sidebar: Dark obsidian panel, Electric Cyan active indicator, language toggle in footer.

---

## Connector Architecture

```mermaid
flowchart LR
    subgraph sources [Data Sources]
        TM[TrackMan]
        TG[Topgolf]
        FS[Foresight]
        CSV[CSV File]
    end

    subgraph connectors [Connector Layer]
        TMC[TrackManConnector]
        TGC[TopgolfConnector]
        FSC[ForesightConnector]
        CSVC[CSVImporter]
    end

    subgraph normalize [Normalization]
        NS[NormalizedSession]
        NSH[NormalizedShot]
    end

    subgraph storage [Storage]
        DB[(PostgreSQL)]
    end

    TM --> TMC
    TG --> TGC
    FS --> FSC
    CSV --> CSVC

    TMC --> NS
    TGC --> NS
    FSC --> NS
    CSVC --> NS

    NS --> DB
    NSH --> DB
```

Each connector implements `BaseConnector` with methods:

- `parse_raw(data) -> NormalizedSession`
- `map_club_names(raw_club) -> StandardClub`
- `extract_shots(data) -> List[NormalizedShot]`

---

## Session Log Template Schema

```json
{
  "id": "uuid",
  "name": "ØKT 1 – LOGG",
  "language": "no",
  "structure": {
    "pre_session": {
      "energy": { "type": "scale", "min": 1, "max": 5 },
      "mental_state": { "type": "scale", "min": 1, "max": 5 },
      "intent": { "type": "text", "placeholder": "Hva trener du på?" },
      "routine_discipline": { "type": "boolean" },
      "feel_tags": { "type": "tags", "options": ["rolig", "tung", "sen", "stress", "fokusert"] }
    },
    "shot_blocks": [
      { "name": "Oppvarming", "fields": ["hit_target", "miss_pattern"] },
      { "name": "Hovedøkt", "fields": ["hit_target", "miss_pattern", "notes"] }
    ],
    "post_session": {
      "what_worked": { "type": "text" },
      "take_forward": { "type": "text" },
      "dont_overthink": { "type": "text" },
      "coach_note": { "type": "text" }
    },
    "fatigue_mode": true
  }
}
```

Templates seeded in both Norwegian (ØKT 1 – LOGG, ØKT 1 – NYÅRSPLAN) and English (SESSION 1 – LOG, SESSION 1 – NEW YEAR PLAN).

---

## Coach Report Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as FastAPI
    participant CE as CoachEngine
    participant DB as Database

    U->>FE: Request Coach Report
    FE->>API: POST /coach/report
    API->>DB: Fetch Session + Shots
    API->>DB: Fetch SessionLog
    API->>CE: generate_report(session, log)
    CE->>CE: Analyze metrics vs feel correlation
    CE->>CE: Build diagnosis with proof
    CE->>CE: Generate prescription
    CE-->>API: CoachReport
    API->>DB: Store CoachReport
    API-->>FE: Return report
    FE-->>U: Render premium report card
```

---

## Bilingual i18n Strategy

- Library: `i18next` + `react-i18next`
- Files: `src/i18n/en.json`, `src/i18n/no.json`
- Global toggle in Zustand `settingsStore` → persisted to localStorage
- Toggle UI: Language pill in sidebar footer (EN | NO)

Structure:

```json
{
  "nav": { "home": "Home", "sessions": "Sessions", ... },
  "dashboard": { "title": "Welcome back", "strike_score": "Strike Score", ... },
  "log": { "energy": "Energy Level", "mental_state": "Mental State", ... },
  "coach": { "diagnosis": "Diagnosis", "prescription": "Prescription", ... }
}
```

---

## Deployment Plan

| Component | Platform | Config |

|-----------|----------|--------|

| Frontend | Vercel | Auto-deploy from `apps/web`, env: `VITE_API_URL` |

| Backend | Fly.io or Render | Docker deploy from `apps/api`, env: `DATABASE_URL`, `SECRET_KEY` |

| Database | Supabase | PostgreSQL free tier, connection pooler enabled |

Environment Variables:

- Frontend: `VITE_API_URL`
- Backend: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `DEBUG`

---

## Design System Tokens

```css
:root {
  /* Colors */
  --color-obsidian: #0A0A0F;
  --color-graphite: #141419;	
  --color-surface: #1A1A22;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-ice-white: #F4F4F6;
  --color-muted: #8A8A99;
  --color-cyan: #23D5FF;
  --color-cyan-glow: rgba(35, 213, 255, 0.3);
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Inter Tight', 'Inter', sans-serif;
  
  /* Spacing */
  --radius-card: 20px;
  --radius-button: 12px;
  
  /* Shadows */
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 24px var(--color-cyan-glow);
  
  /* Motion */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

---

## Files to Generate

### Root Level (5 files)

- `PLAN.md` - This architecture document
- `README.md` - Setup and deployment guide
- `.gitignore` - Standard ignores
- `docker-compose.yml` - Local PostgreSQL
- `data/sample_session.csv` - Demo import file

### Frontend `/apps/web` (~35 files)

- Config: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `index.html`
- Core: `main.tsx`, `App.tsx`, `index.css`
- i18n: `index.ts`, `en.json`, `no.json`
- Stores: `authStore.ts`, `settingsStore.ts`, `sessionStore.ts`
- API: `client.ts`, `auth.ts`, `sessions.ts`, `logs.ts`, `coach.ts`
- Components: ~15 UI components (Button, Card, Input, Sidebar, Nav, Charts, etc.)
- Pages: 12 page components

### Backend `/apps/api` (~30 files)

- Config: `requirements.txt`, `alembic.ini`, `Dockerfile`
- Core: `main.py`, `config.py`, `database.py`
- Models: 10 SQLAlchemy models
- Schemas: Pydantic schemas for each entity
- Routers: 7 router modules
- Services: Auth, Coach Engine, 5 connector modules
- Seed: Demo data + templates

---

## First-Week Milestones

| Day | Milestone |

|-----|-----------|

| 1 | Repo scaffold complete, local dev running, DB migrations done |

| 2 | Auth flow (register/login) working, basic dashboard shell |

| 3 | CSV connector + Session/Shot import, session list page |

| 4 | Session detail + dispersion chart, shot table with filters |

| 5 | Session log template system, log form UI |

| 6 | Coach report generation, premium report cards |

| 7 | Deploy to Vercel + Fly.io, polish, demo data visible |