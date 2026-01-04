import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSessions } from '@/api/sessions'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardHeader, CardTitle, CardContent, Badge, ScoreRing, Button } from '@/components/ui'
import { TrendChart } from '@/components/charts'
import { formatDate } from '@/lib/utils'

type TimeRange = '7d' | '30d' | '90d' | 'all'
type MetricType = 'strike' | 'face' | 'distance' | 'dispersion'

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
]

const METRICS: { key: MetricType; label: string; color: string; description: string }[] = [
  { key: 'strike', label: 'Strike Score', color: '#22D3EE', description: 'Ball contact quality' },
  { key: 'face', label: 'Face Control', color: '#10B981', description: 'Face-to-path consistency' },
  { key: 'distance', label: 'Distance Control', color: '#F59E0B', description: 'Carry variance' },
  { key: 'dispersion', label: 'Dispersion', color: '#8B5CF6', description: 'Shot pattern tightness' },
]

interface SessionStats {
  date: string
  strike_score: number
  face_control_score: number
  distance_control_score: number
  dispersion_score: number
  shot_count: number
}

export default function Stats() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('strike')
  
  // Fetch all sessions for stats
  const { data: sessionsData, isLoading } = useSessions({ limit: 100 })
  
  // Calculate date range
  const dateFilter = useMemo(() => {
    const now = new Date()
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      default:
        return null
    }
  }, [timeRange])
  
  // Process sessions into stats
  const stats = useMemo(() => {
    if (!sessionsData?.sessions) return []
    
    return sessionsData.sessions
      .filter(s => {
        if (!dateFilter) return true
        return new Date(s.session_date) >= dateFilter
      })
      .map(s => ({
        date: s.session_date,
        strike_score: s.computed_stats?.strike_score || 70,
        face_control_score: s.computed_stats?.face_control_score || 70,
        distance_control_score: s.computed_stats?.distance_control_score || 70,
        dispersion_score: s.computed_stats?.dispersion_score || 70,
        shot_count: s.shot_count || 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [sessionsData, dateFilter])
  
  // Calculate averages
  const averages = useMemo(() => {
    if (stats.length === 0) {
      return { strike: 0, face: 0, distance: 0, dispersion: 0, totalShots: 0, sessions: 0 }
    }
    
    const totalShots = stats.reduce((sum, s) => sum + s.shot_count, 0)
    
    return {
      strike: stats.reduce((sum, s) => sum + s.strike_score, 0) / stats.length,
      face: stats.reduce((sum, s) => sum + s.face_control_score, 0) / stats.length,
      distance: stats.reduce((sum, s) => sum + s.distance_control_score, 0) / stats.length,
      dispersion: stats.reduce((sum, s) => sum + s.dispersion_score, 0) / stats.length,
      totalShots,
      sessions: stats.length,
    }
  }, [stats])
  
  // Calculate trends (compare first half to second half)
  const trends = useMemo(() => {
    if (stats.length < 4) return { strike: 0, face: 0, distance: 0, dispersion: 0 }
    
    const mid = Math.floor(stats.length / 2)
    const firstHalf = stats.slice(0, mid)
    const secondHalf = stats.slice(mid)
    
    const calcTrend = (key: keyof SessionStats) => {
      const firstAvg = firstHalf.reduce((sum, s) => sum + (s[key] as number), 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, s) => sum + (s[key] as number), 0) / secondHalf.length
      return secondAvg - firstAvg
    }
    
    return {
      strike: calcTrend('strike_score'),
      face: calcTrend('face_control_score'),
      distance: calcTrend('distance_control_score'),
      dispersion: calcTrend('dispersion_score'),
    }
  }, [stats])
  
  // Get chart data for selected metric
  const chartData = useMemo(() => {
    return stats.map(s => ({
      name: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      strike: s.strike_score,
      face: s.face_control_score,
      distance: s.distance_control_score,
      dispersion: s.dispersion_score,
    }))
  }, [stats])
  
  // Find best/worst sessions
  const extremes = useMemo(() => {
    if (stats.length === 0) return { best: null, worst: null }
    
    const metricKey = {
      strike: 'strike_score',
      face: 'face_control_score',
      distance: 'distance_control_score',
      dispersion: 'dispersion_score',
    }[selectedMetric] as keyof SessionStats
    
    const sorted = [...stats].sort((a, b) => (b[metricKey] as number) - (a[metricKey] as number))
    
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
    }
  }, [stats, selectedMetric])

  const selectedMetricInfo = METRICS.find(m => m.key === selectedMetric)!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-ice-white">Performance Stats</h1>
          <p className="text-muted mt-1">Track your improvement over time</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-surface rounded-xl p-1">
          {TIME_RANGES.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range.value
                  ? 'bg-cyan text-obsidian'
                  : 'text-muted hover:text-ice-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map(metric => {
          const value = averages[metric.key as keyof typeof averages] as number
          const trend = trends[metric.key as keyof typeof trends]
          
          return (
            <Card
              key={metric.key}
              className={`cursor-pointer transition-all ${
                selectedMetric === metric.key
                  ? 'ring-2 ring-cyan shadow-glow'
                  : 'hover:border-cyan/30'
              }`}
              onClick={() => setSelectedMetric(metric.key)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-muted">{metric.label}</p>
                    <p className="text-3xl font-display font-bold text-ice-white">
                      {value.toFixed(0)}
                    </p>
                  </div>
                  <ScoreRing 
                    score={value} 
                    size="sm" 
                    color={metric.color}
                    showLabel={false}
                  />
                </div>
                
                {/* Trend Indicator */}
                {stats.length >= 4 && (
                  <div className={`flex items-center gap-1 text-sm ${
                    trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-muted'
                  }`}>
                    {trend > 0 ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    ) : trend < 0 ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    ) : null}
                    <span>{Math.abs(trend).toFixed(1)} pts</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedMetricInfo.color }}
                />
                {selectedMetricInfo.label} Trend
              </CardTitle>
              <p className="text-sm text-muted mt-1">{selectedMetricInfo.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Average</p>
              <p className="text-2xl font-display font-bold" style={{ color: selectedMetricInfo.color }}>
                {(averages[selectedMetric as keyof typeof averages] as number).toFixed(1)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-4">📊</span>
              <p className="text-ice-white font-medium">No data yet</p>
              <p className="text-sm text-muted">Import sessions to see your trends</p>
            </div>
          ) : (
            <TrendChart 
              data={chartData}
              lines={[{
                dataKey: selectedMetric,
                name: selectedMetricInfo.label,
                color: selectedMetricInfo.color,
              }]}
              height={256}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Practice Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Practice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted">Sessions</span>
              <span className="text-ice-white font-bold">{averages.sessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Total Shots</span>
              <span className="text-ice-white font-bold">{averages.totalShots.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Avg Shots/Session</span>
              <span className="text-ice-white font-bold">
                {averages.sessions > 0 ? Math.round(averages.totalShots / averages.sessions) : 0}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Best Session */}
        <Card className="border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-emerald-400">🏆</span>
              Best {selectedMetricInfo.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {extremes.best ? (
              <div>
                <p className="text-3xl font-display font-bold text-emerald-400">
                  {(extremes.best[{
                    strike: 'strike_score',
                    face: 'face_control_score',
                    distance: 'distance_control_score',
                    dispersion: 'dispersion_score',
                  }[selectedMetric] as keyof SessionStats] as number).toFixed(0)}
                </p>
                <p className="text-sm text-muted mt-1">
                  {new Date(extremes.best.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-muted">{extremes.best.shot_count} shots</p>
              </div>
            ) : (
              <p className="text-muted">No data</p>
            )}
          </CardContent>
        </Card>
        
        {/* Handicap Progress */}
        <Card className="border-cyan/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-cyan">📈</span>
              Handicap Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted">Current</p>
                <p className="text-2xl font-display font-bold text-ice-white">
                  {user?.handicapIndex || '—'}
                </p>
              </div>
              {user?.goalHandicap && (
                <>
                  <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-right">
                    <p className="text-sm text-cyan">Goal</p>
                    <p className="text-2xl font-display font-bold text-cyan">
                      {user.goalHandicap}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {user?.handicapIndex && user?.goalHandicap && (
              <div className="w-full bg-graphite rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan to-emerald-400 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, ((54 - user.handicapIndex) / (54 - user.goalHandicap)) * 100))}%` 
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Tips */}
      {stats.length > 0 && (
        <Card className="bg-gradient-to-r from-cyan/5 to-emerald-500/5 border-cyan/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-ice-white font-medium">Coach's Insight</p>
                <p className="text-sm text-muted mt-1">
                  {(() => {
                    const lowest = Object.entries({
                      strike: averages.strike,
                      face: averages.face,
                      distance: averages.distance,
                      dispersion: averages.dispersion,
                    }).sort(([,a], [,b]) => a - b)[0]
                    
                    const tips: Record<string, string> = {
                      strike: 'Your strike quality could use some work. Focus on center contact drills with alignment sticks.',
                      face: 'Face control is your focus area. Try the gate drill - set two tees just wider than your clubhead.',
                      distance: 'Distance control needs attention. Practice hitting to specific targets at 80% power.',
                      dispersion: 'Your dispersion pattern is wide. Work on consistent tempo and alignment.',
                    }
                    
                    return tips[lowest[0]]
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
