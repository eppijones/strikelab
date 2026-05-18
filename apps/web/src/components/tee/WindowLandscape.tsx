import { useMemo } from 'react'
import clsx from 'clsx'
import { CourseConditions, TeeSheetSlot } from '@/api/tee'

interface Props {
  slots: TeeSheetSlot[]
  conditions: CourseConditions | null | undefined
  selectedId?: string | null
  onSelect: (slot: TeeSheetSlot) => void
  windowStart?: number
  windowEnd?: number
  windowLabel?: string
}

/**
 * "The Window" — the moment-not-time picker.
 *
 * Vertical sun ribbon (06–21) with overlaid wind line; tee-time chips placed
 * at their actual Y position by hour+minute. The "best window" band is drawn
 * with the signal-lime accent in dashed lines so it reads as a measurement,
 * not a poster.
 */
export function WindowLandscape({
  slots,
  conditions,
  selectedId,
  onSelect,
  windowStart,
  windowEnd,
  windowLabel,
}: Props) {
  const startH = 5
  const endH = 21
  const rowPx = 38
  const totalH = (endH - startH) * rowPx
  const ribbonW = 56

  const yFor = (h: number, m = 0) => ((h + m / 60) - startH) * rowPx

  const hourly = conditions?.hourly ?? []
  const maxWind = 14

  const sunStops = hourly.map((p) => ({ ...p }))

  const wpath = useMemo(() => {
    if (!sunStops.length) return ''
    return sunStops
      .map((p, i) => {
        const x = 4 + (Math.min(maxWind, p.w) / maxWind) * (ribbonW - 8)
        const y = yFor(p.h)
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }, [sunStops])

  const peakSun = sunStops.reduce(
    (a, b) => (b.sun > a.sun ? b : a),
    { h: 12, sun: 0 } as (typeof sunStops)[number],
  )

  const bandTop = windowStart != null ? yFor(windowStart) : null
  const bandHeight =
    windowStart != null && windowEnd != null
      ? yFor(windowEnd) - yFor(windowStart)
      : null

  return (
    <div className="relative panel p-4">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div className="display text-[22px] text-ink">
          <em className="serif">The day as landscape</em>
        </div>
        <div className="micro">WIND ↗ SUN</div>
      </div>
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `30px ${ribbonW}px 1fr`,
          height: totalH,
        }}
      >
        {/* Best window band overlay */}
        {bandTop != null && bandHeight != null && (
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: bandTop,
              height: bandHeight,
              background:
                'linear-gradient(90deg, rgba(204,240,96,0.10) 0%, rgba(204,240,96,0.02) 100%)',
              borderTop: '1px dashed var(--accent)',
              borderBottom: '1px dashed var(--accent)',
            }}
          >
            <div className="absolute right-2 top-1 micro text-accent-fg">
              ★ {windowLabel ?? 'BEST WINDOW'}
            </div>
          </div>
        )}

        {/* Hour ticks */}
        <div className="relative" style={{ height: totalH }}>
          {Array.from({ length: endH - startH + 1 }, (_, i) => startH + i).map(
            (h) => (
              <div
                key={h}
                className={clsx(
                  'absolute right-1 mono text-[10px]',
                  h % 3 === 0 ? 'text-ink-2' : 'text-ink-3 opacity-60',
                )}
                style={{ top: yFor(h) - 6 }}
              >
                {String(h).padStart(2, '0')}
              </div>
            ),
          )}
        </div>

        {/* Atmospheric ribbon */}
        <div className="relative" style={{ height: totalH }}>
          <svg
            viewBox={`0 0 ${ribbonW} ${totalH}`}
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: ribbonW, height: totalH }}
          >
            <defs>
              <linearGradient id="sun-ribbon" x1="0" y1="0" x2="0" y2="1">
                {sunStops.map((p, i) => (
                  <stop
                    key={i}
                    offset={`${(i / Math.max(1, sunStops.length - 1)) * 100}%`}
                    stopColor="var(--accent)"
                    stopOpacity={(0.05 + p.sun * 0.45).toFixed(3)}
                  />
                ))}
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={ribbonW} height={totalH} fill="url(#sun-ribbon)" />
            {Array.from({ length: endH - startH + 1 }, (_, i) => startH + i).map(
              (h) => (
                <line
                  key={h}
                  x1="0"
                  y1={yFor(h)}
                  x2={ribbonW}
                  y2={yFor(h)}
                  stroke="var(--line-strong)"
                  strokeOpacity="0.4"
                />
              ),
            )}
            {wpath && (
              <path
                d={wpath}
                fill="none"
                stroke="var(--ink-2)"
                strokeWidth="1.4"
                strokeOpacity="0.7"
                strokeLinecap="round"
              />
            )}
            {peakSun.sun > 0 && (
              <g transform={`translate(${ribbonW / 2}, ${yFor(peakSun.h)})`}>
                <circle r="6" fill="var(--accent)" />
                <circle
                  r="10"
                  fill="none"
                  stroke="var(--accent)"
                  strokeOpacity="0.4"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Slot chips */}
        <div className="relative pl-3" style={{ height: totalH }}>
          {slots.map((slot) => {
            const d = new Date(slot.tee_time)
            const y = yFor(d.getHours(), d.getMinutes())
            const taken = slot.players_taken
            const avail = Math.max(0, slot.players_total - taken)
            const isSel = slot.id === selectedId
            const blocked = slot.is_blocked || avail === 0
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => !blocked && onSelect(slot)}
                disabled={blocked}
                className={clsx(
                'absolute left-0 right-0 h-[24px] px-2.5 flex items-center justify-between rounded-pill mono text-[10.5px] transition-colors',
                  isSel
                    ? 'bg-accent text-accent-ink border border-accent'
                    : blocked
                    ? 'bg-transparent text-ink-4 line-through opacity-50'
                    : slot.golden
                    ? 'bg-bg-2 text-ink border border-accent-fg/40 hover:border-accent-fg'
                    : 'bg-bg-2 text-ink-2 border border-line-strong hover:border-ink-2',
                )}
                style={{ top: y - 11 }}
              >
                <span className="font-medium">
                  {String(d.getHours()).padStart(2, '0')}:
                  {String(d.getMinutes()).padStart(2, '0')}
                </span>
                <span className="flex items-center gap-1.5">
                  <SlotDots taken={taken} total={slot.players_total} />
                  {slot.price_amount != null && (
                    <span className="opacity-70">
                      {Math.round(slot.price_amount)}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SlotDots({ taken, total }: { taken: number; total: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={clsx(
            'inline-block w-1 h-1 rounded-full',
            i < taken ? 'bg-current opacity-80' : 'border border-current opacity-40',
          )}
        />
      ))}
    </span>
  )
}
