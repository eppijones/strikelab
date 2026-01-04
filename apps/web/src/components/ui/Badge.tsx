import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'cyan'
  size?: 'sm' | 'md'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-theme-bg-surface border-theme-border text-theme-text-muted',
      success: 'bg-theme-success-dim border-theme-success/30 text-theme-success',
      warning: 'bg-theme-warning-dim border-theme-warning/30 text-theme-warning',
      error: 'bg-theme-error-dim border-theme-error/30 text-theme-error',
      cyan: 'bg-theme-accent-dim border-theme-accent/30 text-theme-accent',
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
