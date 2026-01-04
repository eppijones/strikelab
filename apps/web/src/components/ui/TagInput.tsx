import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  options: string[]
  label?: string
  className?: string
}

export function TagInput({
  value,
  onChange,
  options,
  label,
  className,
}: TagInputProps) {
  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-ice-white">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const isSelected = value.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-250',
                isSelected
                  ? 'bg-cyan/20 border-cyan text-cyan'
                  : 'bg-surface border-border text-muted hover:text-ice-white hover:border-ice-white/30'
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}
