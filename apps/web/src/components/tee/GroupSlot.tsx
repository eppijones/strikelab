import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

export interface GroupPlayer {
  user_id?: string | null
  name: string
  initials: string
  handicap?: number | null
  is_you?: boolean
}

interface Props {
  index: number
  player?: GroupPlayer
  onAdd?: () => void
  onRemove?: () => void
  isLast?: boolean
}

export function GroupSlot({ index, player, onAdd, onRemove, isLast }: Props) {
  const { t } = useTranslation()
  const empty = !player
  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-3.5 py-3 tee-editorial:px-4 tee-editorial:py-4',
        !isLast && 'border-b border-line-strong',
      )}
    >
      <div
        className={clsx(
          'w-9 h-9 flex items-center justify-center text-[13px] mono uppercase tracking-micro-tight',
          empty
            ? 'border border-dashed border-line-strong text-ink-3 tee-editorial:rounded-full'
            : player.is_you
            ? 'bg-accent text-accent-ink tee-editorial:rounded-full'
            : 'bg-surface-2 text-ink-2 border border-line-strong tee-editorial:rounded-full',
        )}
      >
        {empty ? '+' : player.initials}
      </div>
      <div className="flex-1 min-w-0">
        {empty ? (
          <button
            type="button"
            onClick={onAdd}
            className="text-left mono text-[12px] uppercase tracking-micro text-ink-2 hover:text-ink"
          >
            {t('tee.addPlayer')} <span className="text-ink-4">· {index + 1}</span>
          </button>
        ) : (
          <>
            <div className="text-[14px] text-ink truncate flex items-center gap-2">
              {player.name}
              {player.is_you && (
                <span className="mono text-[9px] uppercase tracking-micro bg-accent text-accent-ink px-1 py-0.5 tee-editorial:rounded-pill tee-editorial:px-2">
                  {t('tee.you')}
                </span>
              )}
            </div>
            <div className="mono text-[10.5px] text-ink-3 mt-0.5">
              {t('tee.handicap')}{' '}
              {player.handicap != null ? player.handicap.toFixed(1) : '—'}
            </div>
          </>
        )}
      </div>
      {!empty && !player.is_you && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mono text-[10px] text-ink-3 hover:text-bad uppercase tracking-micro"
        >
          REMOVE
        </button>
      )}
    </div>
  )
}
