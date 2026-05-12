import { ButtonHTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * StrikeLab Button — performance-instrument aesthetic.
 * - Square (radius-panel: 2px), hairline border
 * - Mono uppercase label, 0.18em tracking
 * - Single accent (Signal Lime) for primary action
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-micro transition-all duration-launch ease-launch focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-fg disabled:opacity-50 disabled:cursor-not-allowed'

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-accent text-accent-ink border border-accent hover:bg-accent-2 hover:border-accent-2',
  secondary: 'bg-surface-solid text-ink border border-line-strong hover:border-ink-3',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:text-ink hover:border-line-strong',
  outline: 'bg-transparent text-ink border border-line-strong hover:border-accent-fg hover:text-accent-fg',
  danger: 'bg-transparent text-bad border border-bad hover:bg-bad hover:text-accent-ink',
  accent: 'bg-transparent text-accent-fg border border-accent-fg hover:bg-accent hover:text-accent-ink',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'h-7 px-2.5 text-[9px]',
  sm: 'h-9 px-3.5 text-[10px]',
  md: 'h-11 px-5 text-[11px]',
  lg: 'h-12 px-6 text-[12px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="animate-spin">◌</span>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'subtle' | 'solid' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', children, ...props }, ref) => {
    const variants: Record<NonNullable<IconButtonProps['variant']>, string> = {
      ghost: 'bg-transparent text-ink-3 hover:text-ink',
      subtle: 'bg-surface-solid text-ink-2 hover:text-ink border border-line-strong',
      solid: 'bg-accent text-accent-ink border border-accent',
      outline: 'bg-transparent text-ink-2 border border-line-strong hover:text-accent-fg hover:border-accent-fg',
    }
    const sizes: Record<NonNullable<IconButtonProps['size']>, string> = {
      xs: 'w-7 h-7',
      sm: 'w-9 h-9',
      md: 'w-11 h-11',
      lg: 'w-12 h-12',
    }
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-micro ease-launch rounded-panel focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-fg disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'

/** Pill-shaped tab/segment button — used for top nav active state. */
interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, active, size = 'md', children, ...props }, ref) => {
    const sizes: Record<NonNullable<PillButtonProps['size']>, string> = {
      sm: 'h-7 px-3 text-[9px]',
      md: 'h-8 px-4 text-[10px]',
      lg: 'h-10 px-5 text-[11px]',
    }
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-mono uppercase tracking-micro border transition-all duration-micro',
          active
            ? 'bg-surface-solid text-ink border-line-strong'
            : 'bg-transparent text-ink-3 border-transparent hover:text-ink',
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
PillButton.displayName = 'PillButton'

interface MotionButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const v: Record<NonNullable<MotionButtonProps['variant']>, string> = {
      primary: variantStyles.primary,
      secondary: variantStyles.secondary,
      ghost: variantStyles.ghost,
    }
    const s: Record<NonNullable<MotionButtonProps['size']>, string> = {
      sm: sizeStyles.sm,
      md: sizeStyles.md,
      lg: sizeStyles.lg,
    }
    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, v[variant], s[size], className)}
        whileTap={{ scale: 0.98 }}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? <span>◌</span> : children}
      </motion.button>
    )
  },
)
MotionButton.displayName = 'MotionButton'
