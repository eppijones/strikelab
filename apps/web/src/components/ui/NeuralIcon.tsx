import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NeuralIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'active' | 'processing' | 'success'
  className?: string
  animate?: boolean
}

const sizeMap = {
  xs: { container: 24, core: 4, rings: [8, 12, 16], nodes: 3 },
  sm: { container: 32, core: 5, rings: [10, 16, 22], nodes: 4 },
  md: { container: 48, core: 8, rings: [16, 24, 34], nodes: 5 },
  lg: { container: 64, core: 10, rings: [20, 32, 44], nodes: 6 },
  xl: { container: 96, core: 14, rings: [28, 46, 66], nodes: 8 },
}

export function NeuralIcon({ 
  size = 'md', 
  variant = 'default',
  className,
  animate = true 
}: NeuralIconProps) {
  const config = sizeMap[size]
  const center = config.container / 2

  const colors = {
    default: { core: '#00d4ff', ring: 'rgba(0, 212, 255, 0.3)', node: '#00d4ff' },
    active: { core: '#00d4ff', ring: 'rgba(0, 212, 255, 0.4)', node: '#8b5cf6' },
    processing: { core: '#8b5cf6', ring: 'rgba(139, 92, 246, 0.3)', node: '#00d4ff' },
    success: { core: '#22c55e', ring: 'rgba(34, 197, 94, 0.3)', node: '#00d4ff' },
  }

  const currentColors = colors[variant]

  return (
    <div 
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: config.container, height: config.container }}
    >
      {/* Orbital Rings */}
      {config.rings.map((ringSize, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: ringSize,
            height: ringSize,
            borderColor: currentColors.ring,
            borderWidth: i === 0 ? 1.5 : 1,
          }}
          initial={false}
          animate={animate ? {
            scale: [1, 1.05, 1],
            opacity: [0.3 + i * 0.1, 0.5 + i * 0.1, 0.3 + i * 0.1],
          } : {}}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Orbiting Nodes */}
      {Array.from({ length: config.nodes }).map((_, i) => {
        const angle = (360 / config.nodes) * i
        const orbitRadius = config.rings[1] / 2
        const nodeSize = size === 'xs' ? 2 : size === 'sm' ? 3 : 4
        
        return (
          <motion.div
            key={`node-${i}`}
            className="absolute rounded-full"
            initial={false}
            animate={animate ? {
              rotate: [angle, angle + 360],
            } : { rotate: angle }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              width: nodeSize,
              height: nodeSize,
              backgroundColor: i % 2 === 0 ? currentColors.node : currentColors.core,
              boxShadow: `0 0 ${nodeSize * 2}px ${currentColors.node}`,
              transformOrigin: `${nodeSize / 2}px ${orbitRadius}px`,
              left: center - nodeSize / 2,
              top: center - orbitRadius - nodeSize / 2,
            }}
          />
        )
      })}

      {/* Core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.core,
          height: config.core,
          backgroundColor: currentColors.core,
          boxShadow: `0 0 ${config.core * 2}px ${currentColors.core}`,
        }}
        animate={animate ? {
          scale: [1, 1.2, 1],
          boxShadow: [
            `0 0 ${config.core * 1.5}px ${currentColors.core}`,
            `0 0 ${config.core * 3}px ${currentColors.core}`,
            `0 0 ${config.core * 1.5}px ${currentColors.core}`,
          ],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

// Simplified version for sidebar/nav
export function NeuralIconSimple({ 
  size = 20, 
  className,
  active = false 
}: { 
  size?: number
  className?: string
  active?: boolean 
}) {
  const center = size / 2
  const coreSize = size * 0.15
  const rings = [size * 0.4, size * 0.65, size * 0.9]

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {/* Rings */}
      {rings.map((r, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={r / 2}
          fill="none"
          stroke={active ? 'var(--color-accent)' : 'var(--color-text-muted)'}
          strokeWidth={i === 0 ? 1.5 : 1}
          opacity={0.3 + i * 0.1}
        />
      ))}
      
      {/* Nodes */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const nodeRadius = rings[1] / 2
        const x = center + Math.cos(rad) * nodeRadius
        const y = center + Math.sin(rad) * nodeRadius
        return (
          <circle
            key={`node-${i}`}
            cx={x}
            cy={y}
            r={coreSize / 2}
            fill={i % 2 === 0 ? 'var(--color-accent)' : 'var(--color-violet)'}
          />
        )
      })}
      
      {/* Core */}
      <circle
        cx={center}
        cy={center}
        r={coreSize}
        fill={active ? 'var(--color-accent)' : 'var(--color-text-muted)'}
        style={{
          filter: active ? 'drop-shadow(0 0 4px var(--color-accent))' : 'none',
        }}
      />
    </svg>
  )
}

// Logo Icon with gradient
export function StrikeLabIcon({ 
  size = 32, 
  className,
  animated = false 
}: { 
  size?: number
  className?: string
  animated?: boolean 
}) {
  const center = size / 2
  
  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      initial={false}
      animate={animated ? { rotate: 360 } : {}}
      transition={animated ? { duration: 60, repeat: Infinity, ease: 'linear' } : {}}
    >
      <defs>
        <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background */}
      <rect
        x="2"
        y="2"
        width={size - 4}
        height={size - 4}
        rx="8"
        fill="var(--color-bg-surface)"
        stroke="var(--color-border)"
      />
      
      {/* Outer ring */}
      <circle
        cx={center}
        cy={center}
        r={size * 0.35}
        fill="none"
        stroke="url(#neural-gradient)"
        strokeWidth="1"
        opacity="0.5"
      />
      
      {/* Inner ring */}
      <circle
        cx={center}
        cy={center}
        r={size * 0.22}
        fill="none"
        stroke="url(#neural-gradient)"
        strokeWidth="1"
        opacity="0.3"
      />
      
      {/* Orbiting nodes */}
      {[45, 135, 225, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const r = size * 0.28
        return (
          <circle
            key={i}
            cx={center + Math.cos(rad) * r}
            cy={center + Math.sin(rad) * r}
            r="2"
            fill={i % 2 === 0 ? '#00d4ff' : '#8b5cf6'}
          />
        )
      })}
      
      {/* Core */}
      <circle
        cx={center}
        cy={center}
        r={size * 0.1}
        fill="#00d4ff"
        filter="url(#glow)"
      />
    </motion.svg>
  )
}
