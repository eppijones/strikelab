import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'cyan'
  size?: 'sm' | 'md'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-surface border-border text-muted',
      success: 'bg-green-500/10 border-green-500/30 text-green-400',
      warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      error: 'bg-red-500/10 border-red-500/30 text-red-400',
      cyan: 'bg-cyan/10 border-cyan/30 text-cyan',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium border rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
