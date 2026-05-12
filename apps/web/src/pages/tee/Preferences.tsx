import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { usePreferences, useUpdatePreferences } from '@/api/tee'
import { Panel } from '@/components/ui'
import clsx from 'clsx'

const TIME_BANDS = [
  { id: 'early', label: '06–08' },
  { id: 'morning', label: '08–11' },
  { id: 'midday', label: '11–14' },
  { id: 'afternoon', label: '14–18' },
  { id: 'golden', label: '18–20' },
  { id: 'twilight', label: '20–22' },
] as const

const COURSE_TYPES = [
  'parkland',
  'links',
  'championship',
  'lakeside',
  'farmland',
  'mountain',
  'fjord',
] as const

export default function TeePreferences() {
  const { t } = useTranslation()
  const { data, isLoading } = usePreferences()
  const update = useUpdatePreferences()

  const [timeBands, setTimeBands] = useState<string[]>([])
  const [courseTypes, setCourseTypes] = useState<string[]>([])
  const [maxWind, setMaxWind] = useState<string>('')
  const [maxRain, setMaxRain] = useState<string>('')
  const [minTemp, setMinTemp] = useState<string>('')
  const [soloOnly, setSoloOnly] = useState(false)
  const [walkingOnly, setWalkingOnly] = useState(false)
  const [showToPairs, setShowToPairs] = useState(false)
  const [handicapVisible, setHandicapVisible] = useState(false)
  const [noGroupsBehind, setNoGroupsBehind] = useState<string>('')

  useEffect(() => {
    if (!data) return
    setTimeBands(data.time_bands ?? [])
    setCourseTypes(data.course_types ?? [])
    setMaxWind(data.max_wind_ms != null ? String(data.max_wind_ms) : '')
    setMaxRain(data.max_rain_pct != null ? String(Math.round(data.max_rain_pct * 100)) : '')
    setMinTemp(data.min_temp_c != null ? String(data.min_temp_c) : '')
    setSoloOnly(!!data.solo_only)
    setWalkingOnly(!!data.walking_only)
    setShowToPairs(!!data.show_to_pairs)
    setHandicapVisible(!!data.handicap_visible)
    setNoGroupsBehind(
      data.no_groups_behind_min != null ? String(data.no_groups_behind_min) : '',
    )
  }, [data])

  function toggle(setter: (v: string[]) => void, current: string[], id: string) {
    if (current.includes(id)) setter(current.filter((x) => x !== id))
    else setter([...current, id])
  }

  async function save() {
    await update.mutateAsync({
      time_bands: timeBands.length ? timeBands : null,
      course_types: courseTypes.length ? courseTypes : null,
      max_wind_ms: maxWind ? Number(maxWind) : null,
      max_rain_pct: maxRain ? Number(maxRain) / 100 : null,
      min_temp_c: minTemp ? Number(minTemp) : null,
      solo_only: soloOnly,
      walking_only: walkingOnly,
      show_to_pairs: showToPairs,
      handicap_visible: handicapVisible,
      no_groups_behind_min: noGroupsBehind ? Number(noGroupsBehind) : null,
    })
  }

  if (isLoading) {
    return <div className="text-body text-ink-3">Loading…</div>
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <header className="border-b border-line-strong pb-4">
        <Link
          to="/tee"
          className="mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-ink"
        >
          ← {t('tee.discover')}
        </Link>
        <h1 className="display text-[40px] m-0 mt-2">
          {t('tee.preferences')} <em>—</em>
        </h1>
        <p className="text-body text-ink-2 mt-2 max-w-xl">
          {t('tee.preferencesIntro')}
        </p>
      </header>

      <Panel id="P1" title={t('tee.timeBands').toUpperCase()}>
        <div className="flex flex-wrap gap-2">
          {TIME_BANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(setTimeBands, timeBands, b.id)}
              className={clsx(
                'mono text-[11px] uppercase tracking-micro px-3 py-2 border',
                timeBands.includes(b.id)
                  ? 'bg-accent text-accent-ink border-accent'
                  : 'border-line-strong text-ink-2 hover:text-ink',
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel id="P2" title={t('tee.weatherCaps').toUpperCase()}>
        <div className="grid grid-cols-3 gap-3">
          <FieldNum label={t('tee.maxWind')} value={maxWind} onChange={setMaxWind} />
          <FieldNum label={t('tee.maxRain')} value={maxRain} onChange={setMaxRain} />
          <FieldNum label={t('tee.minTemp')} value={minTemp} onChange={setMinTemp} />
        </div>
      </Panel>

      <Panel id="P3" title={t('tee.courseTypes').toUpperCase()}>
        <div className="flex flex-wrap gap-2">
          {COURSE_TYPES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle(setCourseTypes, courseTypes, c)}
              className={clsx(
                'mono text-[11px] uppercase tracking-micro px-3 py-2 border',
                courseTypes.includes(c)
                  ? 'bg-accent text-accent-ink border-accent'
                  : 'border-line-strong text-ink-2 hover:text-ink',
              )}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </Panel>

      <Panel id="P4" title="GROUP & PRIVACY">
        <div className="space-y-2">
          <Toggle label={t('tee.filterSoloOnly')} sub={t('tee.soloOnlyHelp')} value={soloOnly} onChange={setSoloOnly} />
          <Toggle label={t('tee.walkingOnly')} value={walkingOnly} onChange={setWalkingOnly} />
          <Toggle label={t('tee.showToPairs')} value={showToPairs} onChange={setShowToPairs} />
          <Toggle label={t('tee.handicapVisible')} value={handicapVisible} onChange={setHandicapVisible} />
          <FieldNum
            label={t('tee.noGroupBehindMin')}
            value={noGroupsBehind}
            onChange={setNoGroupsBehind}
          />
        </div>
      </Panel>

      <button
        type="button"
        disabled={update.isPending}
        onClick={save}
        className="bg-accent text-accent-ink px-6 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
      >
        {update.isPending ? '…' : t('tee.savePrefs')}
      </button>
    </div>
  )
}

function FieldNum({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="micro">{label.toUpperCase()}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-bg-2 border border-line-strong text-ink mono text-[13px] px-3 py-2 focus:border-accent-fg focus:outline-none"
      />
    </label>
  )
}

function Toggle({
  label,
  sub,
  value,
  onChange,
}: {
  label: string
  sub?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-accent mt-1"
      />
      <span className="flex-1">
        <span className="text-[14px] text-ink">{label}</span>
        {sub && (
          <span className="block mono text-[10.5px] text-ink-3 mt-0.5">{sub}</span>
        )}
      </span>
    </label>
  )
}
