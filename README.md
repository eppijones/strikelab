# StrikeLab Golf

**Get Dialed In.** Every session becomes a plan.

StrikeLab is a premium golf performance lab that merges objective launch monitor data with subjective session logs, AI coaching, and adaptive training plans.

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (or Docker)
- pnpm (recommended) or npm

### 1. Clone and Setup

```bash
git clone https://github.com/eppijones/strikelab.git
cd strikelab
```

### 2. Start Database

Using Docker:
```bash
docker-compose up -d
```

Or use your own PostgreSQL instance and update `DATABASE_URL`.

### 3. Backend Setup

```bash
cd apps/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run migrations
alembic upgrade head

# Seed demo data
python -m app.seed.demo_data

# Start server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd apps/web

# Install dependencies
pnpm install  # or npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API URL

# Start dev server
pnpm dev  # or npm run dev
```

The app will be available at http://localhost:5173

## Environment Variables

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:8000
```

### Backend (`apps/api/.env`)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/strikelab
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DEBUG=true
```

## Project Structure

```
strikelab/
├── apps/
│   ├── web/                 # React + Vite + TypeScript
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── pages/       # Route pages
│   │   │   ├── stores/      # Zustand state
│   │   │   ├── api/         # TanStack Query hooks
│   │   │   └── i18n/        # Translations (EN/NO)
│   │   └── ...
│   │
│   └── api/                 # FastAPI backend
│       ├── app/
│       │   ├── models/      # SQLAlchemy models
│       │   ├── schemas/     # Pydantic schemas
│       │   ├── routers/     # API routes
│       │   ├── services/    # Business logic
│       │   └── seed/        # Demo data
│       └── ...
│
├── data/                    # Sample import files
└── docker-compose.yml       # Local PostgreSQL
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set root directory to `apps/web`
3. Add environment variable: `VITE_API_URL`
4. Deploy automatically on push

### Backend (Fly.io)

```bash
cd apps/api

# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and launch
fly auth login
fly launch

# Set secrets
fly secrets set DATABASE_URL="your-supabase-url"
fly secrets set SECRET_KEY="your-production-secret"
fly secrets set CORS_ORIGINS="https://strikelab.golf"

# Deploy
fly deploy
```

### Backend (Render)

1. Create new Web Service on Render
2. Connect to GitHub repo
3. Set root directory to `apps/api`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables

### Database (Supabase)

1. Create project on Supabase
2. Copy connection string (with pooler for serverless)
3. Use as `DATABASE_URL` in backend

## Features

- **Dashboard** - Skill scores, recent sessions, training plans
- **Sessions** - Shot data, dispersion plots, trend charts
- **Session Logs** - Subjective logging (energy, feel, intent)
- **Coach Reports** - AI-generated diagnose → prescribe → validate
- **Connectors** - TrackMan, Topgolf, Foresight, CSV import
- **Training Plans** - Drill blocks, pressure protocols
- **Calendar** - Tee times, course library
- **Friends** - Compare metrics, leaderboards

## Bilingual Support

Toggle between English and Norwegian in the sidebar. All UI text and templates available in both languages.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query, Recharts
- **Backend:** FastAPI, SQLAlchemy, Alembic, PostgreSQL
- **Auth:** JWT + refresh tokens
- **Deploy:** Vercel (frontend), Fly.io/Render (backend), Supabase (database)

## License

Private - StrikeLab Golf
