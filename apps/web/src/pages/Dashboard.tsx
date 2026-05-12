import { useAuthStore } from '@/stores/authStore'
import HomeBeginner from '@/pages/home/HomeBeginner'
import HomeImprover from '@/pages/home/HomeImprover'
import HomePerformance from '@/pages/home/HomePerformance'

/**
 * Persona-aware Home dispatcher.
 *
 * The actual UX lives in `pages/home/HomeBeginner.tsx`,
 * `HomeImprover.tsx`, and `HomePerformance.tsx`. This file just picks
 * which one to render based on the user's persona. Defaults to the
 * Improver experience for accounts that finished onboarding before
 * personas existed.
 */
export default function Dashboard() {
  const persona = useAuthStore((s) => s.user?.persona)

  if (persona === 'beginner') return <HomeBeginner />
  if (persona === 'performance') return <HomePerformance />
  return <HomeImprover />
}
