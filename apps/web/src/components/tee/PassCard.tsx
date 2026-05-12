import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PassResponse } from '@/api/tee'
import { HeroLandscape, HeroKind } from './HeroLandscape'

interface Props {
  pass: PassResponse
  compact?: boolean
}

const KIND_MAP: Record<string, HeroKind> = {
  parkland: 'parkland',
  links: 'links',
  championship: 'championship',
  lakeside: 'lakeside',
  farmland: 'farmland',
  mountain: 'mountain',
  fjord: 'fjord',
}

export function PassCard({ pass, compact }: Props) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState(pass.countdown_seconds)

  useEffect(() => {
    setSecondsLeft(pass.countdown_seconds)
  }, [pass.countdown_seconds])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  const teeTime = new Date(pass.tee_time)
  const hh = teeTime.getHours().toString().padStart(2, '0')
  const mm = teeTime.getMinutes().toString().padStart(2, '0')
  const datestr = teeTime.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

  const kind = KIND_MAP[pass.course_type ?? ''] ?? 'parkland'

  return (
    <div className="bg-surface-solid border border-line-strong rounded-[2px] overflow-hidden relative">
      <div className="relative" style={{ height: compact ? 60 : 100 }}>
        <HeroLandscape kind={kind} height={compact ? 60 : 100} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-2/80" />
        <div className="absolute left-3 top-2 micro text-ink-3">
          {[pass.course_city, pass.course_region]
            .filter(Boolean)
            .join(' · ')
            .toUpperCase()}
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="display text-[24px] m-0">{pass.course_name}</div>
        <div className="mt-3 py-3 border-t border-b border-line-strong flex items-baseline justify-between gap-4">
          <div>
            <div className="micro">{t('tee.yourTeeTime')}</div>
            <div className="display text-[40px] mt-1">
              {hh}:{mm}
            </div>
            <div className="mono text-[10px] uppercase tracking-micro text-ink-3 mt-0.5">
              {datestr}
            </div>
          </div>
          <div className="text-right">
            <div className="micro">{t('tee.readyIn')}</div>
            <div className="display text-[24px] text-accent-fg mt-1 mono">
              {formatCountdown(secondsLeft)}
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="py-3 border-b border-line-strong">
          <div className="flex items-center gap-3">
            <div className="flex">
              {pass.players.map((p, i) => (
                <div
                  key={i}
                  className="w-7 h-7 mono text-[11px] flex items-center justify-center"
                  style={{
                    background: p.is_you ? 'var(--accent)' : 'var(--surface-2)',
                    color: p.is_you ? 'var(--accent-ink)' : 'var(--ink)',
                    border: '2px solid var(--surface-solid)',
                    marginLeft: i === 0 ? 0 : -8,
                  }}
                >
                  {p.initials}
                </div>
              ))}
            </div>
            <div className="flex-1 mono text-[11px] text-ink-2 truncate">
              {pass.players.map((p) => p.name).join(' · ')}
            </div>
          </div>
        </div>

        {/* Forecast at tee time */}
        <div className="py-3 flex items-center gap-3 mono text-[11.5px] text-ink-2">
          {pass.forecast_temp_c != null && <span>{Math.round(pass.forecast_temp_c)}°</span>}
          {pass.forecast_wind_ms != null && (
            <span>
              {Math.round(pass.forecast_wind_ms)} m/s {pass.forecast_wind_dir ?? ''}
            </span>
          )}
          <span
            className={
              pass.forecast_state === 'rain'
                ? 'text-bad'
                : pass.forecast_state === 'showers'
                ? 'text-warn'
                : 'text-accent-fg'
            }
          >
            {(pass.forecast_state ?? 'dry').toUpperCase()}
          </span>
          {pass.drive_min != null && (
            <span className="ml-auto">DRIVE {pass.drive_min} MIN</span>
          )}
        </div>
      </div>

      {/* Perforated divider */}
      <div className="relative h-5">
        <div
          className="absolute -left-2.5 top-0 w-5 h-5 rounded-full"
          style={{ background: 'var(--bg)' }}
        />
        <div
          className="absolute -right-2.5 top-0 w-5 h-5 rounded-full"
          style={{ background: 'var(--bg)' }}
        />
        <div
          className="absolute left-3 right-3 top-2.5 border-t border-dashed"
          style={{ borderColor: 'var(--line-strong)' }}
        />
      </div>

      {/* QR + check-in code */}
      {!compact && pass.check_in_code && (
        <div className="px-4 pb-4 pt-2 flex items-center gap-4">
          <FauxQR />
          <div>
            <div className="micro">{t('tee.shareCode')}</div>
            <div className="mono text-[20px] tracking-widest mt-1 text-ink">
              {pass.check_in_code}
            </div>
            <div className="mono text-[10.5px] text-ink-3 mt-1">
              {t('tee.showAtProShop')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatCountdown(s: number) {
  if (s <= 0) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}t ${m}m`
  return `${m}m`
}

function FauxQR({ size = 80 }: { size?: number }) {
  const cells = 17
  const cellSize = size / cells
  const rng = (seed: number) => {
    let n = seed
    return () => {
      n = (n * 9301 + 49297) % 233280
      return n / 233280
    }
  }
  const r = rng(1)
  const rects: JSX.Element[] = []
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const inFinder =
        (x < 7 && y < 7) ||
        (x >= cells - 7 && y < 7) ||
        (x < 7 && y >= cells - 7)
      let on = false
      if (inFinder) {
        on =
          x === 0 ||
          y === 0 ||
          x === 6 ||
          y === 6 ||
          x === cells - 7 ||
          x === cells - 1 ||
          y === cells - 7 ||
          y === cells - 1 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
          (x >= cells - 5 && x <= cells - 3 && y >= 2 && y <= 4) ||
          (x >= 2 && x <= 4 && y >= cells - 5 && y <= cells - 3)
      } else {
        on = r() > 0.55
      }
      if (on) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x * cellSize}
            y={y * cellSize}
            width={cellSize}
            height={cellSize}
            fill="var(--ink)"
          />,
        )
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <rect width={size} height={size} fill="var(--bg-2)" />
      {rects}
    </svg>
  )
}
