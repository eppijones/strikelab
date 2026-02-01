import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuroraGlowProps {
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
  position?: 'top' | 'center' | 'bottom'
  color?: 'sage' | 'champagne' | 'mixed'
}

export function AuroraGlow({ 
  className, 
  intensity = 'subtle',
  position = 'top',
  color = 'sage'
}: AuroraGlowProps) {
  const opacityMap = {
    subtle: 0.5,
    medium: 0.7,
    strong: 0.9,
  }

  const positionMap = {
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
  }

  // More vibrant sage green colors
  const colorMap = {
    sage: {
      primary: 'rgba(76, 140, 97, 0.25)',
      secondary: 'rgba(107, 163, 125, 0.18)',
    },
    champagne: {
      primary: 'rgba(212, 165, 116, 0.2)',
      secondary: 'rgba(212, 165, 116, 0.12)',
    },
    mixed: {
      primary: 'rgba(76, 140, 97, 0.2)',
      secondary: 'rgba(212, 165, 116, 0.12)',
    },
  }

  const colors = colorMap[color]

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Primary glow - sage green */}
      <motion.div
        className={cn('absolute w-[900px] h-[700px] rounded-full', positionMap[position])}
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary} 0%, transparent 60%)`,
          filter: 'blur(80px)',
          opacity: opacityMap[intensity],
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [opacityMap[intensity] * 0.85, opacityMap[intensity], opacityMap[intensity] * 0.85],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Secondary glow (offset) */}
      <motion.div
        className={cn(
          'absolute w-[600px] h-[500px] rounded-full',
          position === 'top' ? 'top-0 right-1/4 -translate-y-1/3' :
          position === 'bottom' ? 'bottom-0 left-1/4 translate-y-1/3' :
          'top-1/2 right-1/4 -translate-y-1/2'
        )}
        style={{
          background: `radial-gradient(ellipse at center, ${colors.secondary} 0%, transparent 60%)`,
          filter: 'blur(100px)',
          opacity: opacityMap[intensity] * 0.8,
        }}
        animate={{
          scale: [1.05, 1, 1.05],
          opacity: [opacityMap[intensity] * 0.6, opacityMap[intensity] * 0.8, opacityMap[intensity] * 0.6],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
    </div>
  )
}

// Simpler spotlight variant - more visible green
interface SpotlightProps {
  className?: string
  size?: number
  color?: string
}

export function Spotlight({ 
  className, 
  size = 600,
  color = '#4C8C61'  // Sage green hex
}: SpotlightProps) {
  return (
    <motion.div
      className={cn('absolute pointer-events-none', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(ellipse at center, 
          ${color}20 0%, 
          ${color}10 40%, 
          transparent 70%
        )`,
        filter: 'blur(50px)',
      }}
      animate={{
        scale: [1, 1.06, 1],
        opacity: [0.7, 0.9, 0.7],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}
