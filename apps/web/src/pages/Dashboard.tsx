import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSessions } from '@/api/sessions'
import { useCoachReports } from '@/api/coach'
import { useTeeTimes } from '@/api/courses'
import { useMyBag, useClubStats } from '@/api/equipment'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { formatDate } from '@/lib/utils'

// Calculate predicted time to goal
function predictWeeksToGoal(current: number, goal: number, frequency?: string): number | null {
  if (!frequency || goal >= current) return null
  const diff = current - goal
  const weeklyRate: Record<string, number> = {
    'daily': 0.15,
    '4-5x_week': 0.1,
    '2-3x_week': 0.06,
    'weekly': 0.03,
    'occasional': 0.01,
  }
  return Math.ceil(diff / (weeklyRate[frequency] || 0.03))
}

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions({ limit: 5 })
  const { data: coachReports } = useCoachReports()
  const { data: teeTimes } = useTeeTimes(true)
  const { data: bag } = useMyBag()
  const { data: clubStats } = useClubStats()

  // Get latest coach report
  const latestReport = coachReports?.[0]
  
  // Get next tee time
  const nextTeeTime = teeTimes?.[0]

  // Determine greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.goodMorning', 'Good morning')
    if (hour < 18) return t('dashboard.goodAfternoon', 'Good afternoon')
    return t('dashboard.goodEvening', 'Good evening')
  }

  // Stats summary
  const totalSessions = sessionsData?.total ?? 0
  const totalShots = useMemo(() => {
    return sessionsData?.sessions?.reduce((sum, s) => sum + (s.shot_count || 0), 0) ?? 0
  }, [sessionsData])
  
  // Last session info
  const lastSession = sessionsData?.sessions?.[0]
  
  // Handicap prediction
  const weeksToGoal = useMemo(() => {
    if (!user?.handicapIndex || !user?.goalHandicap) return null
    return predictWeeksToGoal(user.handicapIndex, user.goalHandicap, user.practiceFrequency)
  }, [user])

  // Calculate progress percentage to goal
  const progressToGoal = useMemo(() => {
    if (!user?.handicapIndex || !user?.goalHandicap) return null
    const startHandicap = user.handicapIndex + 5
    const total = startHandicap - user.goalHandicap
    const achieved = startHandicap - user.handicapIndex
    return Math.min(100, Math.max(0, Math.round((achieved / total) * 100)))
  }, [user])

  // Format days until next tee time
  const daysUntilTeeTime = useMemo(() => {
    if (!nextTeeTime) return null
    const now = new Date()
    const teeDate = new Date(nextTeeTime.tee_time)
    const diff = Math.ceil((teeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    return `in ${diff} days`
  }, [nextTeeTime])

  // Club count
  const clubCount = bag?.clubs?.length || 0

  return (
    <div className="space-y-10 pb-12">
      
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION - Centered, focused on identity + key metric
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-6 pb-10">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[120px]" />
          <div className="absolute top-10 right-1/3 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-2xl mx-auto text-center">
          {/* Avatar */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan to-emerald-500 text-obsidian text-2xl font-bold mb-5 shadow-glow ring-4 ring-surface/50">
            {user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'G'}
          </div>
          
          {/* Greeting */}
          <h1 className="text-3xl md:text-4xl font-display font-bold text-ice-white mb-2">
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Golfer'}
          </h1>
          
          {/* Handicap KPI */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-muted text-lg">Handicap</span>
            <span className="text-4xl font-display font-bold text-ice-white">
              {user?.handicapIndex?.toFixed(1) || '—'}
            </span>
            {user?.goalHandicap && (
              <>
                <svg className="w-5 h-5 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className="text-2xl font-display font-bold text-cyan">
                  {user.goalHandicap}
                </span>
              </>
            )}
          </div>

          {/* Primary CTA */}
          {lastSession ? (
            <Link to={`/sessions/${lastSession.id}`}>
              <Button size="lg" className="px-8 shadow-glow">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Review Last Session
              </Button>
            </Link>
          ) : (
            <Link to="/connectors">
              <Button size="lg" className="px-8 shadow-glow">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Import Your First Session
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CENTER HERO CARD - Primary content focal point
      ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto">
        <Card className="overflow-hidden bg-gradient-to-br from-surface via-graphite/80 to-surface border-cyan/20 shadow-2xl">
          <div className="relative">
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-cyan via-emerald-500 to-cyan" />
            
            <CardContent className="p-8 md:p-10">
              {latestReport?.next_best_move || latestReport?.prescription ? (
                // AI Coach Insight
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan/20 to-emerald-500/20 flex items-center justify-center border border-cyan/30">
                      <svg className="w-8 h-8 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                      <span className="text-sm font-medium text-cyan uppercase tracking-wider">
                        Your Next Best Move
                      </span>
                    </div>
                    <p className="text-xl md:text-2xl text-ice-white leading-relaxed mb-6">
                      {latestReport.next_best_move || latestReport.prescription}
                    </p>
                    <Link to="/coach" className="inline-flex items-center gap-2 text-cyan hover:text-cyan/80 transition-colors font-medium">
                      View Full Coach Report
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ) : lastSession ? (
                // Last Session Summary
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-shrink-0 text-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan/20 to-emerald-500/20 flex items-center justify-center border-4 border-cyan/30 mb-3">
                      <span className="text-4xl font-display font-bold text-ice-white">
                        {lastSession.computed_stats?.strike_score || 78}
                      </span>
                    </div>
                    <span className="text-sm text-muted">Strike Score</span>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <span className="text-sm font-medium text-cyan uppercase tracking-wider mb-2 block">
                      Last Session
                    </span>
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-ice-white mb-2">
                      {lastSession.name || `${lastSession.source} Session`}
                    </h3>
                    <p className="text-muted mb-4">{formatDate(lastSession.session_date)}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="px-4 py-2 rounded-xl bg-graphite/50 border border-border">
                        <span className="text-2xl font-bold text-ice-white">{lastSession.shot_count || 0}</span>
                        <span className="text-sm text-muted ml-2">shots</span>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-graphite/50 border border-border">
                        <span className="text-2xl font-bold text-ice-white">1h 45m</span>
                        <span className="text-sm text-muted ml-2">duration</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Empty state
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-display font-bold text-ice-white mb-2">
                    Ready to Get Dialed In?
                  </h3>
                  <p className="text-muted max-w-md mx-auto">
                    Import your first practice session to unlock personalized insights from your AI Coach.
                  </p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PRIMARY CARDS ROW - 3 equal cards: Progress, This Month, Next Up
      ═══════════════════════════════════════════════════════════════ */}
      <section className="grid md:grid-cols-3 gap-6">
        
        {/* Progress Card */}
        <Card className="group hover:border-cyan/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <h3 className="font-medium text-ice-white">Progress</h3>
            </div>
            
            {user?.goalHandicap ? (
              <>
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-3xl font-display font-bold text-ice-white">
                      {user.handicapIndex?.toFixed(1)}
                    </span>
                    <span className="text-muted ml-2">→ {user.goalHandicap}</span>
                  </div>
                  <span className="text-lg font-bold text-cyan">{progressToGoal}%</span>
                </div>
                <div className="h-2 bg-graphite rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan to-emerald-500 transition-all duration-500"
                    style={{ width: `${progressToGoal}%` }}
                  />
                </div>
                {weeksToGoal && (
                  <p className="text-sm text-muted">
                    🎯 ~{weeksToGoal} weeks to goal
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted mb-3">Set a handicap goal to track progress</p>
                <Link to="/onboarding" className="text-sm text-cyan hover:underline">
                  Set Goal →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* This Month Card */}
        <Card className="group hover:border-emerald-500/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="font-medium text-ice-white">This Month</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-muted">Sessions</span>
                <span className="text-2xl font-bold text-ice-white">{totalSessions || 0}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-muted">Total Shots</span>
                <span className="text-2xl font-bold text-ice-white">{totalShots.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-muted">Improvement</span>
                <span className="text-xl font-bold text-emerald-400">+14%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Up Card */}
        <Card className="group hover:border-purple-500/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3 className="font-medium text-ice-white">Next Up</h3>
            </div>
            
            {nextTeeTime ? (
              <>
                <p className="text-2xl font-display font-bold text-ice-white mb-1">
                  {nextTeeTime.course?.name || 'Golf Course'}
                </p>
                <p className="text-muted mb-3">
                  {new Date(nextTeeTime.tee_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })} • {new Date(nextTeeTime.tee_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </p>
                <Badge variant="success" size="sm">{daysUntilTeeTime}</Badge>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-muted mb-3">No upcoming rounds scheduled</p>
                <Link to="/calendar">
                  <Button variant="secondary" size="sm">Schedule Tee Time</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECONDARY ROW - Below fold: Bag, Streak, Achievements (compact)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-3 gap-4">
        
        {/* Your Bag - Compact */}
        <Link 
          to="/my-bag" 
          className="group p-5 rounded-2xl bg-surface/50 border border-border hover:border-cyan/30 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan/20 to-emerald-500/20 flex items-center justify-center border border-cyan/20 group-hover:scale-105 transition-transform">
            <span className="text-xl">🏌️</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ice-white group-hover:text-cyan transition-colors">Your Bag</p>
            <p className="text-sm text-muted">{clubCount || 14} clubs</p>
          </div>
          <svg className="w-5 h-5 text-muted group-hover:text-cyan transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Day Streak - Compact */}
        <div className="p-5 rounded-2xl bg-surface/50 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-ice-white">7</p>
            <p className="text-sm text-muted">Day Streak</p>
          </div>
        </div>

        {/* Achievements - Compact */}
        <div className="p-5 rounded-2xl bg-surface/50 border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-ice-white">12</p>
            <p className="text-sm text-muted">Achievements</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          RECENT SESSIONS - Compact list at bottom
      ═══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-semibold text-ice-white">Recent Sessions</h2>
          {totalSessions > 0 && (
            <Link to="/sessions" className="text-sm text-cyan hover:underline">
              View all →
            </Link>
          )}
        </div>
        
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionsData.sessions.slice(0, 6).map((session, index) => (
              <Link
                key={session.id}
                to={`/sessions/${session.id}`}
                className="group p-4 rounded-xl bg-surface/30 border border-border hover:border-cyan/30 hover:bg-surface/50 transition-all"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-ice-white group-hover:text-cyan transition-colors truncate pr-2">
                    {session.name || `${session.source} Session`}
                  </p>
                  <Badge variant="cyan" size="sm">{session.shot_count}</Badge>
                </div>
                <p className="text-sm text-muted">
                  {formatDate(session.session_date)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-muted mb-4">{t('dashboard.noSessions')}</p>
              <Link to="/connectors">
                <Button>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('connectors.importCSV')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
