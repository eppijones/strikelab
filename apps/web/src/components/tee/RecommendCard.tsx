import { Link } from 'react-router-dom'
import { RecommendedSlot } from '@/api/tee'
import { Tag } from '@/components/ui'
import { HeroLandscape, HeroKind } from './HeroLandscape'

interface Props {
  slot: RecommendedSlot
  showHero?: boolean
}

const KIND_MAP: Record<string, HeroKind> = {
  parkland: 'parkland',
  links: 'links',
  championship: 'championship',
  lakeside: 'lakeside',
  farmland: 'farmland',
  mountain: 'mountain',
  fjord: 'fjord',
}

/**
 * Discover surface card. Editorial hero rendered against dark; mono numbers,
 * micro labels, signal-lime tag for golden windows.
 */
export function RecommendCard({ slot, showHero = true }: Props) {
  const kind: HeroKind = KIND_MAP[slot.course_type ?? ''] ?? 'parkland'
  const time = new Date(slot.tee_time)
  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')

  const tone =
    slot.window_label === 'golden'
      ? 'accent'
      : slot.window_label === 'twilight'
      ? 'warn'
      : 'default'

  return (
    <Link
      to={`/tee/courses/${slot.course_id}/sheet?date=${time.toISOString().slice(0, 10)}`}
      state={{ slotId: slot.slot_id }}
      className="block tee-card hover:border-ink-3 transition-colors overflow-hidden"
    >
      {showHero && (
        <div className="relative">
          <HeroLandscape kind={kind} height={120} />
          <div className="absolute left-2 bottom-2 flex gap-1.5">
            <Tag tone={tone}>
              {slot.window_label
                ? slot.window_label.replace('-', ' ').toUpperCase()
                : `${hh}:${mm}`}
            </Tag>
          </div>
          {slot.drive_min != null && (
            <div className="absolute right-2 bottom-2 tee-pill bg-surface/80 backdrop-blur-sm py-1 px-2 text-[10.5px]">
              {slot.drive_min} MIN
            </div>
          )}
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="display text-[22px] text-ink leading-tight">
            {slot.course_name}
          </div>
          <div className="mono text-[15px] text-ink">
            {hh}:{mm}
          </div>
        </div>
        <div className="micro mt-1.5">
          {[slot.course_city, slot.course_region].filter(Boolean).join(' · ').toUpperCase()}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 mono text-[11px] text-ink-2">
          {slot.temp_c != null && <span>{Math.round(slot.temp_c)}°</span>}
          {slot.wind_ms != null && <span>{Math.round(slot.wind_ms)} m/s</span>}
          {slot.rain_pct != null && slot.rain_pct > 0.2 && (
            <span className="text-warn">RAIN {Math.round(slot.rain_pct * 100)}%</span>
          )}
          <span className="ml-auto text-ink-3">
            {slot.available} OPEN
          </span>
        </div>

        {slot.why?.length > 0 && (
          <div className="mt-2 mono text-[10.5px] text-ink-3 truncate">
            {slot.why.join(' · ').toUpperCase()}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-line-strong flex items-baseline justify-between mono text-[12px]">
          <span className="text-ink-3">FROM</span>
          <span className="text-ink font-semibold">
            {slot.price_amount != null ? `${Math.round(slot.price_amount)} kr` : '—'}
          </span>
        </div>
      </div>
    </Link>
  )
}
