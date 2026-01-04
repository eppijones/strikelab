import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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

// Demo club data
const DEMO_CLUBS = [
  { label: 'Driver', shortLabel: 'D', score: 76, distance: 268, type: 'driver' },
  { label: '3-Wood', shortLabel: '3W', score: 81, distance: 238, type: 'wood' },
  { label: '5-Wood', shortLabel: '5W', score: 79, distance: 218, type: 'wood' },
  { label: '4-Iron', shortLabel: '4i', score: 85, distance: 195, type: 'iron' },
  { label: '5-Iron', shortLabel: '5i', score: 87, distance: 182, type: 'iron' },
  { label: '6-Iron', shortLabel: '6i', score: 88, distance: 170, type: 'iron' },
  { label: '7-Iron', shortLabel: '7i', score: 89, distance: 162, type: 'iron' },
  { label: '8-Iron', shortLabel: '8i', score: 91, distance: 150, type: 'iron' },
  { label: '9-Iron', shortLabel: '9i', score: 90, distance: 138, type: 'iron' },
  { label: 'PW', shortLabel: 'PW', score: 88, distance: 125, type: 'wedge' },
  { label: 'GW', shortLabel: 'GW', score: 86, distance: 110, type: 'wedge' },
  { label: 'SW', shortLabel: 'SW', score: 84, distance: 95, type: 'wedge' },
  { label: 'LW', shortLabel: 'LW', score: 82, distance: 85, type: 'wedge' },
  { label: 'Putter', shortLabel: 'P', score: 78, distance: null, type: 'putter' },
]

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 88) return 'text-emerald-400'
  if (score >= 80) return 'text-cyan'
  if (score >= 70) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 88) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30'
  if (score >= 80) return 'from-cyan/20 to-cyan/5 border-cyan/30'
  if (score >= 70) return 'from-amber-500/20 to-amber-500/5 border-amber-500/30'
  return 'from-red-500/20 to-red-500/5 border-red-500/30'
}

export default function Dashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions({ limit: 5 })
  const { data: coachReports } = useCoachReports()
  const { data: teeTimes } = useTeeTimes(true)
  const { data: bag } = useMyBag()
  const { data: clubStats } = useClubStats()

  // Selected club for focus view
  const [selectedClubIndex, setSelectedClubIndex] = useState(0)

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
    return `${diff} days`
  }, [nextTeeTime])

  // Build club data from stats or use demo
  const clubData = useMemo(() => {
    if (clubStats && clubStats.length > 0) {
      return clubStats.map(s => ({
        label: s.club_label,
        shortLabel: s.club_label.replace('-', '').replace('Iron', 'i').replace('Wood', 'W'),
        score: s.good_shots && s.total_shots ? Math.round((s.good_shots / s.total_shots) * 100) : 80,
        distance: s.avg_carry ? Math.round(s.avg_carry) : null,
        type: s.club_label.toLowerCase().includes('driver') ? 'driver' : 
              s.club_label.toLowerCase().includes('wood') ? 'wood' :
              s.club_label.toLowerCase().includes('iron') ? 'iron' :
              s.club_label.toLowerCase().includes('w') ? 'wedge' : 'putter',
        totalShots: s.total_shots,
        smashFactor: s.avg_smash_factor,
        dispersion: s.dispersion_radius,
      }))
    }
    return DEMO_CLUBS
  }, [clubStats])

  const selectedClub = clubData[selectedClubIndex] || clubData[0]
  const hasData = totalSessions > 0

  return (
    <div className="space-y-12 pb-16">
      
      {/* ═══════════════════════════════════════════════════════════════
          HERO HEADER - Identity + Handicap Journey
      ═══════════════════════════════════════════════════════════════ */}
      <header className="relative pt-6 pb-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Profile + Greeting */}
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan to-emerald-500 flex items-center justify-center text-obsidian font-bold shadow-glow ring-2 ring-white/10">
              {user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'G'}
            </div>
            <div className="text-left">
              <h1 className="text-xl font-display font-bold text-ice-white">
                {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Golfer'}
              </h1>
              <p className="text-sm text-muted">Let's get dialed in</p>
            </div>
          </div>
          
          {/* Handicap Journey */}
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-surface/60 border border-white/[0.06] backdrop-blur-sm">
            <div className="text-center">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Current</p>
              <p className="text-3xl font-display font-bold text-ice-white">
                {user?.handicapIndex?.toFixed(1) || '8.5'}
              </p>
            </div>
            
            {user?.goalHandicap && (
              <>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-0.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan to-emerald-400"
                      style={{ width: `${progressToGoal || 60}%` }}
                    />
                  </div>
                  <svg className="w-4 h-4 text-cyan/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                
                <div className="text-center">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Goal</p>
                  <p className="text-3xl font-display font-bold text-cyan">
                    {user.goalHandicap}
                  </p>
                </div>
              </>
            )}
            
            {/* Primary CTA */}
            {lastSession && (
              <div className="pl-4 border-l border-white/10">
                <Link to={`/sessions/${lastSession.id}`}>
                  <Button size="sm" className="shadow-glow-sm">
                    Review Session
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          YOUR BAG - Central Hero Element
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative">
        {/* Spotlight gradient behind the card */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div 
            className="w-[700px] h-[500px] rounded-full opacity-40"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(35, 213, 255, 0.12) 0%, rgba(45, 212, 191, 0.06) 40%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden bg-gradient-to-b from-surface/90 to-graphite/60 border-white/[0.08] shadow-2xl backdrop-blur-sm">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-emerald-500/20 flex items-center justify-center border border-cyan/20">
                  <span className="text-lg">🏌️</span>
                </div>
                <div>
                  <h2 className="font-display font-semibold text-ice-white">Your Bag</h2>
                  <p className="text-xs text-muted">{clubData.length} clubs • {bag?.ball_model || 'Pro V1x'}</p>
                </div>
              </div>
              <Link to="/my-bag" className="text-sm text-cyan hover:text-cyan/80 transition-colors flex items-center gap-1">
                Manage
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Club Strip - Scrollable */}
            <div className="px-4 py-5 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max px-2">
                {clubData.map((club, index) => {
                  const isSelected = index === selectedClubIndex
                  return (
                    <button
                      key={club.label}
                      onClick={() => setSelectedClubIndex(index)}
                      className={`
                        relative flex flex-col items-center px-3 py-3 rounded-xl transition-all duration-200
                        ${isSelected 
                          ? `bg-gradient-to-b ${getScoreBg(club.score)} border shadow-lg scale-105` 
                          : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'
                        }
                      `}
                    >
                      {/* Club Label */}
                      <span className={`text-xs font-semibold mb-1 ${isSelected ? 'text-ice-white' : 'text-muted'}`}>
                        {club.shortLabel}
                      </span>
                      
                      {/* Score */}
                      <span className={`text-lg font-bold ${getScoreColor(club.score)}`}>
                        {club.score}
                      </span>
                      
                      {/* Distance */}
                      {club.distance && (
                        <span className={`text-[10px] ${isSelected ? 'text-white/60' : 'text-muted/60'}`}>
                          {club.distance}y
                        </span>
                      )}
                      
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Focused Club Summary */}
            <div className="px-6 pb-6">
              <div className={`
                p-5 rounded-2xl bg-gradient-to-br ${getScoreBg(selectedClub.score)}
                border backdrop-blur-sm
              `}>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Club Identity */}
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center
                      bg-gradient-to-br from-white/10 to-white/5 border border-white/10
                    `}>
                      <span className={`text-3xl font-display font-bold ${getScoreColor(selectedClub.score)}`}>
                        {selectedClub.score}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-ice-white">
                        {selectedClub.label}
                      </h3>
                      <p className="text-sm text-muted">
                        {selectedClub.distance ? `${selectedClub.distance} yards avg carry` : 'Putting club'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex-1 flex items-center gap-6 md:justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-ice-white">
                        {(selectedClub as any).totalShots || '147'}
                      </p>
                      <p className="text-xs text-muted">Total Shots</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-ice-white">
                        {(selectedClub as any).smashFactor?.toFixed(2) || '1.48'}
                      </p>
                      <p className="text-xs text-muted">Smash Factor</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-ice-white">
                        {(selectedClub as any).dispersion ? `${Math.round((selectedClub as any).dispersion)}ft` : '12ft'}
                      </p>
                      <p className="text-xs text-muted">Dispersion</p>
                    </div>
                  </div>
                  
                  {/* CTA */}
                  <div className="flex gap-2">
                    <Link to="/sessions">
                      <Button variant="secondary" size="sm">
                        Review Stats
                      </Button>
                    </Link>
                    <Link to="/training">
                      <Button size="sm" className="shadow-glow-sm">
                        Practice This Club
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* No data hint - only shown when needed */}
            {!hasData && (
              <div className="px-6 pb-6 pt-0">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan/5 border border-cyan/10">
                  <svg className="w-5 h-5 text-cyan flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <p className="text-sm text-muted">
                    <span className="text-cyan font-medium">Demo data shown.</span>
                    {' '}
                    <Link to="/connectors" className="text-cyan hover:underline">
                      Import a session
                    </Link>
                    {' '}to see your real club performance.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          NEXT ACTION - Coach tip or Next Round
      ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          {/* AI Coach Tip */}
          {(latestReport?.next_best_move || latestReport?.prescription) && (
            <Link 
              to="/coach"
              className="group p-5 rounded-2xl bg-surface/40 border border-white/[0.04] hover:border-cyan/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                    <span className="text-xs font-medium text-cyan uppercase tracking-wider">Next Best Move</span>
                  </div>
                  <p className="text-sm text-ice-white leading-relaxed line-clamp-2 group-hover:text-cyan transition-colors">
                    {latestReport.next_best_move || latestReport.prescription}
                  </p>
                </div>
                <svg className="w-5 h-5 text-muted group-hover:text-cyan transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {/* Next Round */}
          {nextTeeTime ? (
            <Link 
              to="/calendar"
              className="group p-5 rounded-2xl bg-surface/40 border border-white/[0.04] hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-0.5">Next Round</p>
                  <p className="text-sm font-medium text-ice-white truncate group-hover:text-emerald-400 transition-colors">
                    {nextTeeTime.course?.name || 'Golf Course'}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(nextTeeTime.tee_time).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })} • {new Date(nextTeeTime.tee_time).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })}
                  </p>
                </div>
                <Badge variant="success" size="sm">{daysUntilTeeTime}</Badge>
              </div>
            </Link>
          ) : !latestReport?.next_best_move && (
            <Link 
              to="/calendar"
              className="group p-5 rounded-2xl bg-surface/40 border border-white/[0.04] border-dashed hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center">
                  <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted group-hover:text-ice-white transition-colors">
                    Schedule your next round
                  </p>
                </div>
                <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROGRESS STATS - Reduced visual weight
      ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* This Month Sessions */}
          <div className="p-4 rounded-xl bg-surface/30 border border-white/[0.03]">
            <p className="text-xs text-muted mb-1">Sessions</p>
            <p className="text-2xl font-display font-bold text-ice-white">{totalSessions || 0}</p>
            <p className="text-[10px] text-muted">this month</p>
          </div>

          {/* Total Shots */}
          <div className="p-4 rounded-xl bg-surface/30 border border-white/[0.03]">
            <p className="text-xs text-muted mb-1">Total Shots</p>
            <p className="text-2xl font-display font-bold text-ice-white">{totalShots.toLocaleString() || '0'}</p>
            <p className="text-[10px] text-muted">tracked</p>
          </div>

          {/* Day Streak */}
          <div className="p-4 rounded-xl bg-surface/30 border border-white/[0.03]">
            <p className="text-xs text-muted mb-1">Streak</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-display font-bold text-amber-400">7</p>
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-[10px] text-muted">days</p>
          </div>

          {/* Goal Progress */}
          <div className="p-4 rounded-xl bg-surface/30 border border-white/[0.03]">
            <p className="text-xs text-muted mb-1">Goal Progress</p>
            <p className="text-2xl font-display font-bold text-cyan">{progressToGoal || 60}%</p>
            <p className="text-[10px] text-muted">{weeksToGoal ? `~${weeksToGoal} weeks` : 'to target'}</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          RECENT SESSIONS - Compact
      ═══════════════════════════════════════════════════════════════ */}
      {totalSessions > 0 && (
        <section className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Recent Sessions</h2>
            <Link to="/sessions" className="text-xs text-cyan hover:underline">
              View all →
            </Link>
          </div>
          
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessionsData?.sessions?.slice(0, 3).map((session) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="group p-4 rounded-xl bg-surface/30 border border-white/[0.03] hover:border-cyan/20 hover:bg-surface/40 transition-all"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-ice-white group-hover:text-cyan transition-colors truncate pr-2">
                      {session.name || `${session.source} Session`}
                    </p>
                    <Badge variant="cyan" size="sm">{session.shot_count}</Badge>
                  </div>
                  <p className="text-xs text-muted">{formatDate(session.session_date)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
