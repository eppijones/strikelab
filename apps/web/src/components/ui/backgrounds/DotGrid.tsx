import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DotGridProps {
  className?: string
  dotSize?: number
  gap?: number
  opacity?: number
  animate?: boolean
}

export function DotGrid({ 
  className, 
  dotSize = 1, 
  gap = 20, 
  opacity = 0.4,
  animate = true 
}: DotGridProps) {
  return (
    <div 
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      style={{
        backgroundImage: `radial-gradient(circle, var(--dots-color) ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        opacity,
      }}
    >
      {animate && (
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-accent) ${dotSize}px, transparent ${dotSize}px)`,
            backgroundSize: `${gap}px ${gap}px`,
            opacity: 0.3,
          }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
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

// Interactive dot grid that responds to mouse
interface InteractiveDotGridProps extends DotGridProps {
  interactive?: boolean
}

export function InteractiveDotGrid({ 
  className,
  dotSize = 2,
  gap = 24,
  opacity = 0.5,
  interactive = false,
}: InteractiveDotGridProps) {
  if (!interactive) {
    return <DotGrid className={className} dotSize={dotSize} gap={gap} opacity={opacity} />
  }

  // For interactive version, we'd use canvas - keeping simple for now
  return (
    <div 
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
    >
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ opacity }}
      >
        <defs>
          <pattern 
            id="dotPattern" 
            x="0" 
            y="0" 
            width={gap} 
            height={gap} 
            patternUnits="userSpaceOnUse"
          >
            <circle 
              cx={gap / 2} 
              cy={gap / 2} 
              r={dotSize} 
              fill="var(--dots-color)" 
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotPattern)" />
      </svg>
    </div>
  )
}
