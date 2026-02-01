import { ButtonHTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
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
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-medium 
      transition-all duration-200 ease-smooth
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sage-500/40
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `

    const variants = {
      primary: `
        bg-gradient-to-br from-sage-500 to-sage-600 text-white 
        hover:from-sage-600 hover:to-sage-700
        shadow-md shadow-sage-500/20 hover:shadow-lg hover:shadow-sage-500/25
      `,
      secondary: `
        bg-white/70 dark:bg-[#2A2928]/70 backdrop-blur-[16px]
        border border-black/8 dark:border-white/10 text-theme-text-primary 
        hover:bg-white/90 dark:hover:bg-[#2A2928]/90 
        hover:border-sage-500/25 dark:hover:border-sage-400/25
        shadow-sm hover:shadow-md
      `,
      ghost: `
        bg-transparent text-theme-text-secondary
        hover:bg-sage-500/8 dark:hover:bg-sage-400/10 
        hover:text-sage-600 dark:hover:text-sage-400
      `,
      outline: `
        bg-transparent border border-theme-border text-theme-text-primary
        hover:bg-sage-500/5 hover:border-sage-500/30 hover:text-sage-600
        dark:hover:bg-sage-400/10 dark:hover:border-sage-400/30 dark:hover:text-sage-400
      `,
      danger: `
        bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400
        hover:bg-rose-500/20 hover:border-rose-500/40
      `,
      accent: `
        bg-sage-500/12 dark:bg-sage-400/15 
        border border-sage-500/25 dark:border-sage-400/25 
        text-sage-600 dark:text-sage-400
        hover:bg-sage-500/20 dark:hover:bg-sage-400/25
        hover:border-sage-500/40 dark:hover:border-sage-400/40
      `,
    }

    const sizes = {
      xs: 'h-7 px-2.5 text-xs rounded-lg',
      sm: 'h-9 px-3.5 text-sm rounded-xl',
      md: 'h-11 px-5 text-sm rounded-xl',
      lg: 'h-13 px-7 text-base rounded-2xl',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// Icon Button
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'subtle' | 'solid' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', children, ...props }, ref) => {
    const variants = {
      ghost: 'bg-transparent hover:bg-sage-500/10 dark:hover:bg-sage-400/10 text-theme-text-muted hover:text-sage-600 dark:hover:text-sage-400',
      subtle: 'bg-sage-500/8 dark:bg-sage-400/10 hover:bg-sage-500/15 dark:hover:bg-sage-400/20 text-theme-text-muted hover:text-sage-600 dark:hover:text-sage-400',
      solid: 'bg-gradient-to-br from-sage-500 to-sage-600 text-white hover:from-sage-600 hover:to-sage-700 shadow-md shadow-sage-500/25',
      outline: 'bg-transparent border border-theme-border text-theme-text-muted hover:text-sage-600 hover:border-sage-500/30 dark:hover:text-sage-400 dark:hover:border-sage-400/30',
    }

    const sizes = {
      xs: 'w-7 h-7 rounded-lg',
      sm: 'w-9 h-9 rounded-xl',
      md: 'w-11 h-11 rounded-xl',
      lg: 'w-13 h-13 rounded-2xl',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.95]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

// Pill Button - Scandinavian rounded style with glassmorphism
interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, variant = 'secondary', size = 'md', active, children, ...props }, ref) => {
    const variants = {
      primary: active 
        ? 'bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-md shadow-sage-500/25'
        : 'bg-white/60 dark:bg-[#2A2928]/60 backdrop-blur-[12px] text-theme-text-secondary hover:text-theme-text-primary hover:bg-white/80 dark:hover:bg-[#2A2928]/80 border-black/8 dark:border-white/8',
      secondary: active
        ? 'bg-sage-500/15 dark:bg-sage-400/20 text-sage-600 dark:text-sage-400 border-sage-500/30 dark:border-sage-400/30'
        : 'bg-white/60 dark:bg-[#2A2928]/60 backdrop-blur-[12px] text-theme-text-secondary hover:text-sage-600 dark:hover:text-sage-400 border-black/8 dark:border-white/8 hover:border-sage-500/25 dark:hover:border-sage-400/25',
      ghost: active
        ? 'bg-sage-500/12 dark:bg-sage-400/15 text-sage-600 dark:text-sage-400'
        : 'bg-transparent text-theme-text-muted hover:text-sage-600 dark:hover:text-sage-400 hover:bg-sage-500/8 dark:hover:bg-sage-400/10',
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-11 px-5 text-sm',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-full border transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/40',
          'active:scale-[0.97]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

PillButton.displayName = 'PillButton'

// Animated Button with Framer Motion
interface MotionButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-medium 
      focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/40 
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variants = {
      primary: 'bg-gradient-to-br from-sage-500 to-sage-600 text-white hover:from-sage-600 hover:to-sage-700 shadow-md shadow-sage-500/25',
      secondary: 'bg-white/70 dark:bg-[#2A2928]/70 backdrop-blur-[16px] border border-black/8 dark:border-white/10 text-theme-text-primary hover:bg-white/90 dark:hover:bg-[#2A2928]/90',
      ghost: 'bg-transparent text-theme-text-secondary hover:bg-sage-500/10 dark:hover:bg-sage-400/10 hover:text-sage-600 dark:hover:text-sage-400',
    }

    const sizes = {
      sm: 'h-9 px-4 text-sm rounded-xl',
      md: 'h-11 px-5 text-sm rounded-xl',
      lg: 'h-13 px-7 text-base rounded-2xl',
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            ◌
          </motion.span>
        ) : children}
      </motion.button>
    )
  }
)

MotionButton.displayName = 'MotionButton'
