import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: Array<{ value: string; label: string }>
  children?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, id, ...props }, ref) => {
    const selectId = id || props.name

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-theme-text-primary"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'flex h-10 w-full rounded-button border border-theme-border bg-theme-bg-surface px-3 py-2 text-sm text-theme-text-primary',
            'transition-all duration-250 appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-border-focus',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%238A8A99\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5em_1.5em] pr-10',
            error && 'border-theme-error/50',
            className
          )}
          {...props}
        >
          {/* If options prop is provided, use it; otherwise use children */}
          {options 
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children
          }
        </select>
        {error && <p className="text-sm text-theme-error">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
