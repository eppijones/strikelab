import { cn } from '@/lib/utils'

interface ScaleInputProps {
  value: number | null
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  className?: string
}

export function ScaleInput({
  value,
  onChange,
  min = 1,
  max = 5,
  label,
  className,
}: ScaleInputProps) {
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-theme-text-primary">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        {range.map((num) => {
          const isSelected = value === num
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={cn(
                'w-10 h-10 flex items-center justify-center text-sm font-medium rounded-button border transition-all duration-250',
                isSelected
                  ? 'bg-theme-accent text-theme-text-inverted border-theme-accent shadow-glow-sm'
                  : 'bg-theme-bg-surface border-theme-border text-theme-text-muted hover:text-theme-text-primary hover:border-theme-accent/30'
              )}
            >
              {num}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-theme-text-muted">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  )
}
