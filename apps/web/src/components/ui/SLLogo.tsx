interface SLLogoProps {
  size?: number
  color?: string
  withWord?: boolean
  wordSize?: number
  condensed?: boolean
}

export function SLLogo({
  size = 24,
  color,
  withWord = false,
  wordSize,
  condensed = false,
}: SLLogoProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: withWord ? size * 0.45 : 0,
        color: color || 'currentColor',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="StrikeLab">
        <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1" />
        <line x1="12" y1="2" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1" />
        <line x1="12" y1="17.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
        <line x1="2" y1="12" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1" />
        <line x1="17.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
        <circle cx="13.5" cy="10.5" r="1.6" fill="currentColor" />
        <path d="M12 12 L13.5 10.5" stroke="currentColor" strokeWidth="1" />
      </svg>
      {withWord && (
        <span
          style={{
            fontFamily: 'Geist, sans-serif',
            fontWeight: 600,
            fontSize: wordSize || size * 0.8,
            letterSpacing: condensed ? '0.18em' : '0.02em',
            textTransform: condensed ? 'uppercase' : 'none',
          }}
        >
          {condensed ? 'STRIKELAB' : 'StrikeLab'}
        </span>
      )}
    </span>
  )
}
