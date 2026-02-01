import { Link } from 'react-router-dom'
import { CardGlass } from '@/components/ui/CardGlass'
import { SpotlightCard } from '@/components/ui/MotionPrimitives'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui'
import { useTeeTimes } from '@/api/courses'

export default function Play() {
  const { data: teeTimes } = useTeeTimes(true)
  const nextTeeTime = teeTimes?.[0]

  return (
    <div className="space-y-8 pb-20">
      <FadeIn>
        <h1 className="text-4xl font-bold text-nordic-forest dark:text-white mb-2">Play</h1>
        <p className="text-nordic-sage font-medium uppercase tracking-widest text-xs">The Course is Calling</p>
      </FadeIn>

      <StaggerContainer className="grid md:grid-cols-2 gap-6">
        {/* Next Round Card */}
        <StaggerItem className="md:col-span-2">
          <SpotlightCard className="bg-white/60 dark:bg-nordic-forest/40">
            <Link to="/calendar" className="block p-8 h-full">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-nordic-forest dark:text-white mb-1">
                    {nextTeeTime ? 'Next Round' : 'No Upcoming Rounds'}
                  </h2>
                  <p className="text-nordic-forest/60 dark:text-white/60">
                    {nextTeeTime 
                      ? `${new Date(nextTeeTime.tee_time).toLocaleDateString()} at ${nextTeeTime.course?.name}` 
                      : 'Time to book a tee time?'}
                  </p>
                </div>
                <div className="px-6 py-3 bg-nordic-forest text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity text-center">
                  {nextTeeTime ? 'View Calendar' : 'Book Now'}
                </div>
              </div>
            </Link>
          </SpotlightCard>
        </StaggerItem>

        {/* Find Course */}
        <StaggerItem>
          <SpotlightCard className="bg-white/60 dark:bg-nordic-forest/40 h-full">
            <Link to="/courses" className="block p-6 h-full group">
              <div className="w-12 h-12 rounded-xl bg-nordic-sage/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-nordic-forest dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-nordic-forest dark:text-white mb-2">Find a Course</h3>
              <p className="text-sm text-nordic-forest/60 dark:text-white/60">
                Explore thousands of courses, view scorecards, and check slope ratings.
              </p>
            </Link>
          </SpotlightCard>
        </StaggerItem>

        {/* Recent Rounds (Placeholder for future feature) */}
        <StaggerItem>
          <CardGlass className="h-full opacity-60" padding="md">
            <div className="p-2">
              <div className="w-12 h-12 rounded-xl bg-nordic-forest/5 dark:bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-nordic-forest/40 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-nordic-forest dark:text-white mb-2">Round History</h3>
              <p className="text-sm text-nordic-forest/60 dark:text-white/60">
                Track your scores and stats from past rounds.
              </p>
            </div>
          </CardGlass>
        </StaggerItem>
      </StaggerContainer>
    </div>
  )
}
