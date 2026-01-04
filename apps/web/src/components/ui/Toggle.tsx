import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  className,
}: ToggleProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-250',
            checked ? 'bg-theme-accent' : 'bg-theme-bg-surface border border-theme-border'
          )}
        />
        <div
          className={cn(
            'absolute left-0.5 top-0.5 w-5 h-5 rounded-full shadow-md transition-transform duration-250',
            checked ? 'translate-x-5 bg-theme-text-inverted' : 'bg-theme-text-primary'
          )}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm text-theme-text-primary">{label}</span>
      )}
    </label>
  )
}

interface ToggleGroupProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  className?: string
}

export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: ToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex rounded-button border border-theme-border bg-theme-bg-surface p-1',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-250',
            value === option.value
              ? 'bg-theme-accent text-theme-text-inverted'
              : 'text-theme-text-muted hover:text-theme-text-primary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
