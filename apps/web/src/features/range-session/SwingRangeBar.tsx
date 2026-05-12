/**
 * Range-bar visualization adapted from StrikelabDesign/swing-watch.jsx —
 * personal target window (lime) vs axis spread (hairline).
 */

const ACCENT = '#9fe870'
const INK = '#ede8de'
const INK3 = '#76746b'
const LINE2 = '#2d322f'

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export interface SwingRangeBarProps {
  value: number
  target: readonly [number, number]
  range: readonly [number, number]
  min: number
  max: number
  width?: number
  height?: number
  label?: string
  valueSuffix?: string
  recent?: number[] | null
}

/** Full-height tick + value label (Swing Card style). */
export function SwingRangeBar({
  value,
  target,
  range,
  min,
  max,
  width = 280,
  height = 36,
  label,
  valueSuffix = '',
  recent = null,
}: SwingRangeBarProps) {
  const pad = 10
  const inner = width - pad * 2
  const span = max - min || 1
  const xFor = (v: number) => pad + ((clamp(v, min, max) - min) / span) * inner
  const [r0, r1] = range
  const [t0, t1] = target
  const cx = xFor(value)
  const inWindow = value >= t0 && value <= t1
  const labelStr =
    typeof value === 'number'
      ? `${value < 10 ? value.toFixed(2) : value.toFixed(1)}${valueSuffix}`
      : String(value)

  return (
    <div className="w-full">
      {label ? (
        <div className="flex justify-between items-baseline mb-1 mono text-[10px] uppercase tracking-micro text-ink-3">
          <span>{label}</span>
        </div>
      ) : null}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="max-w-full block">
        <line
          x1={xFor(r0)}
          x2={xFor(r1)}
          y1={height * 0.65}
          y2={height * 0.65}
          stroke={LINE2}
          strokeWidth={1}
        />
        <line
          x1={xFor(r0)}
          x2={xFor(r0)}
          y1={height * 0.52}
          y2={height * 0.78}
          stroke={INK3}
          strokeWidth={1}
        />
        <line
          x1={xFor(r1)}
          x2={xFor(r1)}
          y1={height * 0.52}
          y2={height * 0.78}
          stroke={INK3}
          strokeWidth={1}
        />
        <line
          x1={xFor(t0)}
          x2={xFor(t1)}
          y1={height * 0.65}
          y2={height * 0.65}
          stroke={ACCENT}
          strokeWidth={2.5}
        />
        <line
          x1={xFor(t0)}
          x2={xFor(t0)}
          y1={height * 0.4}
          y2={height * 0.9}
          stroke={ACCENT}
          strokeWidth={1.2}
        />
        <line
          x1={xFor(t1)}
          x2={xFor(t1)}
          y1={height * 0.4}
          y2={height * 0.9}
          stroke={ACCENT}
          strokeWidth={1.2}
        />
        {recent?.map((v, i) => (
          <circle
            key={i}
            cx={xFor(v)}
            cy={height * 0.65}
            r={1.2}
            fill={INK3}
            opacity={0.45 + (i / Math.max(1, recent.length)) * 0.35}
          />
        ))}
        <line x1={cx} x2={cx} y1={height * 0.08} y2={height * 0.65} stroke={inWindow ? ACCENT : INK} strokeWidth={1} />
        <circle cx={cx} cy={height * 0.65} r={2.8} fill={inWindow ? ACCENT : INK} />
        <text
          x={cx}
          y={height * 0.07}
          textAnchor="middle"
          fill={inWindow ? ACCENT : INK}
          className="mono text-[9px] font-medium"
          dominantBaseline="hanging"
        >
          {labelStr}
        </text>
      </svg>
    </div>
  )
}

/** Compact row (TEMPO / BACK / HAND strip). */
export function SwingMiniRangeBar({
  value,
  target,
  range,
  min,
  max,
  width = 120,
  height = 14,
}: Omit<SwingRangeBarProps, 'label' | 'valueSuffix' | 'recent' | 'height'> & { height?: number }) {
  const pad = 2
  const inner = width - pad * 2
  const span = max - min || 1
  const xFor = (v: number) => pad + ((clamp(v, min, max) - min) / span) * inner
  const [t0, t1] = target
  const inWindow = value >= t0 && value <= t1
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="shrink-0">
      <line
        x1={xFor(range[0])}
        x2={xFor(range[1])}
        y1={height / 2}
        y2={height / 2}
        stroke={LINE2}
        strokeWidth={0.8}
      />
      <line x1={xFor(t0)} x2={xFor(t1)} y1={height / 2} y2={height / 2} stroke={ACCENT} strokeWidth={2} />
      <line x1={xFor(t0)} x2={xFor(t0)} y1={3} y2={height - 3} stroke={ACCENT} strokeWidth={0.8} />
      <line x1={xFor(t1)} x2={xFor(t1)} y1={3} y2={height - 3} stroke={ACCENT} strokeWidth={0.8} />
      <circle cx={xFor(value)} cy={height / 2} r={2} fill={inWindow ? ACCENT : INK} />
    </svg>
  )
}
