import { ReactNode, CSSProperties, HTMLAttributes } from 'react'
import clsx from 'clsx'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  id?: string
  title?: string
  right?: ReactNode
  padded?: boolean
  children: ReactNode
  bodyClassName?: string
}

export function Panel({
  id,
  title,
  right,
  padded = true,
  children,
  className,
  bodyClassName,
  style,
  ...rest
}: PanelProps) {
  const hasHeader = !!(id || title || right)
  return (
    <div className={clsx('panel relative', className)} style={style} {...rest}>
      {hasHeader && (
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line-strong tee-editorial:border-line">
          <div className="flex items-center gap-2.5">
            {id && <span className="mono text-[10px] text-ink-4">{id}</span>}
            {title && <span className="micro text-ink-2">{title}</span>}
          </div>
          {right}
        </div>
      )}
      <div className={clsx(padded && 'p-3.5 tee-editorial:p-4', bodyClassName)}>{children}</div>
    </div>
  )
}

interface BracketsProps {
  children?: ReactNode
  padding?: number
  className?: string
  style?: CSSProperties
}

export function Brackets({ children, padding = 14, className, style }: BracketsProps) {
  return (
    <div className={clsx('relative', className)} style={{ padding, ...style }}>
      {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
        <BracketCorner key={p} pos={p} />
      ))}
      {children}
    </div>
  )
}

function BracketCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const m: Record<typeof pos, CSSProperties> = {
    tl: { top: 0, left: 0 },
    tr: { top: 0, right: 0, transform: 'scaleX(-1)' },
    bl: { bottom: 0, left: 0, transform: 'scaleY(-1)' },
    br: { bottom: 0, right: 0, transform: 'scale(-1)' },
  }
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      style={{ position: 'absolute', color: 'var(--ink-4)', ...m[pos] }}
    >
      <path d="M0 0 L0 4 M0 0 L4 0" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  )
}
