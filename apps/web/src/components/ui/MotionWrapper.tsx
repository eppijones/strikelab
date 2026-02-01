import { motion, MotionProps, Variants, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Fade in on scroll/mount
export function FadeIn({ 
  children, 
  className,
  delay = 0,
  duration = 0.5,
  direction = 'up'
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}) {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {},
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Staggered children animation
export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.1,
  delayChildren = 0.1
}: { 
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  delayChildren?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { 
          opacity: 1, 
          y: 0,
          transition: { ease: [0.16, 1, 0.3, 1] }
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// Scale on hover
export function ScaleOnHover({ 
  children, 
  className,
  scale = 1.02
}: { 
  children: React.ReactNode
  className?: string
  scale?: number
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  )
}

// Glow pulse effect
export function GlowPulse({ 
  children, 
  className,
  color = 'var(--color-accent-glow)'
}: { 
  children: React.ReactNode
  className?: string
  color?: string
}) {
  return (
    <motion.div
      className={cn('relative', className)}
      animate={{
        boxShadow: [
          `0 0 20px ${color}`,
          `0 0 40px ${color}`,
          `0 0 20px ${color}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

// Number counter animation
export function AnimatedNumber({ 
  value, 
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  className
}: { 
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={value}
      >
        {prefix}
        <motion.span
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {value.toFixed(decimals)}
        </motion.span>
        {suffix}
      </motion.span>
    </motion.span>
  )
}

// Page transition wrapper
export function PageTransition({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Magnetic button effect
export function MagneticButton({
  children,
  className,
  strength = 0.3,
}: {
  children: React.ReactNode
  className?: string
  strength?: number
}) {
  return (
    <motion.div
      className={cn('relative', className)}
      whileHover="hover"
      initial="rest"
    >
      <motion.div
        variants={{
          rest: { x: 0, y: 0 },
          hover: { x: 0, y: 0 },
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// Floating element
export function FloatingElement({
  children,
  className,
  amplitude = 10,
  duration = 3,
}: {
  children: React.ReactNode
  className?: string
  amplitude?: number
  duration?: number
}) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

// Shimmer text effect
export function ShimmerText({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.span
      className={cn(
        'bg-gradient-to-r from-theme-accent via-violet-400 to-theme-accent bg-[length:200%_100%] bg-clip-text text-transparent',
        className
      )}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  )
}

// Reveal on scroll (intersection observer based)
export function RevealOnScroll({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
