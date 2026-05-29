import { useEffect } from 'react'

import { FONT_DISPLAY, FONT_UI, TEE } from './tokens'

function injectMarkKeyframes() {
  if (typeof document === 'undefined' || document.getElementById('sl-mark-anim')) return
  const s = document.createElement('style')
  s.id = 'sl-mark-anim'
  s.textContent = `
    @keyframes sl-mark-ring {
      from { stroke-dashoffset: 163.4; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes sl-mark-dimple {
      0%   { opacity: 0; transform: scale(0.2); }
      60%  { opacity: 0.42; transform: scale(1.15); }
      100% { opacity: 0.32; transform: scale(1); }
    }
    @keyframes sl-mark-strike {
      0%   { r: 0; opacity: 0; }
      55%  { r: var(--sl-strike-r-overshoot, 5.6); opacity: 1; }
      100% { r: var(--sl-strike-r, 4.6); opacity: 1; }
    }
    @keyframes sl-strike-glow {
      0%   { opacity: 0; transform: scale(0.4); }
      40%  { opacity: 0.35; }
      100% { opacity: 0; transform: scale(2.4); }
    }
    @keyframes sl-word-in {
      0%   { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .sl-ring-anim {
      stroke-dasharray: 163.4;
      stroke-dashoffset: 163.4;
      transform: rotate(-90deg);
      transform-origin: center;
      transform-box: fill-box;
      animation: sl-mark-ring 320ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .sl-dimple-anim {
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      animation: sl-mark-dimple 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .sl-strike-anim {
      r: 0;
      transform-box: fill-box;
      transform-origin: center;
      animation: sl-mark-strike 360ms cubic-bezier(0.34, 1.7, 0.5, 1) 360ms forwards;
    }
    .sl-strike-glow {
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      animation: sl-strike-glow 520ms cubic-bezier(0.22, 1, 0.36, 1) 360ms forwards;
    }
    .sl-word-anim {
      opacity: 0;
      display: inline-block;
      animation: sl-word-in 380ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .sl-ring-anim   { stroke-dashoffset: 0 !important; transform: none !important; animation: none !important; }
      .sl-dimple-anim { opacity: 0.32 !important; animation: none !important; }
      .sl-strike-anim { r: var(--sl-strike-r, 4.6) !important; animation: none !important; }
      .sl-strike-glow { display: none !important; }
      .sl-word-anim   { opacity: 1 !important; transform: none !important; animation: none !important; }
    }
  `
  document.head.appendChild(s)
}

type MarkProps = {
  size?: number
  arcColor?: string
  ballColor?: string
  strokeWidth?: number
  animate?: boolean
  stage?: 'empty' | 'ring' | 'dimples' | 'complete'
}

export function StrikelabMark({
  size = 36,
  arcColor,
  ballColor,
  strokeWidth,
  animate = false,
  stage = 'complete',
}: MarkProps) {
  useEffect(() => {
    injectMarkKeyframes()
  }, [])

  const arc = arcColor || TEE.moss
  const ball = ballColor || TEE.sun
  const sw = strokeWidth ?? Math.max(1.6, Math.min(2.4, size / 28))
  const showDimplesAtThisSize = size >= 36

  const spacing = 5.2
  const rowH = (spacing * Math.sqrt(3)) / 2
  const innerR = 21
  const dimples: { x: number; y: number; d: number }[] = []
  for (let row = -5; row <= 5; row++) {
    const y = 32 + row * rowH
    const xOff = Math.abs(row) % 2 === 0 ? 0 : spacing / 2
    for (let col = -5; col <= 5; col++) {
      const x = 32 + col * spacing + xOff
      const d = Math.hypot(x - 32, y - 32)
      if (d <= innerR - 1) dimples.push({ x, y, d })
    }
  }

  const strikeX = 36.0
  const strikeY = 26.5
  const strikeR = showDimplesAtThisSize ? 4.6 : 4.2
  const visibleDimples = dimples.filter((d) => Math.hypot(d.x - strikeX, d.y - strikeY) > strikeR + 1.5)
  const orderedDimples = [...visibleDimples].sort((a, b) => b.d - a.d)
  const maxD = orderedDimples[0]?.d || 1

  const showRing = stage !== 'empty'
  const showDimples = (stage === 'dimples' || stage === 'complete') && showDimplesAtThisSize
  const showStrike = stage === 'complete'

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{
        display: 'block',
        flexShrink: 0,
        ['--sl-strike-r' as string]: `${strikeR}`,
        ['--sl-strike-r-overshoot' as string]: `${strikeR + 1.0}`,
      }}
    >
      {showRing && (
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke={arc}
          strokeWidth={sw}
          className={animate ? 'sl-ring-anim' : undefined}
        />
      )}
      {showDimples &&
        orderedDimples.map((d, i) => {
          const ringIdx = Math.round((maxD - d.d) / 2.6)
          const delay = 140 + ringIdx * 28
          return (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r="1.35"
              fill={arc}
              opacity="0.32"
              className={animate ? 'sl-dimple-anim' : undefined}
              style={animate ? { animationDelay: `${delay}ms`, opacity: 0 } : undefined}
            />
          )
        })}
      {showStrike && animate && (
        <circle cx={strikeX} cy={strikeY} r="9" fill={ball} className="sl-strike-glow" opacity="0" />
      )}
      {showStrike && (
        <circle
          cx={strikeX}
          cy={strikeY}
          r={strikeR}
          fill={ball}
          className={animate ? 'sl-strike-anim' : undefined}
        />
      )}
    </svg>
  )
}

type WordmarkProps = {
  size?: number
  color?: string
  accent?: string
  animate?: boolean
}

export function StrikelabWordmark({ size = 22, color = TEE.ink, accent = TEE.sun, animate = false }: WordmarkProps) {
  const cls = animate ? 'sl-word-anim' : undefined
  const d = (delay: number) => (animate ? { animationDelay: `${delay}ms` } : undefined)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1,
        color,
        fontFeatureSettings: '"ss01"',
      }}
    >
      <span
        className={cls}
        style={{
          ...d(280),
          fontFamily: FONT_DISPLAY,
          fontSize: size * 1.06,
          fontWeight: 500,
          fontStyle: 'italic',
          letterSpacing: -size * 0.02,
        }}
      >
        Strike
      </span>
      <span
        className={cls}
        style={{
          ...d(360),
          fontFamily: FONT_UI,
          fontSize: size,
          fontWeight: 700,
          letterSpacing: -size * 0.04,
          marginLeft: size * 0.015,
        }}
      >
        Lab
      </span>
      <span
        className={cls}
        style={{
          ...d(520),
          fontFamily: FONT_UI,
          fontSize: size,
          fontWeight: 700,
          color: accent,
          marginLeft: -size * 0.02,
        }}
      >
        .
      </span>
    </span>
  )
}

type LogoProps = {
  size?: number
  color?: string
  showWord?: boolean
  gap?: number
  accent?: string
  variant?: 'auto' | 'ink' | 'cream'
  animate?: boolean
}

export function StrikelabLogo({
  size = 26,
  color,
  showWord = true,
  gap,
  accent,
  variant = 'auto',
  animate = false,
}: LogoProps) {
  const resolved = variant === 'auto' ? (color && color !== TEE.ink ? 'cream' : 'ink') : variant
  const inkColor = resolved === 'cream' ? TEE.cream : TEE.ink
  const arcCol = resolved === 'cream' ? TEE.cream : TEE.moss
  const ballCol = accent || TEE.sun
  const wordColor = color || inkColor
  const logoGap = gap ?? Math.round(size * 0.34)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: logoGap, lineHeight: 1 }}>
      <StrikelabMark size={size * 1.18} arcColor={arcCol} ballColor={ballCol} animate={animate} />
      {showWord && <StrikelabWordmark size={size} color={wordColor} accent={ballCol} animate={animate} />}
    </span>
  )
}
