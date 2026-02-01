import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, useSessionShots } from '@/api/sessions'
import { 
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Toggle, 
  ScoreRing, FadeIn, StaggerContainer, StaggerItem, NeuralIcon, StatusPulse, Spotlight
} from '@/components/ui'
import { DispersionChart, TrendChart, SessionTimeline, ShotStrip } from '@/components/charts'
import { formatDate, formatDistance } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'

type ViewMode = 'overview' | 'timeline' | 'table'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const units = useSettingsStore((state) => state.units)
  const [excludeMishits, setExcludeMishits] = useState(true)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [selectedShot, setSelectedShot] = useState<string | null>(null)

  const { data: session, isLoading: sessionLoading } = useSession(id!)
  const { data: shots, isLoading: shotsLoading } = useSessionShots(id!)

  if (sessionLoading || shotsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 shimmer rounded-button w-64" />
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="h-96 shimmer" />
          <Card className="h-96 shimmer" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <NeuralIcon size="lg" variant="default" className="mx-auto mb-4" />
        <p className="text-theme-text-muted text-lg">Session not found</p>
        <Link to="/sessions" className="text-theme-accent hover:underline mt-4 inline-block">
          Back to sessions
        </Link>
      </div>
    )
  }

  // Filter shots
  const filteredShots = shots?.filter((shot) => {
    if (excludeMishits && shot.is_mishit) return false
    if (selectedClub && shot.club !== selectedClub) return false
    return true
  }) || []

  // Get unique clubs
  const clubs = [...new Set(shots?.map((s) => s.club) || [])]

  // Calculate stats
  const avgCarry = filteredShots.length > 0
    ? filteredShots.reduce((sum, s) => sum + (s.carry_distance || 0), 0) / filteredShots.length
    : 0
  const avgSmash = filteredShots.filter(s => s.smash_factor).length > 0
    ? filteredShots.reduce((sum, s) => sum + (s.smash_factor || 0), 0) / filteredShots.filter(s => s.smash_factor).length
    : 0

  // Dispersion data
  const dispersionData = filteredShots.map((s) => ({
    offlineDistance: s.offline_distance || 0,
    carryDistance: s.carry_distance || 0,
    club: s.club,
    isMishit: s.is_mishit,
  }))

  // Trend data
  const trendData = filteredShots.slice(0, 20).map((s) => ({
    name: `#${s.shot_number}`,
    carry: s.carry_distance || 0,
    spin: (s.spin_rate || 0) / 100,
  }))

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="relative">
          <Spotlight className="left-0 top-0 -translate-y-1/2" size={400} />
          
          <div className="relative">
            <Link 
              to="/sessions" 
              className="inline-flex items-center gap-1 text-sm text-theme-text-muted hover:text-theme-accent mb-4 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('sessions.title')}
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-theme-text-primary mb-2">
                  {session.name || `${session.source} Session`}
                </h1>
                <div className="flex items-center gap-3 text-theme-text-muted">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    {formatDate(session.session_date)}
                  </span>
                  <span>•</span>
                  <Badge variant="cyan">{session.shot_count} shots</Badge>
                  <Badge>{session.source}</Badge>
                </div>
                
                {/* Shot quality strip */}
                {shots && shots.length > 0 && (
                  <div className="mt-4">
                    <ShotStrip shots={shots} />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Link to={`/sessions/${id}/log`}>
                  <Button variant="secondary">{t('sessionDetail.log')}</Button>
                </Link>
                <Link to={`/coach?session=${id}`}>
                  <Button variant="gradient" leftIcon={
                    <NeuralIcon size="xs" variant="processing" animate={false} />
                  }>
                    {t('sessionDetail.coachReport')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Score Cards */}
      {session.computed_stats && (
        <FadeIn delay={0.1}>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" staggerDelay={0.05}>
            <StaggerItem>
              <Card padding="md" className="text-center bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
                <ScoreRing score={session.computed_stats.strike_score || 70} size="md" />
                <p className="text-xs text-theme-text-muted mt-3 font-medium">{t('scores.strikeScore')}</p>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card padding="md" className="text-center">
                <ScoreRing score={session.computed_stats.face_control_score || 70} size="md" />
                <p className="text-xs text-theme-text-muted mt-3 font-medium">{t('scores.faceControl')}</p>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card padding="md" className="text-center">
                <ScoreRing score={session.computed_stats.distance_control_score || 70} size="md" />
                <p className="text-xs text-theme-text-muted mt-3 font-medium">{t('scores.distanceControl')}</p>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card padding="md" className="text-center">
                <ScoreRing score={session.computed_stats.dispersion_score || 70} size="md" />
                <p className="text-xs text-theme-text-muted mt-3 font-medium">{t('scores.dispersion')}</p>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </FadeIn>
      )}

      {/* View Mode Toggle & Filters */}
      <FadeIn delay={0.2}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View Mode */}
          <div className="inline-flex rounded-xl border border-theme-border bg-theme-bg-surface/50 p-1">
            {(['overview', 'timeline', 'table'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  viewMode === mode
                    ? 'bg-theme-accent text-theme-text-inverted shadow-glow-sm'
                    : 'text-theme-text-muted hover:text-theme-text-primary'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Toggle
              checked={excludeMishits}
              onChange={setExcludeMishits}
              label={t('sessionDetail.excludeMishits')}
            />
            
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedClub(null)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all whitespace-nowrap ${
                  !selectedClub
                    ? 'bg-theme-accent text-theme-text-inverted border-theme-accent shadow-glow-sm'
                    : 'bg-theme-bg-surface border-theme-border text-theme-text-muted hover:text-theme-text-primary hover:border-theme-accent/30'
                }`}
              >
                All Clubs
              </button>
              {clubs.slice(0, 6).map((club) => (
                <button
                  key={club}
                  onClick={() => setSelectedClub(club)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all whitespace-nowrap ${
                    selectedClub === club
                      ? 'bg-theme-accent text-theme-text-inverted border-theme-accent shadow-glow-sm'
                      : 'bg-theme-bg-surface border-theme-border text-theme-text-muted hover:text-theme-text-primary hover:border-theme-accent/30'
                  }`}
                >
                  {club}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Content based on view mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Dispersion Chart */}
            <Card variant="neural" padding="none">
              <div className="p-4 border-b border-theme-border">
                <CardTitle>{t('sessionDetail.dispersion')}</CardTitle>
              </div>
              <CardContent className="p-4 flex justify-center">
                <DispersionChart shots={dispersionData} height={400} />
              </CardContent>
            </Card>

            {/* Stats + Trends */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('sessionDetail.overview')}</CardTitle>
                </CardHeader>
                <CardContent className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-theme-accent/10 to-transparent border border-theme-accent/20">
                      <p className="text-2xl font-display font-bold text-theme-accent">
                        {formatDistance(avgCarry, units)}
                      </p>
                      <p className="text-xs text-theme-text-muted mt-1">Avg Carry</p>
                    </div>
                    <div className="p-4 rounded-xl bg-theme-bg-elevated border border-theme-border">
                      <p className="text-2xl font-display font-bold text-theme-text-primary font-mono">
                        {avgSmash.toFixed(2)}
                      </p>
                      <p className="text-xs text-theme-text-muted mt-1">Avg Smash</p>
                    </div>
                    <div className="p-4 rounded-xl bg-theme-bg-elevated border border-theme-border">
                      <p className="text-2xl font-display font-bold text-theme-text-primary">
                        {filteredShots.length}
                      </p>
                      <p className="text-xs text-theme-text-muted mt-1">Valid Shots</p>
                    </div>
                    <div className="p-4 rounded-xl bg-theme-bg-elevated border border-theme-border">
                      <p className="text-2xl font-display font-bold text-theme-text-primary">
                        {clubs.length}
                      </p>
                      <p className="text-xs text-theme-text-muted mt-1">Clubs Used</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('sessionDetail.trends')}</CardTitle>
                </CardHeader>
                <CardContent className="mt-4">
                  <TrendChart
                    data={trendData}
                    lines={[
                      { dataKey: 'carry', name: 'Carry', color: '#00d4ff' },
                      { dataKey: 'spin', name: 'Spin (÷100)', color: '#8b5cf6' },
                    ]}
                    height={200}
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {viewMode === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card variant="neural" padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-theme-accent-dim flex items-center justify-center">
                  <svg className="w-4 h-4 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-theme-text-primary">Session Replay</h3>
                  <p className="text-xs text-theme-text-muted">{filteredShots.length} shots in sequence</p>
                </div>
              </div>
              
              <SessionTimeline 
                shots={filteredShots}
                selectedShot={selectedShot}
                onSelectShot={setSelectedShot}
              />
            </Card>
          </motion.div>
        )}

        {viewMode === 'table' && (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('sessionDetail.shots')}</CardTitle>
              </CardHeader>
              <CardContent className="mt-4 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-theme-border">
                      <th className="pb-3 text-xs text-theme-text-muted font-medium">#</th>
                      <th className="pb-3 text-xs text-theme-text-muted font-medium">Club</th>
                      <th className="pb-3 text-xs text-theme-text-muted font-medium">Carry</th>
                      <th className="pb-3 text-xs text-theme-text-muted font-medium">Total</th>
                      <th className="pb-3 text-xs text-theme-text-muted font-medium">Smash</th>
                      <th className="pb-3 text-xs text-theme-text-muted font-medium">Spin</th>
                      <th className="pb-3 text-xs text-theme-text-muted font-medium">Offline</th>
                      <th className="pb-3 text-xs text-theme-text-muted font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShots.map((shot) => (
                      <motion.tr 
                        key={shot.id} 
                        className="border-b border-theme-border/50 hover:bg-theme-bg-surface/50 transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <td className="py-3 text-sm text-theme-text-muted font-mono">{shot.shot_number}</td>
                        <td className="py-3 text-sm text-theme-text-primary font-medium">{shot.club}</td>
                        <td className="py-3 text-sm text-theme-accent font-mono">
                          {shot.carry_distance ? formatDistance(shot.carry_distance, units) : '-'}
                        </td>
                        <td className="py-3 text-sm text-theme-text-muted font-mono">
                          {shot.total_distance ? formatDistance(shot.total_distance, units) : '-'}
                        </td>
                        <td className="py-3 text-sm text-theme-accent font-mono font-bold">
                          {shot.smash_factor?.toFixed(2) || '-'}
                        </td>
                        <td className="py-3 text-sm text-theme-text-muted font-mono">
                          {shot.spin_rate ? `${Math.round(shot.spin_rate).toLocaleString()}` : '-'}
                        </td>
                        <td className="py-3 text-sm text-theme-text-muted font-mono">
                          {shot.offline_distance ? `${shot.offline_distance.toFixed(1)}m` : '-'}
                        </td>
                        <td className="py-3">
                          {shot.is_mishit ? (
                            <Badge variant="error" size="sm">{shot.mishit_type || 'Mishit'}</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Good</Badge>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
