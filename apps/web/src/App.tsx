import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Shell } from '@/components/layout/Shell'
import Dashboard from '@/pages/Dashboard'
import Sessions from '@/pages/Sessions'
import SessionDetail from '@/pages/SessionDetail'
import SessionLog from '@/pages/SessionLog'
import Connectors from '@/pages/Connectors'
import CoachReport from '@/pages/CoachReport'
import CoachChat from '@/pages/CoachChat'
import TrainingPlan from '@/pages/TrainingPlan'
import SwingLab from '@/pages/SwingLab'
import Calendar from '@/pages/Calendar'
import Friends from '@/pages/Friends'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Onboarding from '@/pages/Onboarding'
import MyBag from '@/pages/MyBag'
import Courses from '@/pages/Courses'
import Settings from '@/pages/Settings'
import Stats from '@/pages/Stats'
import Play from '@/pages/Play'
import PracticeHub from '@/pages/PracticeHub'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Redirect to onboarding if not completed (except for the onboarding route itself)
  if (user && !user.onboardingCompleted && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  
  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // If already completed onboarding, redirect to dashboard
  if (user?.onboardingCompleted) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function App() {
  const theme = useSettingsStore((state) => state.theme)
  
  // Initialize theme class on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)
  }, [theme])
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Onboarding route */}
        <Route path="/onboarding" element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="play" element={<Play />} />
          <Route path="practice" element={<PracticeHub />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="sessions/:id/log" element={<SessionLog />} />
          <Route path="my-bag" element={<MyBag />} />
          <Route path="courses" element={<Courses />} />
          <Route path="connectors" element={<Connectors />} />
          <Route path="coach" element={<CoachReport />} />
          <Route path="coach/chat" element={<CoachChat />} />
          <Route path="training" element={<TrainingPlan />} />
          <Route path="swing-lab" element={<SwingLab />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="friends" element={<Friends />} />
          <Route path="settings" element={<Settings />} />
          <Route path="stats" element={<Stats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
