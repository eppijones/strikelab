import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  maxScore?: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
  className?: string
}

export function ScoreRing({
  score,
  maxScore = 100,
  size = 'md',
  label,
  showValue = true,
  className,
}: ScoreRingProps) {
  const percentage = Math.min(100, (score / maxScore) * 100)
  
  const sizes = {
    sm: { ring: 60, stroke: 4, text: 'text-lg', label: 'text-xs' },
    md: { ring: 80, stroke: 6, text: 'text-2xl', label: 'text-sm' },
    lg: { ring: 120, stroke: 8, text: 'text-4xl', label: 'text-base' },
  }

  const { ring, stroke, text, label: labelSize } = sizes[size]
  const radius = (ring - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 90) return { stroke: 'var(--color-success)', glow: 'var(--color-success-dim)' }
    if (score >= 75) return { stroke: 'var(--color-accent)', glow: 'var(--color-accent-glow)' }
    if (score >= 60) return { stroke: 'var(--color-warning)', glow: 'var(--color-warning-dim)' }
    return { stroke: 'var(--color-error)', glow: 'var(--color-error-dim)' }
  }

  const color = getColor(score)

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg
          width={ring}
          height={ring}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke="var(--color-border)"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke={color.stroke}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 8px ${color.glow})`,
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-display font-bold text-theme-text-primary', text)}>
              {Math.round(score)}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className={cn('mt-2 text-theme-text-muted', labelSize)}>{label}</span>
      )}
    </div>
  )
}
