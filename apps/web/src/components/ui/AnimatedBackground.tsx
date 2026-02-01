import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedBackgroundProps {
  variant?: 'neural' | 'gradient' | 'orbital' | 'particles'
  className?: string
  children?: React.ReactNode
}

export function AnimatedBackground({ 
  variant = 'neural', 
  className, 
  children 
}: AnimatedBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {variant === 'neural' && <NeuralBackground />}
      {variant === 'gradient' && <GradientBackground />}
      {variant === 'orbital' && <OrbitalBackground />}
      {variant === 'particles' && <ParticlesBackground />}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function NeuralBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)',
          top: '-20%',
          right: '-10%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          bottom: '-15%',
          left: '-5%',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}

function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(0, 212, 255, 0.1) 0%, 
              transparent 30%,
              transparent 70%,
              rgba(139, 92, 246, 0.1) 100%
            )
          `,
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}

function OrbitalBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      {/* Central glow */}
      <div 
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)',
        }}
      />
      
      {/* Orbital rings */}
      {[200, 300, 400].map((size, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: size,
            height: size,
            borderColor: 'rgba(0, 212, 255, 0.1)',
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.02, 1],
          }}
          transition={{
            rotate: { duration: 30 + i * 10, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}
    </div>
  )
}

function ParticlesBackground() {
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.id % 2 === 0 ? 'var(--color-accent)' : 'var(--color-violet)',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Spotlight effect for hero sections
export function Spotlight({ 
  className,
  size = 600 
}: { 
  className?: string
  size?: number 
}) {
  return (
    <motion.div
      className={cn('absolute pointer-events-none', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(ellipse at center, 
          rgba(0, 212, 255, 0.15) 0%, 
          rgba(139, 92, 246, 0.08) 40%, 
          transparent 70%
        )`,
        filter: 'blur(40px)',
      }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Glow line divider
export function GlowDivider({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-px w-full', className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-border to-transparent" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-accent to-transparent opacity-50"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

// Status indicator with pulse
export function StatusPulse({ 
  status = 'active',
  size = 'sm' 
}: { 
  status?: 'active' | 'processing' | 'idle' | 'success' | 'error'
  size?: 'xs' | 'sm' | 'md'
}) {
  const colors = {
    active: 'bg-theme-accent',
    processing: 'bg-violet-500',
    idle: 'bg-theme-text-muted',
    success: 'bg-theme-success',
    error: 'bg-theme-error',
  }

  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  }

  return (
    <span className="relative flex items-center justify-center">
      <span className={cn('rounded-full', sizes[size], colors[status])} />
      {(status === 'active' || status === 'processing') && (
        <motion.span
          className={cn('absolute rounded-full', sizes[size], colors[status])}
          animate={{
            scale: [1, 2],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </span>
  )
}
