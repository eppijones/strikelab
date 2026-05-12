import { BestWindow } from '@/api/tee'
import clsx from 'clsx'

interface Props {
  window: BestWindow
  onClick?: () => void
  language?: 'en' | 'no'
  selected?: boolean
}

/**
 * "Best Window" hero card — Morning Calm / Golden Hour / Twilight.
 * Dark surface, signal-lime accent for golden, ink-2 for moss/fjord.
 */
export function WindowCard({ window, onClick, language = 'en', selected }: Props) {
  const dotColor =
    window.accent === 'sun'
      ? 'bg-accent'
      : window.accent === 'fjord'
      ? 'bg-ink-2'
      : 'bg-ink-3'
  const label = language === 'no' ? window.label_no : window.label_en
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex-shrink-0 text-left bg-surface-solid border rounded-[2px] p-3.5 w-[220px] transition-colors',
        selected
          ? 'border-accent-fg'
          : 'border-line-strong hover:border-ink-3',
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotColor)} />
        <span className="micro text-ink-3">{label.toUpperCase()}</span>
      </div>
      <div className="text-[20px] mono text-ink leading-tight">{window.range}</div>
      <div className="mt-2 pt-2 border-t border-line-strong flex items-center justify-between mono text-[10.5px]">
        <span className="text-ink-2">{window.conditions_summary}</span>
        <span className="text-ink-3">
          {window.free_slots} {window.free_slots === 1 ? 'open' : 'open'}
        </span>
      </div>
    </button>
  )
}
