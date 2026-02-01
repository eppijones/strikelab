import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, type = 'text', id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-theme-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'flex h-12 w-full rounded-xl border border-theme-border bg-theme-bg-card',
              'px-4 py-3 text-base text-theme-text-primary placeholder:text-theme-text-muted',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent/50',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-theme-bg-surface',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'border-theme-error/50 focus:ring-theme-error/20 focus:border-theme-error/50',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-theme-error">{error}</p>}
        {hint && !error && <p className="text-sm text-theme-text-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-theme-text-primary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex min-h-[120px] w-full rounded-xl border border-theme-border bg-theme-bg-card',
            'px-4 py-3 text-base text-theme-text-primary placeholder:text-theme-text-muted',
            'transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-theme-accent/20 focus:border-theme-accent/50',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-theme-bg-surface',
            error && 'border-theme-error/50 focus:ring-theme-error/20 focus:border-theme-error/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-theme-error">{error}</p>}
        {hint && !error && <p className="text-sm text-theme-text-muted">{hint}</p>}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

// Search Input with icon built-in
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        leftIcon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        }
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="hover:text-theme-text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : undefined
        }
        className={cn('', className)}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'
