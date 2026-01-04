import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, type = 'text', id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-button border border-theme-border bg-theme-bg-surface px-3 py-2 text-sm text-theme-text-primary placeholder:text-theme-text-muted',
            'transition-all duration-250',
            'focus:outline-none focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-border-focus',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-theme-error/50 focus:ring-theme-error/50 focus:border-theme-error/50',
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
            'flex min-h-[100px] w-full rounded-button border border-theme-border bg-theme-bg-surface px-3 py-2 text-sm text-theme-text-primary placeholder:text-theme-text-muted',
            'transition-all duration-250 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-border-focus',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-theme-error/50 focus:ring-theme-error/50 focus:border-theme-error/50',
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
