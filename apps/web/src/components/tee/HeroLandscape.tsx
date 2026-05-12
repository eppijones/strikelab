import { CSSProperties } from 'react'

/**
 * Editorial course hero, redrawn for StrikeLab's dark instrument theme.
 *
 * Each course type renders a different SVG composition (parkland / links /
 * championship / lakeside / farmland / mountain / fjord). The palette is
 * pulled from the `--ink-*` and `--accent` tokens so it sits naturally on
 * `--bg`/`--surface-solid` without warm paper undertones.
 *
 * The flag is the single signal-lime accent in the artwork; everything else
 * is graphite + ink ramp.
 */

export type HeroKind =
  | 'parkland'
  | 'links'
  | 'championship'
  | 'lakeside'
  | 'farmland'
  | 'mountain'
  | 'fjord'

interface HeroProps {
  kind?: HeroKind
  height?: number | string
  className?: string
  style?: CSSProperties
  ariaLabel?: string
}

const W = 400
const H = 220

export function HeroLandscape({
  kind = 'parkland',
  height = 220,
  className,
  style,
  ariaLabel,
}: HeroProps) {
  const Renderer =
    {
      parkland: ParklandHero,
      links: LinksHero,
      championship: ChampionshipHero,
      lakeside: LakesideHero,
      farmland: FarmlandHero,
      mountain: MountainHero,
      fjord: FjordHero,
    }[kind] ?? ParklandHero

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={ariaLabel ?? `${kind} landscape`}
      style={{
        display: 'block',
        width: '100%',
        height,
        background: 'var(--bg-2)',
        ...style,
      }}
      className={className}
    >
      <Renderer />
    </svg>
  )
}

const FLAG = 'var(--accent)'
const INK = 'var(--ink)'
const INK_2 = 'var(--ink-2)'
const INK_3 = 'var(--ink-3)'
const INK_4 = 'var(--ink-4)'
const SURFACE = 'var(--surface-solid)'
const BG = 'var(--bg)'
const BG_2 = 'var(--bg-2)'
const LINE = 'var(--line-strong)'

function Sky({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={BG_2} />
      <stop offset="1" stopColor={BG} />
    </linearGradient>
  )
}

function ParklandHero() {
  return (
    <>
      <defs>
        <Sky id="hero-pl-sky" />
        <linearGradient id="hero-pl-fwy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK_3} stopOpacity="0.55" />
          <stop offset="1" stopColor={INK_4} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#hero-pl-sky)" />
      {/* far hills */}
      <path
        d="M0,150 C80,130 140,140 220,135 C290,130 340,150 400,140 L400,220 L0,220 Z"
        fill={INK_4}
        opacity="0.6"
      />
      {/* mid hills */}
      <path
        d="M0,165 C70,155 140,170 200,160 C280,150 340,175 400,165 L400,220 L0,220 Z"
        fill={INK_3}
        opacity="0.7"
      />
      {/* fairway */}
      <path
        d="M0,200 C100,190 200,210 300,195 C340,190 380,205 400,200 L400,220 L0,220 Z"
        fill="url(#hero-pl-fwy)"
      />
      {/* tree silhouettes */}
      {[40, 90, 320, 365].map((cx, i) => (
        <g key={i} opacity={0.85}>
          <ellipse cx={cx} cy={150 - (i % 2) * 8} rx={18 - (i % 2) * 3} ry={28 - (i % 2) * 4} fill={INK} opacity="0.6" />
          <rect x={cx - 1} y={150} width={2} height={18} fill={INK} opacity="0.6" />
        </g>
      ))}
      {/* flag */}
      <g transform="translate(255,178)">
        <line x1="0" y1="0" x2="0" y2="-22" stroke={INK} strokeWidth="1" />
        <path d="M0,-22 L9,-19 L0,-15 Z" fill={FLAG} />
        <circle cx="0" cy="2" r="3" fill={INK_3} stroke={INK} strokeOpacity="0.2" />
      </g>
    </>
  )
}

function LinksHero() {
  return (
    <>
      <defs>
        <Sky id="hero-lk-sky" />
        <linearGradient id="hero-lk-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK_3} stopOpacity="0.55" />
          <stop offset="1" stopColor={INK_4} stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#hero-lk-sky)" />
      <rect x="0" y="120" width={W} height="40" fill="url(#hero-lk-sea)" />
      <line x1="0" y1="120" x2={W} y2="120" stroke={LINE} />
      <path
        d="M0,156 C80,162 140,158 220,164 C290,168 340,160 400,162 L400,162 L0,162 Z"
        fill={INK_2}
        opacity="0.18"
      />
      <path
        d="M0,170 C60,160 120,180 180,168 C240,156 320,182 400,170 L400,220 L0,220 Z"
        fill={INK_3}
        opacity="0.7"
      />
      <path
        d="M0,186 C70,182 130,196 220,184 C290,176 360,196 400,188 L400,220 L0,220 Z"
        fill={INK_4}
        opacity="0.7"
      />
      {[60, 110, 210, 280, 340].map((x, i) => (
        <g key={i} stroke={INK_2} strokeWidth="0.8" opacity="0.6">
          <line x1={x} y1={172} x2={x - 2} y2={166} />
          <line x1={x + 2} y1={172} x2={x + 1} y2={163} />
          <line x1={x + 4} y1={172} x2={x + 5} y2={167} />
        </g>
      ))}
      <g transform="translate(295,176)">
        <line x1="0" y1="0" x2="0" y2="-18" stroke={INK} strokeWidth="0.8" />
        <path d="M0,-18 L7,-15 L0,-12 Z" fill={FLAG} />
      </g>
    </>
  )
}

function ChampionshipHero() {
  return (
    <>
      <defs>
        <Sky id="hero-ch-sky" />
        <linearGradient id="hero-ch-fwy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK_3} stopOpacity="0.55" />
          <stop offset="1" stopColor={INK_4} stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="hero-ch-lake" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor={INK_3} stopOpacity="0.6" />
          <stop offset="1" stopColor={INK_4} stopOpacity="0.4" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#hero-ch-sky)" />
      <path
        d="M0,140 C100,130 200,138 300,132 C350,128 380,140 400,135 L400,220 L0,220 Z"
        fill={INK_4}
        opacity="0.6"
      />
      <path
        d="M0,158 C100,150 200,168 320,154 C360,150 390,162 400,160 L400,220 L0,220 Z"
        fill={INK_3}
        opacity="0.7"
      />
      <ellipse cx="200" cy="195" rx="120" ry="14" fill="url(#hero-ch-lake)" />
      <ellipse cx="200" cy="195" rx="120" ry="14" fill="none" stroke={LINE} />
      <ellipse cx="200" cy="194" rx="22" ry="6" fill="url(#hero-ch-fwy)" />
      <g transform="translate(200,189)">
        <line x1="0" y1="0" x2="0" y2="-20" stroke={INK} strokeWidth="0.8" />
        <path d="M0,-20 L8,-17 L0,-14 Z" fill={FLAG} />
      </g>
      <ellipse cx="80" cy="208" rx="22" ry="4" fill={SURFACE} />
      <ellipse cx="330" cy="210" rx="28" ry="5" fill={SURFACE} />
      {[20, 50, 360, 388].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={148} rx={14} ry={20} fill={INK} opacity="0.5" />
          <rect x={cx - 1} y={148} width={2} height={12} fill={INK} opacity="0.5" />
        </g>
      ))}
    </>
  )
}

function LakesideHero() {
  return (
    <>
      <defs>
        <Sky id="hero-lks-sky" />
        <linearGradient id="hero-lks-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK_3} stopOpacity="0.6" />
          <stop offset="1" stopColor={INK_4} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#hero-lks-sky)" />
      <path
        d="M0,135 C80,115 160,135 240,120 C320,105 380,130 400,125 L400,165 L0,165 Z"
        fill={INK_3}
        opacity="0.6"
      />
      <rect x="0" y="165" width={W} height={H - 165} fill="url(#hero-lks-water)" />
      {[180, 195, 205].map((y, i) => (
        <line
          key={i}
          x1="20"
          y1={y}
          x2={W - 20}
          y2={y}
          stroke={INK_2}
          strokeOpacity={0.18 - i * 0.04}
          strokeWidth="0.7"
        />
      ))}
      <path
        d="M0,210 C80,202 200,214 320,206 C360,202 390,212 400,210 L400,220 L0,220 Z"
        fill={INK_3}
        opacity="0.55"
      />
      {[15, 50, 95, 340, 380].map((cx, i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={130 - (i % 2) * 4}
          rx={10}
          ry={16}
          fill={INK}
          opacity="0.4"
        />
      ))}
      <g transform="translate(360,148)">
        <line x1="0" y1="0" x2="0" y2="-12" stroke={INK} strokeWidth="0.8" />
        <path d="M0,-12 L6,-10 L0,-8 Z" fill={FLAG} />
      </g>
    </>
  )
}

function FarmlandHero() {
  return (
    <>
      <defs>
        <Sky id="hero-fm-sky" />
      </defs>
      <rect width={W} height={H} fill="url(#hero-fm-sky)" />
      <path
        d="M0,135 C80,125 160,140 240,128 C320,116 380,138 400,130 L400,220 L0,220 Z"
        fill={INK_4}
        opacity="0.55"
      />
      <path
        d="M0,162 C90,154 180,170 280,158 C340,150 390,164 400,162 L400,220 L0,220 Z"
        fill={INK_3}
        opacity="0.6"
      />
      <path d="M0,195 L400,195 L400,220 L0,220 Z" fill={INK_3} opacity="0.4" />
      {[200, 205, 210, 215].map((y, i) => (
        <line
          key={i}
          x1="0"
          y1={y}
          x2={W}
          y2={y}
          stroke={LINE}
          strokeOpacity={0.5 - i * 0.1}
        />
      ))}
      <g transform="translate(280,178)">
        <line x1="0" y1="0" x2="0" y2="-18" stroke={INK} strokeWidth="0.8" />
        <path d="M0,-18 L7,-15 L0,-12 Z" fill={FLAG} />
      </g>
    </>
  )
}

function MountainHero() {
  return (
    <>
      <defs>
        <Sky id="hero-mt-sky" />
      </defs>
      <rect width={W} height={H} fill="url(#hero-mt-sky)" />
      <polygon points="0,150 80,80 140,120 220,60 300,100 380,70 400,90 400,220 0,220" fill={INK_4} opacity="0.7" />
      <polygon points="0,165 100,120 180,150 260,110 340,150 400,140 400,220 0,220" fill={INK_3} opacity="0.7" />
      <path
        d="M0,200 C100,190 200,210 300,195 C340,190 380,205 400,200 L400,220 L0,220 Z"
        fill={INK_3}
        opacity="0.4"
      />
      {/* snow caps */}
      <polygon points="80,80 100,90 70,95" fill={INK} opacity="0.25" />
      <polygon points="220,60 245,75 200,80" fill={INK} opacity="0.25" />
      <g transform="translate(260,180)">
        <line x1="0" y1="0" x2="0" y2="-18" stroke={INK} strokeWidth="0.8" />
        <path d="M0,-18 L7,-15 L0,-12 Z" fill={FLAG} />
      </g>
    </>
  )
}

function FjordHero() {
  return (
    <>
      <defs>
        <Sky id="hero-fj-sky" />
      </defs>
      <rect width={W} height={H} fill="url(#hero-fj-sky)" />
      <polygon points="0,160 60,90 120,130 200,70 280,110 360,80 400,110 400,160" fill={INK_4} opacity="0.7" />
      <rect x="0" y="155" width={W} height="40" fill={INK_3} opacity="0.45" />
      {[170, 180, 190].map((y, i) => (
        <line
          key={i}
          x1="20"
          y1={y}
          x2={W - 20}
          y2={y}
          stroke={INK_2}
          strokeOpacity={0.18 - i * 0.04}
        />
      ))}
      <path
        d="M0,200 C100,196 200,206 300,200 C340,198 380,204 400,202 L400,220 L0,220 Z"
        fill={INK_3}
        opacity="0.4"
      />
      <g transform="translate(310,196)">
        <line x1="0" y1="0" x2="0" y2="-12" stroke={INK} strokeWidth="0.8" />
        <path d="M0,-12 L6,-10 L0,-8 Z" fill={FLAG} />
      </g>
    </>
  )
}
