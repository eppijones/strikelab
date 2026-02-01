import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatDistance } from '@/lib/utils'

interface Shot {
  id: string
  shot_number: number
  club: string
  carry_distance?: number
  total_distance?: number
  smash_factor?: number
  ball_speed?: number
  spin_rate?: number
  launch_angle?: number
  offline_distance?: number
  is_mishit?: boolean
  mishit_type?: string
  timestamp?: string
}

interface SessionTimelineProps {
  shots: Shot[]
  selectedShot?: string | null
  onSelectShot?: (shotId: string) => void
  className?: string
}

export function SessionTimeline({ 
  shots, 
  selectedShot, 
  onSelectShot,
  className 
}: SessionTimelineProps) {
  const units = useSettingsStore((state) => state.units)

  const getQualityColor = (shot: Shot) => {
    if (shot.is_mishit) return 'bg-theme-error'
    if (shot.smash_factor && shot.smash_factor >= 1.48) return 'bg-theme-success'
    if (shot.smash_factor && shot.smash_factor >= 1.40) return 'bg-theme-accent'
    return 'bg-theme-warning'
  }

  const getQualityBg = (shot: Shot) => {
    if (shot.is_mishit) return 'from-theme-error/20 to-transparent border-theme-error/30'
    if (shot.smash_factor && shot.smash_factor >= 1.48) return 'from-theme-success/20 to-transparent border-theme-success/30'
    if (shot.smash_factor && shot.smash_factor >= 1.40) return 'from-cyan-500/20 to-transparent border-cyan-500/30'
    return 'from-theme-warning/20 to-transparent border-theme-warning/30'
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-theme-accent via-theme-border to-transparent" />

      {/* Shot cards */}
      <div className="space-y-3">
        {shots.map((shot, index) => (
          <motion.div
            key={shot.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            onClick={() => onSelectShot?.(shot.id)}
            className={cn(
              'relative pl-14 cursor-pointer group',
            )}
          >
            {/* Timeline dot */}
            <div className="absolute left-4 top-4 w-5 h-5 rounded-full bg-theme-bg-surface border-2 border-theme-border flex items-center justify-center z-10 group-hover:border-theme-accent transition-colors">
              <div className={cn('w-2 h-2 rounded-full transition-all', getQualityColor(shot), 
                selectedShot === shot.id && 'scale-125 shadow-glow-sm'
              )} />
            </div>

            {/* Shot card */}
            <motion.div
              whileHover={{ y: -2 }}
              className={cn(
                'p-4 rounded-xl border transition-all duration-200',
                selectedShot === shot.id
                  ? `bg-gradient-to-r ${getQualityBg(shot)} shadow-glow-sm`
                  : 'bg-theme-bg-surface/30 border-theme-border hover:border-theme-accent/30 hover:bg-theme-bg-surface/50'
              )}
            >
              <div className="flex items-start justify-between">
                {/* Left: Shot info */}
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-xs text-theme-text-muted">#{shot.shot_number}</span>
                  </div>
                  <div className="w-px h-8 bg-theme-border" />
                  <div>
                    <p className="font-semibold text-theme-text-primary">{shot.club}</p>
                    <p className="text-xs text-theme-text-muted">
                      {shot.carry_distance 
                        ? formatDistance(shot.carry_distance, units) 
                        : '—'
                      }
                      {shot.total_distance && (
                        <span className="text-theme-text-muted/50"> / {formatDistance(shot.total_distance, units)} total</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="flex items-center gap-4">
                  {shot.smash_factor && (
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-theme-accent">
                        {shot.smash_factor.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-theme-text-muted">Smash</p>
                    </div>
                  )}
                  {shot.ball_speed && (
                    <div className="text-right">
                      <p className="text-sm font-mono text-theme-text-primary">
                        {Math.round(shot.ball_speed)}
                      </p>
                      <p className="text-[10px] text-theme-text-muted">Ball mph</p>
                    </div>
                  )}
                  {shot.spin_rate && (
                    <div className="text-right">
                      <p className="text-sm font-mono text-theme-text-primary">
                        {Math.round(shot.spin_rate).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-theme-text-muted">Spin</p>
                    </div>
                  )}

                  {/* Status badge */}
                  {shot.is_mishit ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-theme-error/20 text-theme-error border border-theme-error/30">
                      {shot.mishit_type || 'Mishit'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-theme-success/20 text-theme-success border border-theme-success/30">
                      Good
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded details when selected */}
              {selectedShot === shot.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-theme-border grid grid-cols-4 gap-4"
                >
                  <div>
                    <p className="text-xs text-theme-text-muted mb-0.5">Launch Angle</p>
                    <p className="text-sm font-mono text-theme-text-primary">
                      {shot.launch_angle ? `${shot.launch_angle.toFixed(1)}°` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-theme-text-muted mb-0.5">Offline</p>
                    <p className="text-sm font-mono text-theme-text-primary">
                      {shot.offline_distance 
                        ? `${shot.offline_distance > 0 ? '+' : ''}${shot.offline_distance.toFixed(1)}m`
                        : '—'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-theme-text-muted mb-0.5">Carry</p>
                    <p className="text-sm font-mono text-theme-text-primary">
                      {shot.carry_distance ? formatDistance(shot.carry_distance, units) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-theme-text-muted mb-0.5">Total</p>
                    <p className="text-sm font-mono text-theme-text-primary">
                      {shot.total_distance ? formatDistance(shot.total_distance, units) : '—'}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* End marker */}
      <div className="relative pl-14 pt-4">
        <div className="absolute left-[19px] top-0 w-3 h-3 rounded-full bg-theme-bg-elevated border-2 border-theme-border" />
        <p className="text-xs text-theme-text-muted">
          {shots.length} shots tracked
        </p>
      </div>
    </div>
  )
}

// Compact horizontal timeline for overview
export function ShotStrip({ 
  shots, 
  maxShots = 30,
  className 
}: { 
  shots: Shot[]
  maxShots?: number
  className?: string 
}) {
  const displayShots = shots.slice(0, maxShots)

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {displayShots.map((shot, i) => (
        <motion.div
          key={shot.id}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.02 }}
          className={cn(
            'w-1.5 rounded-full transition-all',
            shot.is_mishit 
              ? 'bg-theme-error h-3' 
              : shot.smash_factor && shot.smash_factor >= 1.45 
                ? 'bg-theme-success h-5'
                : 'bg-theme-accent h-4'
          )}
          title={`#${shot.shot_number} - ${shot.club}`}
        />
      ))}
      {shots.length > maxShots && (
        <span className="text-[10px] text-theme-text-muted ml-1">
          +{shots.length - maxShots}
        </span>
      )}
    </div>
  )
}
