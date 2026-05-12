import clsx from 'clsx'

interface StatProps {
  label: string
  value: string | number
  unit?: string
  delta?: string
  deltaTone?: 'good' | 'warn' | 'bad' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Stat({
  label,
  value,
  unit,
  delta,
  deltaTone = 'good',
  size = 'md',
  className,
}: StatProps) {
  const big = size === 'lg' ? 'text-[56px]' : size === 'sm' ? 'text-[28px]' : 'text-[40px]'
  const tone =
    deltaTone === 'bad'
      ? 'text-bad'
      : deltaTone === 'warn'
      ? 'text-warn'
      : deltaTone === 'neutral'
      ? 'text-ink-3'
      : 'text-accent-fg'
  return (
    <div className={className}>
      <div className="micro">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1.5">
        <span
          className={clsx('num font-medium tracking-display', big)}
          style={{ lineHeight: 0.95 }}
        >
          {value}
        </span>
        {unit && <span className="micro">{unit}</span>}
      </div>
      {delta && <div className={clsx('mono text-[11px] mt-1.5', tone)}>{delta}</div>}
    </div>
  )
}
