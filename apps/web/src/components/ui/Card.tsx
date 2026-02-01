import { HTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass' | 'glass-strong' | 'accent' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: [
        'bg-white/70 dark:bg-[#2A2928]/70',
        'backdrop-blur-[20px]',
        'border border-white/50 dark:border-white/10',
        'shadow-glass',
      ].join(' '),
      elevated: [
        'bg-white/80 dark:bg-[#2A2928]/80',
        'backdrop-blur-[24px]',
        'border border-white/60 dark:border-white/10',
        'shadow-elevated',
      ].join(' '),
      interactive: [
        'bg-white/65 dark:bg-[#2A2928]/65',
        'backdrop-blur-[20px]',
        'border border-white/50 dark:border-white/10',
        'shadow-glass',
        'hover:bg-white/80 dark:hover:bg-[#2A2928]/80',
        'hover:shadow-elevated',
        'hover:border-sage-500/20 dark:hover:border-sage-400/20',
        'transition-all duration-200',
        'cursor-pointer',
      ].join(' '),
      glass: [
        'bg-white/50 dark:bg-[#2A2928]/50',
        'backdrop-blur-[16px]',
        'border border-white/40 dark:border-white/8',
        'shadow-soft-md',
      ].join(' '),
      'glass-strong': [
        'bg-white/85 dark:bg-[#2A2928]/85',
        'backdrop-blur-[30px]',
        'border border-white/70 dark:border-white/12',
        'shadow-glass',
      ].join(' '),
      accent: [
        'bg-gradient-to-br from-sage-500/10 via-sage-500/5 to-transparent',
        'dark:from-sage-400/15 dark:via-sage-400/5 dark:to-transparent',
        'backdrop-blur-[16px]',
        'border border-sage-500/20 dark:border-sage-400/25',
        'shadow-soft-md',
        'shadow-glow-sage/30',
      ].join(' '),
      outline: 'bg-transparent border border-theme-border',
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-card',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Animated Card with motion
interface MotionCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass' | 'glass-strong' | 'accent'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: [
        'bg-white/70 dark:bg-[#2A2928]/70',
        'backdrop-blur-[20px]',
        'border border-white/50 dark:border-white/10',
        'shadow-glass',
      ].join(' '),
      elevated: [
        'bg-white/80 dark:bg-[#2A2928]/80',
        'backdrop-blur-[24px]',
        'border border-white/60 dark:border-white/10',
        'shadow-elevated',
      ].join(' '),
      interactive: [
        'bg-white/65 dark:bg-[#2A2928]/65',
        'backdrop-blur-[20px]',
        'border border-white/50 dark:border-white/10',
        'shadow-glass',
      ].join(' '),
      glass: [
        'bg-white/50 dark:bg-[#2A2928]/50',
        'backdrop-blur-[16px]',
        'border border-white/40 dark:border-white/8',
        'shadow-soft-md',
      ].join(' '),
      'glass-strong': [
        'bg-white/85 dark:bg-[#2A2928]/85',
        'backdrop-blur-[30px]',
        'border border-white/70 dark:border-white/12',
        'shadow-glass',
      ].join(' '),
      accent: [
        'bg-gradient-to-br from-sage-500/10 via-sage-500/5 to-transparent',
        'dark:from-sage-400/15 dark:via-sage-400/5 dark:to-transparent',
        'backdrop-blur-[16px]',
        'border border-sage-500/20 dark:border-sage-400/25',
        'shadow-soft-md',
      ].join(' '),
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-card',
          variants[variant],
          paddings[padding],
          className
        )}
        whileHover={{ 
          y: -2,
          transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } 
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

MotionCard.displayName = 'MotionCard'

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Tag = 'h3', ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-theme-text-primary',
        className
      )}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-theme-text-muted', className)} {...props} />
))

CardDescription.displayName = 'CardDescription'

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

// Metric Card for Dashboard - Premium Glass Style
interface MetricCardProps {
  label: string
  value: string | number
  trend?: { value: number; direction: 'up' | 'down' }
  icon?: React.ReactNode
  variant?: 'default' | 'accent' | 'success' | 'warning'
  className?: string
}

export function MetricCard({ 
  label, 
  value, 
  trend, 
  icon,
  variant = 'default',
  className 
}: MetricCardProps) {
  const variantStyles = {
    default: [
      'bg-white/70 dark:bg-[#2A2928]/70',
      'border-white/50 dark:border-white/10',
    ].join(' '),
    accent: [
      'bg-gradient-to-br from-sage-500/12 via-sage-500/6 to-white/60',
      'dark:from-sage-400/20 dark:via-sage-400/10 dark:to-[#2A2928]/60',
      'border-sage-500/25 dark:border-sage-400/25',
    ].join(' '),
    success: [
      'bg-gradient-to-br from-sage-500/12 to-white/60',
      'dark:from-sage-400/20 dark:to-[#2A2928]/60',
      'border-sage-500/20 dark:border-sage-400/20',
    ].join(' '),
    warning: [
      'bg-gradient-to-br from-champagne/15 to-white/60',
      'dark:from-champagne/20 dark:to-[#2A2928]/60',
      'border-champagne/25 dark:border-champagne/25',
    ].join(' '),
  }

  const valueColors = {
    default: 'text-theme-text-primary',
    accent: 'text-sage-600 dark:text-sage-400',
    success: 'text-sage-600 dark:text-sage-400',
    warning: 'text-champagne-dark dark:text-champagne',
  }

  const iconColors = {
    default: 'text-sage-500/60 dark:text-sage-400/60',
    accent: 'text-sage-500 dark:text-sage-400',
    success: 'text-sage-500 dark:text-sage-400',
    warning: 'text-champagne dark:text-champagne',
  }

  return (
    <div className={cn(
      'p-5 rounded-card border backdrop-blur-[16px] shadow-glass transition-all duration-200',
      'hover:shadow-elevated hover:-translate-y-0.5',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">{label}</p>
        {icon && <span className={iconColors[variant]}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className={cn(
          'text-3xl font-semibold tracking-tight',
          valueColors[variant]
        )}>
          {value}
        </p>
        {trend && (
          <span className={cn(
            'text-xs font-medium flex items-center gap-0.5 px-2 py-0.5 rounded-full',
            trend.direction === 'up' 
              ? 'text-sage-600 dark:text-sage-400 bg-sage-500/12 dark:bg-sage-400/20' 
              : 'text-rose-600 dark:text-rose-400 bg-rose-500/12 dark:bg-rose-400/20'
          )}>
            {trend.direction === 'up' ? '↑' : '↓'}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}

// Feature Card with icon - Premium Glass Style
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
      className={cn(
        'group p-6 rounded-card',
        'bg-white/65 dark:bg-[#2A2928]/65',
        'backdrop-blur-[20px]',
        'border border-white/50 dark:border-white/10',
        'shadow-glass',
        'hover:bg-white/80 dark:hover:bg-[#2A2928]/80',
        'hover:shadow-elevated hover:border-sage-500/20 dark:hover:border-sage-400/20',
        'transition-all duration-200',
        className
      )}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage-500/15 to-sage-500/5 dark:from-sage-400/20 dark:to-sage-400/5 flex items-center justify-center flex-shrink-0 text-sage-600 dark:text-sage-400 border border-sage-500/15 dark:border-sage-400/20">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-theme-text-primary group-hover:text-sage-600 dark:group-hover:text-sage-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-theme-text-muted mt-1 line-clamp-2">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </motion.div>
  )
}
