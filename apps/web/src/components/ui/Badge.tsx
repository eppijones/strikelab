import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'outline' | 'muted' | 'glass'
  size?: 'xs' | 'sm' | 'md'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', children, ...props }, ref) => {
    const variants = {
      default: 'bg-black/5 dark:bg-white/10 text-theme-text-secondary border-transparent',
      accent: 'bg-sage-500/12 dark:bg-sage-400/20 text-sage-600 dark:text-sage-400 border-sage-500/20 dark:border-sage-400/25',
      success: 'bg-sage-500/12 dark:bg-sage-400/20 text-sage-600 dark:text-sage-400 border-sage-500/20 dark:border-sage-400/25',
      warning: 'bg-champagne/15 dark:bg-champagne/20 text-amber-700 dark:text-champagne border-champagne/25',
      error: 'bg-rose-500/12 dark:bg-rose-400/20 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-400/25',
      outline: 'bg-transparent text-theme-text-secondary border-theme-border hover:border-sage-500/30 dark:hover:border-sage-400/30',
      muted: 'bg-black/3 dark:bg-white/5 text-theme-text-muted border-transparent',
      glass: 'bg-white/50 dark:bg-white/10 backdrop-blur-[8px] text-theme-text-secondary border-white/50 dark:border-white/10',
    }

    const sizes = {
      xs: 'text-[10px] px-1.5 py-0.5',
      sm: 'text-xs px-2.5 py-0.5',
      md: 'text-sm px-3 py-1',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full border transition-colors',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Badge with dot indicator
interface StatusBadgeProps extends BadgeProps {
  status?: 'active' | 'inactive' | 'pending' | 'success' | 'error'
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status = 'active', children, className, ...props }, ref) => {
    const statusColors = {
      active: 'bg-sage-500 dark:bg-sage-400',
      inactive: 'bg-gray-400 dark:bg-gray-500',
      pending: 'bg-amber-500 dark:bg-amber-400',
      success: 'bg-sage-500 dark:bg-sage-400',
      error: 'bg-rose-500 dark:bg-rose-400',
    }

    const statusVariants = {
      active: 'accent',
      inactive: 'muted',
      pending: 'warning',
      success: 'success',
      error: 'error',
    } as const

    return (
      <Badge 
        ref={ref} 
        variant={statusVariants[status]} 
        className={cn('gap-1.5', className)} 
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', statusColors[status])} />
        {children}
      </Badge>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

// Counter badge (notifications, counts)
export function CountBadge({ 
  count, 
  max = 99,
  variant = 'accent',
  className 
}: { 
  count: number
  max?: number
  variant?: 'accent' | 'error'
  className?: string 
}) {
  const displayCount = count > max ? `${max}+` : count.toString()
  
  if (count === 0) return null

  const variantStyles = {
    accent: 'bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-sm shadow-sage-500/25',
    error: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/25',
  }
  
  return (
    <span 
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full',
        variantStyles[variant],
        className
      )}
    >
      {displayCount}
    </span>
  )
}

// Tag Badge - for categories, filters
interface TagBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void
  removable?: boolean
}

export const TagBadge = forwardRef<HTMLSpanElement, TagBadgeProps>(
  ({ className, children, onRemove, removable = false, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-xl',
          'bg-white/60 dark:bg-white/10 backdrop-blur-[8px]',
          'text-theme-text-secondary border border-black/8 dark:border-white/10',
          'transition-colors hover:border-sage-500/30 dark:hover:border-sage-400/30',
          'hover:text-sage-600 dark:hover:text-sage-400',
          className
        )}
        {...props}
      >
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-0.5 text-theme-text-muted hover:text-rose-500 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    )
  }
)

TagBadge.displayName = 'TagBadge'
