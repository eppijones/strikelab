import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import SwingLabLibrary from '@/pages/SwingLabLibrary'
import SwingLabAnalyze from '@/pages/SwingLabAnalyze'
import SwingLabCompare from '@/pages/SwingLabCompare'
import RangeLab from '@/pages/RangeLab'
import RangeLabDetail from '@/pages/RangeLabDetail'
import Play from '@/pages/Play'
import {
  TeeDiscover,
  TeeCourseHero,
  TeeSheet,
  TeeGroup,
  TeePay,
  TeePass,
  TeePreferences,
} from '@/pages/tee'

function PublicInfoPage({ type }: { type: 'privacy' | 'terms' | 'security' }) {
  const { i18n } = useTranslation()
  const isNo = i18n.language === 'no'
  const content = {
    privacy: {
      eyebrow: 'Privacy',
      eyebrowNo: 'Personvern',
      title: 'Your golf data stays yours.',
      titleNo: 'Golfdataene dine er dine.',
      body:
        'StrikeLab uses imported sessions, rounds, course preferences, and device data to build your player profile. We do not sell personal performance data, and beta provider/payment features are clearly labeled before you connect or pay.',
      bodyNo:
        'StrikeLab bruker importerte økter, runder, banepreferanser og enhetsdata for å bygge spillerprofilen din. Vi selger ikke personlige ytelsesdata, og beta-funksjoner for leverandører og betaling merkes tydelig før du kobler til eller betaler.',
    },
    terms: {
      eyebrow: 'Terms',
      eyebrowNo: 'Vilkår',
      title: 'Beta access, clear expectations.',
      titleNo: 'Betatilgang, tydelige forventninger.',
      body:
        'StrikeLab is in beta. Pricing, provider connections, booking availability, and payment methods may change as pilots open. Paid access will show cancellation and billing terms before checkout.',
      bodyNo:
        'StrikeLab er i beta. Priser, leverandørkoblinger, bookingtilgjengelighet og betalingsmåter kan endres når piloter åpnes. Betalt tilgang viser avbestilling og fakturavilkår før betaling.',
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
        <Route path="/privacy" element={<PublicInfoPage type="privacy" />} />
        <Route path="/terms" element={<PublicInfoPage type="terms" />} />
        <Route path="/security" element={<PublicInfoPage type="security" />} />
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

          <Route path="play" element={<Play />} />
          <Route path="rounds" element={<Rounds />} />
          <Route path="rounds/:id" element={<RoundDetail />} />
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
