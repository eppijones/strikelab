import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
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
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-theme-accent/50 focus:ring-offset-2 focus:ring-offset-theme-bg-primary disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-theme-accent text-theme-text-inverted hover:bg-theme-accent-hover hover:shadow-glow-sm active:scale-[0.98]',
      secondary:
        'bg-theme-bg-surface border border-theme-border text-theme-text-primary hover:bg-theme-bg-elevated hover:border-theme-accent/30 active:scale-[0.98]',
      ghost:
        'bg-transparent text-theme-text-primary hover:bg-theme-bg-surface hover:text-theme-accent',
      danger:
        'bg-theme-error-dim border border-theme-error/30 text-theme-error hover:bg-theme-error/20 hover:border-theme-error/50',
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-button',
      md: 'h-10 px-4 text-sm rounded-button',
      lg: 'h-12 px-6 text-base rounded-button',
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
              className="animate-spin -ml-1 mr-2 h-4 w-4"
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
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
