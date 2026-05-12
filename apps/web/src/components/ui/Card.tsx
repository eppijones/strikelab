import { HTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Card kept API-compatible with the previous design but re-styled to match
 * the new "Panel" aesthetic — flat, hairline border, square (radius 2px).
 * For the canonical Panel-with-header use the Panel component instead.
 */

const baseCard =
  'bg-surface-solid border border-line-strong rounded-panel relative'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass' | 'glass-strong' | 'accent' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants: Record<NonNullable<CardProps['variant']>, string> = {
      default: baseCard,
      elevated: cn(baseCard, 'shadow-glow'),
      interactive: cn(baseCard, 'transition-all duration-launch hover:border-ink-3 cursor-pointer'),
      glass: cn(baseCard, 'bg-bg-2'),
      'glass-strong': cn(baseCard, 'shadow-glow'),
      accent: cn(baseCard, 'border-accent-fg text-ink'),
      outline: 'bg-transparent border border-line-strong rounded-panel',
    }
    const paddings: Record<NonNullable<CardProps['padding']>, string> = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    }
    return (
      <div ref={ref} className={cn(variants[variant], paddings[padding], className)} {...props}>
        {children}
      </div>
    )
  },
)
Card.displayName = 'Card'

interface MotionCardProps extends HTMLMotionProps<'div'> {
  variant?: CardProps['variant']
  padding?: CardProps['padding']
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const paddings: Record<NonNullable<CardProps['padding']>, string> = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    }
    return (
      <motion.div
        ref={ref}
        className={cn(baseCard, paddings[padding], className)}
        whileHover={{ y: -1, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } }}
        {...props}
      >
        {children}
      </motion.div>
    )
  },
)
MotionCard.displayName = 'MotionCard'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-3 border-b border-line-strong', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Tag = 'h3', ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn('display text-head text-ink', className)}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-body text-ink-2', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('pt-3', className)} {...props} />,
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-3 border-t border-line-strong', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

interface MetricCardProps {
  label: string
  value: string | number
  trend?: { value: number; direction: 'up' | 'down' }
  icon?: React.ReactNode
  variant?: 'default' | 'accent' | 'success' | 'warning'
  className?: string
}

export function MetricCard({ label, value, trend, icon, variant = 'default', className }: MetricCardProps) {
  const valueColor =
    variant === 'accent' || variant === 'success'
      ? 'text-accent-fg'
      : variant === 'warning'
      ? 'text-warn'
      : 'text-ink'
  return (
    <div className={cn(baseCard, 'p-4', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="micro">{label}</p>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className={cn('num text-display-m font-medium tracking-display', valueColor)}>{value}</p>
        {trend && (
          <span
            className={cn(
              'mono text-[11px]',
              trend.direction === 'up' ? 'text-accent-fg' : 'text-bad',
            )}
          >
            {trend.direction === 'up' ? '+' : '−'}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function FeatureCard({ icon, title, description, action, className }: FeatureCardProps) {
  return (
    <motion.div
      className={cn(baseCard, 'p-5 group transition-all duration-launch hover:border-accent-fg', className)}
      whileHover={{ y: -1 }}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-panel bg-bg-2 border border-line-strong flex items-center justify-center text-ink-2 group-hover:text-accent-fg group-hover:border-accent-fg">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="display text-head text-ink group-hover:text-accent-fg transition-colors">{title}</h3>
          <p className="text-body text-ink-2 mt-1 line-clamp-2">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </motion.div>
  )
}
