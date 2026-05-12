import { ReactNode } from 'react'
import clsx from 'clsx'

interface TagProps {
  children: ReactNode
  tone?: 'default' | 'accent' | 'warn' | 'bad'
  className?: string
}

export function Tag({ children, tone = 'default', className }: TagProps) {
  const tones: Record<NonNullable<TagProps['tone']>, string> = {
    default: 'text-ink-2 border-line-strong',
    accent: 'text-accent-fg border-accent-fg',
    warn: 'text-warn border-warn',
    bad: 'text-bad border-bad',
  }
  return (
    <span
      className={clsx(
        'mono inline-block px-1.5 py-0.5 border rounded-panel uppercase',
        'text-[9px] tracking-micro',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
