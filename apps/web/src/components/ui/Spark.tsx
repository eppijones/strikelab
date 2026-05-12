interface SparkProps {
  data: number[]
  w?: number
  h?: number
  color?: string
  strokeWidth?: number
  fill?: boolean
}

export function Spark({
  data,
  w = 120,
  h = 28,
  color = 'var(--accent)',
  strokeWidth = 1.25,
  fill = false,
}: SparkProps) {
  if (!data || !data.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const r = max - min || 1
  const pts = data.map(
    (v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / r) * (h - 2) - 1] as const,
  )
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} className="block">
      {fill && <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity="0.12" />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  )
}
