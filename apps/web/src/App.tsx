import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useRealtime } from '@/realtime/useRealtime'
import { Shell } from '@/components/layout/Shell'
import { SLLogo } from '@/components/ui'
import Dashboard from '@/pages/Dashboard'
import Sessions from '@/pages/Sessions'
import SessionDetail from '@/pages/SessionDetail'
import SessionLog from '@/pages/SessionLog'
import Connectors from '@/pages/Connectors'
import CoachReport from '@/pages/CoachReport'
import CoachChat from '@/pages/CoachChat'
import TrainingPlan from '@/pages/TrainingPlan'
import Calendar from '@/pages/Calendar'
import Friends from '@/pages/Friends'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Onboarding from '@/pages/Onboarding'
import MyBag from '@/pages/MyBag'
import Courses from '@/pages/Courses'
import CourseDetail from '@/pages/CourseDetail'
import Settings from '@/pages/Settings'
import Stats from '@/pages/Stats'
import Marketing from '@/pages/Marketing'
import Rounds from '@/pages/Rounds'
import RoundDetail from '@/pages/RoundDetail'
import RoundPlan from '@/pages/RoundPlan'
import SwingLabLibrary from '@/pages/SwingLabLibrary'
import SwingLabAnalyze from '@/pages/SwingLabAnalyze'
import SwingLabCompare from '@/pages/SwingLabCompare'
import RangeLab from '@/pages/RangeLab'
import RangeLabDetail from '@/pages/RangeLabDetail'
import Play from '@/pages/Play'
import OpenGolfApiDocs from '@/pages/OpenGolfApiDocs'
import {
  TeeDiscover,
  TeeCourseHero,
  TeeSheet,
  TeeGroup,
  TeePay,
  TeePass,
  TeePreferences,
} from '@/pages/tee'

function PublicInfoPage({ type }: { type: 'privacy' | 'terms' | 'security' | 'support' }) {
  const { i18n } = useTranslation()
  const isNo = i18n.language === 'no'
  const content = {
    privacy: {
      eyebrow: 'Privacy',
      eyebrowNo: 'Personvern',
      title: 'Your golf data stays yours.',
      titleNo: 'Golfdataene dine er dine.',
      body:
        'StrikeLab collects account details, golf sessions, rounds, course preferences, approximate and on-course location, Apple Watch workout data, heart-rate context, swing motion samples, and optional short impact-audio clips when you enable microphone capture. We use this data to provide caddie, range, scorecard, sync, and coaching features. We do not sell personal performance data. You can delete your account and associated synced data from Settings.',
      bodyNo:
        'StrikeLab samler inn kontodetaljer, golføkter, runder, banepreferanser, omtrentlig og banerelatert posisjon, Apple Watch-treningsdata, puls-kontekst, svingbevegelse og valgfrie korte impact-lydklipp når du aktiverer mikrofonopptak. Dataene brukes til caddie-, range-, scorekort-, synk- og coachingfunksjoner. Vi selger ikke personlige ytelsesdata. Du kan slette konto og tilknyttede synkroniserte data fra Innstillinger.',
    },
    terms: {
      eyebrow: 'Terms',
      eyebrowNo: 'Vilkår',
      title: 'Beta access, clear expectations.',
      titleNo: 'Betatilgang, tydelige forventninger.',
      body:
        'StrikeLab provides golf performance tools, not medical, safety, or professional tournament advice. You remain responsible for safe play on course and range. First-release mobile features focus on caddie, scoring, range capture, Apple Watch companion use, and account sync. Any paid access or booking flow will show pricing, cancellation, and billing terms before checkout.',
      bodyNo:
        'StrikeLab tilbyr golfverktøy, ikke medisinske råd, sikkerhetsråd eller profesjonelle turneringsråd. Du er selv ansvarlig for trygg bruk på bane og range. Første mobilversjon fokuserer på caddie, score, range-opptak, Apple Watch og kontosynk. Betalt tilgang eller booking viser pris, avbestilling og fakturavilkår før betaling.',
    },
    security: {
      eyebrow: 'Data security',
      eyebrowNo: 'Datasikkerhet',
      title: 'Built for sensitive performance context.',
      titleNo: 'Bygget for sensitiv ytelseskontekst.',
      body:
        'StrikeLab handles golf performance, round, location-adjacent, and watch companion data with explicit account access. Production payment and provider connections should be treated as beta until marked live in-product.',
      bodyNo:
        'StrikeLab håndterer golfytelse, runder, stedsnære data og klokke-data med tydelig kontotilgang. Produksjonsbetaling og leverandørkoblinger skal behandles som beta til de er merket live i produktet.',
    },
    support: {
      eyebrow: 'Support',
      eyebrowNo: 'Support',
      title: 'We can help with account, sync, and deletion requests.',
      titleNo: 'Vi hjelper med konto, synk og sletting.',
      body:
        'Contact hello@strikelab.golf for support. Account deletion is available from Settings in the web and iPhone app. We aim to respond to support and privacy requests within 7 days.',
      bodyNo:
        'Kontakt hello@strikelab.golf for hjelp. Kontosletting er tilgjengelig fra Innstillinger på web og iPhone. Vi forsøker å svare på support- og personvernforespørsler innen 7 dager.',
    },
  }[type]

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line-strong px-5 sm:px-8 py-4">
        <div className="max-w-[960px] mx-auto flex items-center justify-between">
          <Link to="/" className="text-ink hover:text-accent-fg" aria-label="StrikeLab home">
            <SLLogo size={20} withWord wordSize={12} condensed />
          </Link>
          <Link to="/" className="mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-ink">
            {isNo ? 'Tilbake' : 'Back'}
          </Link>
        </div>
      </header>
      <main className="px-5 sm:px-8 py-20 max-w-[960px] mx-auto">
        <div className="micro">{isNo ? content.eyebrowNo : content.eyebrow}</div>
        <h1 className="display text-[clamp(3rem,8vw,7rem)] mt-6">
          {isNo ? content.titleNo : content.title}
        </h1>
        <p className="text-[18px] text-ink-2 leading-[1.6] mt-8 max-w-[720px]">
          {isNo ? content.bodyNo : content.body}
        </p>
        <div className="mt-10 border border-line-strong p-5 text-body text-ink-2">
          {isNo ? 'Kontakt' : 'Contact'}:{' '}
          <a href="mailto:hello@strikelab.golf" className="text-accent-fg hover:text-accent-fg-hover">hello@strikelab.golf</a>
        </div>
        {type === 'privacy' && (
          <div className="mt-6 border border-line-strong p-5 text-body text-ink-2 space-y-3">
            <p>Data processors include Clerk for authentication, Vercel for hosting/functions, PostgreSQL for app data, and Vercel Blob or filesystem storage for optional media.</p>
            <p>Health and sensor data are used only for StrikeLab features you enable. Microphone impact capture is optional and off by default.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated) {
    if (window.location.pathname === '/') return <Marketing />
    return <Navigate to="/login" replace />
  }
  if (user && !user.onboardingCompleted && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.onboardingCompleted) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  const theme = useSettingsStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  // Single global WebSocket subscription — keeps round/shot caches
  // fresh whenever the API broadcasts a write (typically from iOS).
  useRealtime()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/sso-callback"
          element={
            <AuthenticateWithRedirectCallback
              signInFallbackRedirectUrl="/"
              signUpFallbackRedirectUrl="/onboarding"
            />
          }
        />
        <Route path="/privacy" element={<PublicInfoPage type="privacy" />} />
        <Route path="/terms" element={<PublicInfoPage type="terms" />} />
        <Route path="/security" element={<PublicInfoPage type="security" />} />
        <Route path="/support" element={<PublicInfoPage type="support" />} />
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="sessions/:id/log" element={<SessionLog />} />
          <Route path="coach" element={<CoachReport />} />
          <Route path="coach/chat" element={<CoachChat />} />
          <Route path="training" element={<TrainingPlan />} />
          <Route path="my-bag" element={<MyBag />} />
          <Route path="connectors" element={<Connectors />} />
          <Route path="open-api" element={<OpenGolfApiDocs />} />

          <Route path="play" element={<Play />} />
          <Route path="rounds" element={<Rounds />} />
          <Route path="rounds/:id" element={<RoundDetail />} />
          <Route path="rounds/:id/plan" element={<RoundPlan />} />
          <Route path="calendar" element={<Navigate to="/tee" replace />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />

          {/* StrikeLab Tee — booking surface */}
          <Route path="tee" element={<TeeDiscover />} />
          <Route path="tee/preferences" element={<TeePreferences />} />
          <Route path="tee/courses/:id" element={<TeeCourseHero />} />
          <Route path="tee/courses/:id/sheet" element={<TeeSheet />} />
          <Route path="tee/booking/:holdId/group" element={<TeeGroup />} />
          <Route path="tee/booking/:holdId/pay" element={<TeePay />} />
          <Route path="tee/passes/:id" element={<TeePass />} />

          {/* Legacy calendar fallback (kept for back-compat with older calendar links) */}
          <Route path="calendar/old" element={<Calendar />} />

          <Route path="lab/range" element={<RangeLab />} />
          <Route path="lab/range/:id" element={<RangeLabDetail />} />
          <Route path="lab" element={<SwingLabLibrary />} />
          <Route path="lab/analyze/:id" element={<SwingLabAnalyze />} />
          <Route path="lab/compare" element={<SwingLabCompare />} />

          <Route path="stats" element={<Stats />} />
          <Route path="friends" element={<Friends />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
