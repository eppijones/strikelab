import { Link } from 'react-router-dom'
import { SpotlightCard } from '@/components/ui/MotionPrimitives'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui'

export default function PracticeHub() {
  return (
    <div className="space-y-8 pb-20">
      <FadeIn>
        <h1 className="text-4xl font-bold text-nordic-forest dark:text-white mb-2">Practice</h1>
        <p className="text-nordic-sage font-medium uppercase tracking-widest text-xs">Build Your Game</p>
      </FadeIn>

      <StaggerContainer className="grid gap-6">
        {/* Active Session */}
        <StaggerItem>
          <SpotlightCard className="bg-white/60 dark:bg-nordic-forest/40">
            <Link to="/sessions" className="block p-8 h-full">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-nordic-forest dark:text-white mb-1">
                    Session Log
                  </h2>
                  <p className="text-nordic-forest/60 dark:text-white/60">
                    Review past range sessions and analyze your ball striking data.
                  </p>
                </div>
                <div className="px-6 py-3 border border-nordic-forest/20 text-nordic-forest dark:border-white/20 dark:text-white rounded-xl font-medium text-sm hover:bg-nordic-forest/5 dark:hover:bg-white/5 transition-colors text-center">
                  View History
                </div>
              </div>
            </Link>
          </SpotlightCard>
        </StaggerItem>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Training Plans */}
          <StaggerItem>
            <SpotlightCard className="bg-white/60 dark:bg-nordic-forest/40 h-full">
              <Link to="/training" className="block p-6 h-full group">
                <div className="w-12 h-12 rounded-xl bg-nordic-sage/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-nordic-forest dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-nordic-forest dark:text-white mb-2">Training Plans</h3>
                <p className="text-sm text-nordic-forest/60 dark:text-white/60">
                  Structured drill blocks and pressure tests designed to lower your handicap.
                </p>
              </Link>
            </SpotlightCard>
          </StaggerItem>

          {/* Swing Lab */}
          <StaggerItem>
            <SpotlightCard className="bg-white/60 dark:bg-nordic-forest/40 h-full">
              <Link to="/swing-lab" className="block p-6 h-full group">
                <div className="w-12 h-12 rounded-xl bg-nordic-sage/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-nordic-forest dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-nordic-forest dark:text-white mb-2">Swing Lab</h3>
                <p className="text-sm text-nordic-forest/60 dark:text-white/60">
                  Experimental features and detailed swing mechanics analysis.
                </p>
              </Link>
            </SpotlightCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </div>
  )
}
