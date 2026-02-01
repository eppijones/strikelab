import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GridPatternProps {
  className?: string
  size?: number
  strokeWidth?: number
  opacity?: number
  animate?: boolean
}

export function GridPattern({ 
  className, 
  size = 40, 
  strokeWidth = 1,
  opacity = 0.5,
  animate = false
}: GridPatternProps) {
  return (
    <div 
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      style={{
        backgroundImage: `
          linear-gradient(var(--grid-color) ${strokeWidth}px, transparent ${strokeWidth}px),
          linear-gradient(90deg, var(--grid-color) ${strokeWidth}px, transparent ${strokeWidth}px)
        `,
        backgroundSize: `${size}px ${size}px`,
        opacity,
      }}
    >
      {animate && (
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-accent-dim) ${strokeWidth}px, transparent ${strokeWidth}px),
              linear-gradient(90deg, var(--color-accent-dim) ${strokeWidth}px, transparent ${strokeWidth}px)
            `,
            backgroundSize: `${size}px ${size}px`,
          }}
          animate={{
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  )
}

// Perspective grid for hero sections
interface PerspectiveGridProps {
  className?: string
  opacity?: number
}

export function PerspectiveGrid({ className, opacity = 0.3 }: PerspectiveGridProps) {
  return (
    <div 
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      style={{ perspective: '500px', opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'rotateX(60deg) translateY(-50%)',
          transformOrigin: 'center top',
        }}
      />
    </div>
  )
}

// Radial grid (golf-inspired concentric circles)
interface RadialGridProps {
  className?: string
  rings?: number
  opacity?: number
}

export function RadialGrid({ className, rings = 4, opacity = 0.2 }: RadialGridProps) {
  const ringElements = Array.from({ length: rings }, (_, i) => {
    const size = (i + 1) * 25 // percentage
    return (
      <div
        key={i}
        className="absolute rounded-full border"
        style={{
          width: `${size}%`,
          height: `${size}%`,
          left: `${(100 - size) / 2}%`,
          top: `${(100 - size) / 2}%`,
          borderColor: 'var(--grid-color)',
          borderWidth: '1px',
        }}
      />
    )
  })

  return (
    <div 
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      style={{ opacity }}
    >
      {ringElements}
    </div>
  )
}
