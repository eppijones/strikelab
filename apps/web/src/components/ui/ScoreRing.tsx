import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  label?: string
  className?: string
  animated?: boolean
}

const sizeConfig = {
  xs: { ring: 40, stroke: 3, text: 'text-xs', label: 'text-[8px]' },
  sm: { ring: 56, stroke: 4, text: 'text-sm', label: 'text-[10px]' },
  md: { ring: 80, stroke: 5, text: 'text-xl', label: 'text-xs' },
  lg: { ring: 100, stroke: 6, text: 'text-2xl', label: 'text-sm' },
  xl: { ring: 140, stroke: 8, text: 'text-4xl', label: 'text-base' },
}

function getScoreColor(score: number): { stroke: string; glow: string; text: string } {
  if (score >= 88) return { 
    stroke: 'stroke-theme-success', 
    glow: 'var(--color-success)',
    text: 'text-theme-success' 
  }
  if (score >= 80) return { 
    stroke: 'stroke-cyan-400', 
    glow: 'var(--color-accent)',
    text: 'text-cyan-400' 
  }
  if (score >= 70) return { 
    stroke: 'stroke-theme-warning', 
    glow: 'var(--color-warning)',
    text: 'text-theme-warning' 
  }
  return { 
    stroke: 'stroke-theme-error', 
    glow: 'var(--color-error)',
    text: 'text-theme-error' 
  }
}

export function ScoreRing({ 
  score, 
  size = 'md', 
  showLabel = false,
  label,
  className,
  animated = true
}: ScoreRingProps) {
  const config = sizeConfig[size]
  const radius = (config.ring - config.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, score)) / 100
  const offset = circumference * (1 - progress)
  const colors = getScoreColor(score)

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <div 
        className="relative"
        style={{ width: config.ring, height: config.ring }}
      >
        {/* Background ring */}
        <svg 
          className="absolute inset-0 -rotate-90"
          width={config.ring} 
          height={config.ring}
        >
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            strokeWidth={config.stroke}
            className="stroke-theme-border"
          />
        </svg>
        
        {/* Progress ring */}
        <svg 
          className="absolute inset-0 -rotate-90"
          width={config.ring} 
          height={config.ring}
          style={{
            filter: `drop-shadow(0 0 ${config.stroke * 2}px ${colors.glow})`,
          }}
        >
          <defs>
            <linearGradient id={`score-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-violet)" />
            </linearGradient>
          </defs>
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            className={colors.stroke}
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>

        {/* Score value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className={cn('font-display font-bold', config.text, colors.text)}
            initial={animated ? { opacity: 0, scale: 0.8 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>

      {/* Label */}
      {(showLabel || label) && (
        <motion.span 
          className={cn('mt-1 text-theme-text-muted font-medium', config.label)}
          initial={animated ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {label || 'Score'}
        </motion.span>
      )}
    </div>
  )
}

// Mini score badge (no ring)
export function ScoreBadge({ 
  score, 
  label,
  size = 'sm',
  className 
}: { 
  score: number
  label?: string
  size?: 'xs' | 'sm' | 'md'
  className?: string 
}) {
  const colors = getScoreColor(score)
  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-sm px-2.5 py-1',
    md: 'text-base px-3 py-1.5',
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'font-display font-bold rounded-lg bg-theme-bg-surface border border-theme-border',
          sizes[size],
          colors.text
        )}
        style={{
          boxShadow: `0 0 12px ${colors.glow}40`,
        }}
      >
        {Math.round(score)}
      </motion.span>
      {label && (
        <span className="text-xs text-theme-text-muted">{label}</span>
      )}
    </div>
  )
}

// Score comparison (before/after)
export function ScoreComparison({
  before,
  after,
  label,
  className,
}: {
  before: number
  after: number
  label?: string
  className?: string
}) {
  const diff = after - before
  const isImprovement = diff > 0

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <ScoreRing score={before} size="sm" label="Before" showLabel />
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className={cn(
            'w-12 h-px',
            isImprovement ? 'bg-theme-success' : 'bg-theme-error'
          )}
        />
        <span className={cn(
          'text-xs font-mono font-bold',
          isImprovement ? 'text-theme-success' : 'text-theme-error'
        )}>
          {isImprovement ? '+' : ''}{diff.toFixed(0)}
        </span>
      </div>
      <ScoreRing score={after} size="sm" label="After" showLabel />
    </div>
  )
}
