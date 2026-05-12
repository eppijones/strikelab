import { CourseConditions } from '@/api/tee'
import clsx from 'clsx'

interface Props {
  conditions: CourseConditions | null | undefined
  hour?: number
  className?: string
}

/**
 * Live conditions row — temp / wind / stimp / mowed.
 * Mono numbers, micro labels, single-row pill grid. No paper warmth.
 */
export function ConditionsRow({ conditions, hour, className }: Props) {
  if (!conditions) return null
  const sample =
    (conditions.hourly?.find((h) => h.h === (hour ?? 14)) ??
      conditions.hourly?.[Math.floor((conditions.hourly?.length ?? 0) / 2)]) ||
    null
  const items = [
    {
      label: 'TEMP',
      value: sample?.t != null ? `${Math.round(sample.t)}°` : '—',
    },
    {
      label: 'WIND',
      value: sample
        ? `${Math.round(sample.w)} m/s${sample.dir ? ' ' + sample.dir : ''}`
        : '—',
    },
    {
      label: 'STIMP',
      value:
        conditions.green_speed != null ? conditions.green_speed.toFixed(1) : '—',
    },
    {
      label: 'MOWED',
      value:
        conditions.mowed_hrs_ago != null ? `${conditions.mowed_hrs_ago}h ago` : '—',
    },
  ]
  return (
    <div className={clsx('flex flex-wrap items-baseline gap-x-6 gap-y-2', className)}>
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline gap-2">
          <span className="micro">{it.label}</span>
          <span className="mono text-[13px] text-ink">{it.value}</span>
        </div>
      ))}
    </div>
  )
}
