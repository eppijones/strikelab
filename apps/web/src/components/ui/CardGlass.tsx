import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardGlassProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
}

export const CardGlass = React.forwardRef<HTMLDivElement, CardGlassProps>(
  ({ children, className, padding = 'md', interactive = false, ...props }, ref) => {
    const paddingStyles = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          'bg-white/60 dark:bg-nordic-forest/40',
          'backdrop-blur-[16px] -webkit-backdrop-blur-[16px]',
          'border border-white/80 dark:border-white/20',
          'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_10px_15px_-3px_rgba(0,0,0,0.04)]',
          'rounded-[24px]',
          interactive && 'cursor-pointer hover:bg-white/70 dark:hover:bg-nordic-forest/50 transition-colors',
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {/* Subtle Inner Glow Ring */}
        <div className="absolute inset-0 rounded-[24px] pointer-events-none border border-white/20 z-0" />
        
        {/* Content Container to ensure text is above any background elements */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    )
  }
)

CardGlass.displayName = 'CardGlass'
