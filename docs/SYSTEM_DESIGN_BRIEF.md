# StrikeLab Golf — System & Design Brief

> **Purpose:** This document describes StrikeLab's current architecture, design system, and UI patterns. Use this to inform suggestions for improving the UI to be more user/profile-centric while hiding advanced features from new or casual users.

---

## 1. Product Overview

### What is StrikeLab?

**StrikeLab** is a premium golf performance tracking and coaching application designed for obsessed amateurs pursuing scratch handicap. It merges:

- **Objective data:** Launch monitor metrics (TrackMan, Foresight, Topgolf, CSV imports)
- **Subjective logging:** Energy, feel, intent, notes per session
- **AI coaching:** Personalized reports using the "Diagnose → Interpret → Prescribe → Validate" loop
- **Adaptive training plans:** Drill blocks, pressure protocols

### Brand Positioning

- **Slogan:** "Get Dialed In."
- **Secondary:** "Every session becomes a plan."
- **Position:** Decision engine, not dashboard
- **Voice:** Confident minimal coach-like microcopy
- **Audience:** Serious amateur golfers (handicap 5-20) who practice 2-5x/week

---

## 2. Current Navigation Structure

### Full Navigation Menu (Sidebar)

| Route | Label | Description | Complexity |
|-------|-------|-------------|------------|
| `/` | Home | Dashboard with handicap progress, bag overview, recent sessions | **Core** |
| `/coach/chat` | Coach Chat | AI conversational coaching (highlighted with AI badge) | **Core** |
| `/sessions` | Sessions | List of all practice sessions with shot data | **Core** |
| `/stats` | Stats | Aggregate statistics across sessions | Intermediate |
| `/my-bag` | My Bag | Equipment management (14 clubs + ball) | **Core** |
| `/courses` | Courses | Golf course library | Intermediate |
| `/connectors` | Connectors | TrackMan, Foresight, Topgolf, CSV integrations | **Advanced** |
| `/coach` | Coach Reports | AI-generated diagnostic reports | Intermediate |
| `/training` | Training Plan | Drill blocks and practice schedules | Intermediate |
| `/swing-lab` | Swing Lab | Video upload and analysis | **Advanced** |
| `/calendar` | Calendar | Tee times and scheduled rounds | Intermediate |
| `/friends` | Friends | Social features, leaderboards, comparisons | Intermediate |
| `/settings` | Settings | Profile, preferences, theme, language, units | **Core** |

### Current Problems with Navigation

1. **12 top-level items** — overwhelming for new users
2. **No progressive disclosure** — advanced features (Connectors, Swing Lab) shown equally with core features
3. **No user profile prominence** — profile is a tiny avatar at bottom of sidebar
4. **Settings buried** — accessed through small user avatar

---

## 3. User Data Model

### Core User Profile Fields

```typescript
interface User {
  id: string
  email: string
  displayName: string
  
  // Golf identity
  handicapIndex: number       // Current handicap (e.g., 12.4)
  goalHandicap: number        // Season target (e.g., 8.0)
  dreamHandicap: number       // Aspirational goal (e.g., scratch)
  practiceFrequency: string   // 'daily' | '4-5x_week' | '2-3x_week' | 'weekly' | 'occasional'
  
  // Preferences
  language: 'en' | 'no'
  units: 'yards' | 'meters'
  theme: 'light' | 'dark'
  
  // Onboarding
  onboardingCompleted: boolean
}
```

### Current Onboarding Flow

1. **Welcome** — Brand introduction
2. **Handicap** — Current handicap input with tier classification
3. **Goals** — Season goal + dream milestone
4. **Practice Frequency** — How often they practice
5. **Equipment** — Add clubs to bag (optional)
6. **Complete** — Journey preview with milestones

---

## 4. Current Design System

### Design Philosophy

**"Scandinavian Minimal Premium"** — VolvoCars.com aesthetic meets Tesla telemetry clarity

### Color Palette

#### Light Theme (Primary)
- Background: `#F5F5F3` (warm off-white)
- Surface: `#FFFFFF`
- Accent: `#4C8C61` (sage green) — **ONLY primary accent**
- Highlight: `#D4A574` (champagne) — rare moments only
- Text Primary: `#1A1A1A`
- Text Muted: `#8A8A8A`

#### Dark Theme
- Background: `#1C1B1A` (warm charcoal)
- Surface: `#2A2928`
- Accent: `#6BA37D` (lighter sage for dark)
- Text Primary: `#F5F5F3`

### Typography

- **Display/Headers:** Inter, -0.02em letter-spacing
- **Body:** Inter, optical sizing
- **Mono:** JetBrains Mono

### Component Patterns

**Cards:** 
- Glassmorphism with backdrop blur
- 24px border radius (`rounded-card`)
- Soft shadows with 8% opacity
- Interactive hover states with lift effect

**Buttons:**
- Primary: Sage gradient fill, white text
- Secondary: Glassmorphic with subtle border
- Pill variant for filters/toggles

**Motion:**
- Framer Motion throughout
- 150ms fast transitions
- 250ms normal transitions  
- Staggered entrance animations

---

## 5. Current Dashboard Layout

### Hero Section
- Greeting with user name
- User avatar (first letter, small)
- Progress to handicap goal (bar chart)
- "Ask Coach" CTA button

### Stats Strip (4 columns)
- Sessions count
- Total shots
- Streak (days)
- Next round countdown

### Your Bag Section
- Horizontal scrollable club strip with scores
- Selected club detail panel with stats
- Links to review stats / practice

### AI Insights Row (2 columns)
- "Next Best Move" card → links to coach
- "Next Round" card → links to calendar

### Recent Sessions (3 columns)
- Session cards with shot count, date, strike score

---

## 6. Feature Categorization for Progressive Disclosure

### Essential Features (Show Always)
These should be prominent and accessible:
- Dashboard / Home
- Coach Chat (AI)
- My Bag
- Settings / Profile

### Standard Features (Show After Engagement)
These can be revealed after user has some data:
- Sessions list
- Stats
- Calendar / Tee Times
- Coach Reports
- Training Plans

### Power Features (Hidden by Default)
These are for advanced users and should be opt-in or discoverable:
- Connectors (TrackMan, Foresight, Topgolf sync)
- Swing Lab (video analysis)
- Friends / Leaderboards
- Courses library (can be auto-suggested)

---

## 7. Current Pain Points

### 1. Not Profile-Centric
- User identity is a tiny avatar at sidebar bottom
- No dedicated "profile" or "my game" view
- Handicap journey is just one card on dashboard
- No clear "about me as a golfer" narrative

### 2. Overwhelming Navigation
- 12 items in sidebar for everyone
- No grouping or hierarchy
- Advanced features like "Connectors" shown equally with "Home"
- No progressive disclosure based on user maturity

### 3. Onboarding Drops Users Into Complex UI
- After onboarding, user sees full navigation
- No guided path to first value moment
- Equipment setup is optional but important for tracking

### 4. No Clear User Journey
- What should a new user do first?
- What's the "magic moment" for StrikeLab?
- How do we guide them to it?

---

## 8. Suggested Improvement Directions

### A. Profile-Centric Dashboard

**Instead of generic dashboard, make it "Your Golf Identity":**

1. **Hero Profile Card**
   - Large avatar with customization
   - Handicap prominently displayed
   - Goal with progress ring
   - Practice commitment badge

2. **Journey Timeline**
   - Visual path from current → season goal → dream
   - Milestones as checkpoints
   - Predicted dates based on practice frequency

3. **Your Bag as Identity**
   - Featured clubs with performance scores
   - Ball choice prominent
   - Equipment as expression of golfer identity

### B. Simplified Navigation with Progressive Disclosure

**Primary Tab Bar (Bottom on Mobile, Top on Desktop):**
- Home (profile/dashboard)
- Practice (sessions + training)
- Coach (AI chat + reports)
- Profile/Settings

**Secondary Navigation (Inside Sections):**
- Equipment, Stats, Calendar inside Profile
- Session history, Training plans inside Practice
- Chat, Reports, Insights inside Coach

**Power Features (Settings Toggle):**
- "Enable Advanced Mode" → reveals Connectors, Swing Lab, Friends

### C. User States to Consider

1. **Brand New** — Just registered, no data
   - Focus on identity setup (handicap, goals)
   - Minimal UI, guided steps
   
2. **Bag Setup** — Has profile, adding equipment
   - Feature equipment prominently
   - Show what tracking unlocks

3. **First Session** — Ready to import/log first practice
   - Guide to connectors or manual entry
   - Celebrate first data

4. **Active User** — Multiple sessions, using AI coach
   - Full feature access
   - Performance trends prominent

5. **Power User** — Uses all advanced features
   - Full navigation visible
   - Customizable dashboard

---

## 9. Key Questions for UI Redesign

1. **What should a first-time user see?**
   - Empty dashboard? Profile setup? Guided tour?

2. **Where should "My Profile" live?**
   - As the home page?
   - As a section within home?
   - As its own top-level route?

3. **How do we surface AI Coach without it feeling buried?**
   - It's currently just another nav item
   - Could be persistent assistant?

4. **What's the role of the sidebar?**
   - Should it exist at all?
   - Could be replaced with tab bar?

5. **How do we handle bilingual (EN/NO) UI?**
   - Currently a toggle in sidebar
   - Could be in profile/settings

---

## 10. Technical Context

### Frontend Stack
- React 18 + Vite + TypeScript
- TailwindCSS (custom config with design tokens)
- Framer Motion for animations
- Zustand for state management
- TanStack Query for data fetching
- React Router v6
- i18next for translations

### Current Component Library
- `Card`, `Button`, `Badge`, `Input`, `Select`, `Toggle`
- `MetricCard`, `FeatureCard` for dashboard
- `BackgroundStudio` with aurora/dots/grid effects
- `Shell` + `Sidebar` layout components

### Responsive Considerations
- Desktop-first currently
- Sidebar collapses to icons on smaller screens
- Mobile experience needs more work

---

## 11. Visual References

### Current Aesthetic Inspirations
- VolvoCars.com — Scandinavian minimal, warm
- Tesla UI — Clean data visualization
- Linear.app — Sleek glass effects
- Arc Browser — Progressive disclosure

### Golf App Competitors
- Arccos — Data heavy, complex
- Grint — Social focused
- 18Birdies — Accessible, round-tracking
- Shot Scope — Hardware + app integration

**StrikeLab Differentiator:** AI coaching loop + practice focus (not just round tracking)

---

## 12. Summary of Desired Changes

| Current State | Desired State |
|--------------|---------------|
| 12 nav items equally weighted | 4 primary tabs + discoverable secondary |
| Small user avatar at bottom | Profile-centric home with large identity |
| All features visible immediately | Progressive disclosure by user maturity |
| Dashboard is data-centric | Dashboard is identity + journey centric |
| Advanced features prominent | Power features hidden until needed |
| Sessions as primary focus | AI Coach + Profile as primary focus |
| Equipment optional feel | Equipment as golfer identity expression |

---

## 13. Request for Gemini

Please analyze this system and suggest:

1. **Information Architecture Redesign** — How should navigation be restructured for progressive disclosure?

2. **Profile-Centric Home Design** — What should the new home/profile page look like?

3. **Mobile-First Navigation Pattern** — Tab bar? Drawer? Hub and spoke?

4. **User State Handling** — How do we show different UI for new vs active vs power users?

5. **AI Coach Integration** — How can the AI coach feel more integrated and accessible?

6. **Visual Hierarchy Improvements** — What needs more/less prominence?

Consider the Scandinavian minimal aesthetic, the premium feel, and the goal of making the app feel personal and about *your* golf journey, not a dashboard of features.
