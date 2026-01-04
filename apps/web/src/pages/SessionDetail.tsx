import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSession, useSessionShots } from '@/api/sessions'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Toggle, ScoreRing } from '@/components/ui'
import { DispersionChart, TrendChart } from '@/components/charts'
import { formatDate, formatDistance } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const units = useSettingsStore((state) => state.units)
  const [excludeMishits, setExcludeMishits] = useState(true)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)

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
        <p className="text-muted">Session not found</p>
        <Link to="/sessions" className="text-cyan hover:underline mt-4 inline-block">
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

  // Calculate stats for filtered shots
  const avgCarry = filteredShots.length > 0
    ? filteredShots.reduce((sum, s) => sum + (s.carry_distance || 0), 0) / filteredShots.length
    : 0
  const avgSmash = filteredShots.filter(s => s.smash_factor).length > 0
    ? filteredShots.reduce((sum, s) => sum + (s.smash_factor || 0), 0) / filteredShots.filter(s => s.smash_factor).length
    : 0

  // Prepare dispersion data
  const dispersionData = filteredShots.map((s) => ({
    offlineDistance: s.offline_distance || 0,
    carryDistance: s.carry_distance || 0,
    club: s.club,
    isMishit: s.is_mishit,
  }))

  // Prepare trend data
  const trendData = filteredShots.slice(0, 20).map((s, i) => ({
    name: `#${s.shot_number}`,
    carry: s.carry_distance || 0,
    spin: (s.spin_rate || 0) / 100, // Scale for chart
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/sessions" className="text-muted hover:text-cyan text-sm mb-2 inline-block">
            ← {t('sessions.title')}
          </Link>
          <h1 className="text-2xl font-display font-bold text-ice-white">
            {session.name || `${session.source} Session`}
          </h1>
          <p className="text-muted mt-1">
            {formatDate(session.session_date)} • {session.shot_count} {t('sessions.shotCount')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={`/sessions/${id}/log`}>
            <Button variant="secondary">{t('sessionDetail.log')}</Button>
          </Link>
          <Link to={`/coach?session=${id}`}>
            <Button>{t('sessionDetail.coachReport')}</Button>
          </Link>
        </div>
      </div>

      {/* Scores */}
      {session.computed_stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card padding="md" className="text-center">
            <ScoreRing score={session.computed_stats.strike_score || 70} size="sm" />
            <p className="text-xs text-muted mt-2">{t('scores.strikeScore')}</p>
          </Card>
          <Card padding="md" className="text-center">
            <ScoreRing score={session.computed_stats.face_control_score || 70} size="sm" />
            <p className="text-xs text-muted mt-2">{t('scores.faceControl')}</p>
          </Card>
          <Card padding="md" className="text-center">
            <ScoreRing score={session.computed_stats.distance_control_score || 70} size="sm" />
            <p className="text-xs text-muted mt-2">{t('scores.distanceControl')}</p>
          </Card>
          <Card padding="md" className="text-center">
            <ScoreRing score={session.computed_stats.dispersion_score || 70} size="sm" />
            <p className="text-xs text-muted mt-2">{t('scores.dispersion')}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-6">
        <Toggle
          checked={excludeMishits}
          onChange={setExcludeMishits}
          label={t('sessionDetail.excludeMishits')}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedClub(null)}
            className={`px-3 py-1.5 text-sm rounded-button border transition-all ${
              !selectedClub
                ? 'bg-cyan text-obsidian border-cyan'
                : 'bg-surface border-border text-muted hover:text-ice-white'
            }`}
          >
            All Clubs
          </button>
          {clubs.map((club) => (
            <button
              key={club}
              onClick={() => setSelectedClub(club)}
              className={`px-3 py-1.5 text-sm rounded-button border transition-all ${
                selectedClub === club
                  ? 'bg-cyan text-obsidian border-cyan'
                  : 'bg-surface border-border text-muted hover:text-ice-white'
              }`}
            >
              {club}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Dispersion */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessionDetail.dispersion')}</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 flex justify-center">
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
                <div className="p-4 rounded-button bg-graphite">
                  <p className="text-2xl font-display font-bold text-cyan">
                    {formatDistance(avgCarry, units)}
                  </p>
                  <p className="text-xs text-muted">Avg Carry</p>
                </div>
                <div className="p-4 rounded-button bg-graphite">
                  <p className="text-2xl font-display font-bold text-ice-white">
                    {avgSmash.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted">Avg Smash</p>
                </div>
                <div className="p-4 rounded-button bg-graphite">
                  <p className="text-2xl font-display font-bold text-ice-white">
                    {filteredShots.length}
                  </p>
                  <p className="text-xs text-muted">Valid Shots</p>
                </div>
                <div className="p-4 rounded-button bg-graphite">
                  <p className="text-2xl font-display font-bold text-ice-white">
                    {clubs.length}
                  </p>
                  <p className="text-xs text-muted">Clubs Used</p>
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
                  { dataKey: 'carry', name: 'Carry', color: '#23D5FF' },
                  { dataKey: 'spin', name: 'Spin (÷100)', color: '#8A8A99' },
                ]}
                height={200}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shot Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sessionDetail.shots')}</CardTitle>
        </CardHeader>
        <CardContent className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="pb-3 text-xs text-muted font-medium">#</th>
                <th className="pb-3 text-xs text-muted font-medium">Club</th>
                <th className="pb-3 text-xs text-muted font-medium">Carry</th>
                <th className="pb-3 text-xs text-muted font-medium">Total</th>
                <th className="pb-3 text-xs text-muted font-medium">Smash</th>
                <th className="pb-3 text-xs text-muted font-medium">Spin</th>
                <th className="pb-3 text-xs text-muted font-medium">Offline</th>
                <th className="pb-3 text-xs text-muted font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredShots.map((shot) => (
                <tr key={shot.id} className="border-b border-border/50 hover:bg-surface/50">
                  <td className="py-3 text-sm text-muted">{shot.shot_number}</td>
                  <td className="py-3 text-sm text-ice-white">{shot.club}</td>
                  <td className="py-3 text-sm text-ice-white">
                    {shot.carry_distance ? formatDistance(shot.carry_distance, units) : '-'}
                  </td>
                  <td className="py-3 text-sm text-muted">
                    {shot.total_distance ? formatDistance(shot.total_distance, units) : '-'}
                  </td>
                  <td className="py-3 text-sm text-cyan">
                    {shot.smash_factor?.toFixed(2) || '-'}
                  </td>
                  <td className="py-3 text-sm text-muted">
                    {shot.spin_rate ? `${Math.round(shot.spin_rate)} rpm` : '-'}
                  </td>
                  <td className="py-3 text-sm text-muted">
                    {shot.offline_distance ? `${shot.offline_distance.toFixed(1)}m` : '-'}
                  </td>
                  <td className="py-3">
                    {shot.is_mishit ? (
                      <Badge variant="error" size="sm">{shot.mishit_type || 'Mishit'}</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Good</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
