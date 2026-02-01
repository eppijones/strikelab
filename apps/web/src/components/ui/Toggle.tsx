import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = 'md',
  className,
}: ToggleProps) {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  }

  const sizeConfig = sizes[size]

  return (
    <label
      className={cn(
        'inline-flex items-start cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={cn(
            'rounded-full transition-colors duration-200',
            sizeConfig.track,
            checked 
              ? 'bg-theme-accent' 
              : 'bg-theme-bg-surface border border-theme-border'
          )}
        />
        <div
          className={cn(
            'absolute left-0.5 top-0.5 rounded-full shadow-sm transition-transform duration-200',
            sizeConfig.thumb,
            checked 
              ? `${sizeConfig.translate} bg-white` 
              : 'bg-theme-text-muted'
          )}
        />
      </div>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className="text-sm font-medium text-theme-text-primary">{label}</span>
          )}
          {description && (
            <p className="text-sm text-theme-text-muted mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  )
}

interface ToggleGroupProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'pills'
  className?: string
}

export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  variant = 'default',
  className,
}: ToggleGroupProps<T>) {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const paddings = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-4 py-2',
  }

  if (variant === 'pills') {
    return (
      <div className={cn('inline-flex gap-2', className)}>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 font-medium rounded-full border transition-all duration-200',
              sizes[size],
              paddings[size],
              value === option.value
                ? 'bg-theme-accent text-white border-theme-accent'
                : 'bg-theme-bg-surface text-theme-text-secondary border-theme-border hover:border-theme-accent/30 hover:text-theme-text-primary'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex rounded-xl border border-theme-border bg-theme-bg-surface p-1',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'font-medium rounded-lg transition-all duration-200',
            sizes[size],
            paddings[size],
            value === option.value
              ? 'bg-theme-accent text-white shadow-sm'
              : 'text-theme-text-muted hover:text-theme-text-primary'
          )}
        >
          <span className="flex items-center gap-1.5">
            {option.icon}
            {option.label}
          </span>
        </button>
      ))}
    </div>
  )
}

// Segmented Control - iOS style
interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  className?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  const activeIndex = options.findIndex(o => o.value === value)
  const segmentWidth = 100 / options.length

  return (
    <div
      className={cn(
        'relative inline-flex rounded-xl border border-theme-border bg-theme-bg-surface p-1',
        className
      )}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-theme-accent shadow-sm transition-transform duration-200"
        style={{
          width: `calc(${segmentWidth}% - 4px)`,
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
        }}
      />
      
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative z-10 flex-1 px-4 py-1.5 text-sm font-medium transition-colors duration-200',
            value === option.value
              ? 'text-white'
              : 'text-theme-text-muted hover:text-theme-text-primary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
