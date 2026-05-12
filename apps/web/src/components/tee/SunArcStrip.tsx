import { CourseConditions } from '@/api/tee'

interface Props {
  conditions: CourseConditions | null | undefined
  width?: number
  height?: number
  highlightStart?: number
  highlightEnd?: number
}

/**
 * Mini horizontal day strip — sun arc + best-window band.
 * Drawn against the dark surface; sun is drawn as ink-2 stroke (not warm
 * gold) so the chart reads as a measurement, not a poster.
 */
export function SunArcStrip({
  conditions,
  width = 360,
  height = 78,
  highlightStart,
  highlightEnd,
}: Props) {
  const hours = conditions?.hourly ?? []
  if (hours.length === 0) {
    return (
      <div
        className="border border-line-strong rounded-[2px]"
        style={{ height, opacity: 0.4 }}
      />
    )
  }

  const startH = 5
  const endH = 21
  const x = (h: number) => 12 + ((h - startH) / (endH - startH)) * (width - 24)
  const baseline = height - 12

  let arcPath = `M ${x(startH)} ${baseline}`
  hours.forEach((p) => {
    const px = x(p.h)
    const py = baseline - p.sun * (height - 28)
    arcPath += ` L ${px} ${py}`
  })
  arcPath += ` L ${x(endH)} ${baseline} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', width: '100%', height }}>
      <defs>
        <linearGradient id="sunarc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {/* sun fill */}
      <path d={arcPath} fill="url(#sunarc)" />
      {/* highlighted window band */}
      {highlightStart != null && highlightEnd != null && (
        <>
          <rect
            x={x(highlightStart)}
            y={6}
            width={x(highlightEnd) - x(highlightStart)}
            height={height - 22}
            fill="var(--accent)"
            fillOpacity="0.08"
          />
          <rect
            x={x(highlightStart)}
            y={6}
            width={x(highlightEnd) - x(highlightStart)}
            height={height - 22}
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.5"
            strokeDasharray="2 3"
          />
        </>
      )}
      {/* baseline + ticks */}
      <line
        x1="12"
        y1={baseline}
        x2={width - 12}
        y2={baseline}
        stroke="var(--line-strong)"
      />
      {[6, 9, 12, 15, 18, 21].map((h) => (
        <g key={h}>
          <line
            x1={x(h)}
            y1={baseline}
            x2={x(h)}
            y2={baseline + 3}
            stroke="var(--line-strong)"
          />
          <text
            x={x(h)}
            y={height - 1}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill="var(--ink-3)"
          >
            {String(h).padStart(2, '0')}
          </text>
        </g>
      ))}
    </svg>
  )
}
