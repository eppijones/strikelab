import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSessions } from '@/api/sessions'
import { Panel, Stat, Spark } from '@/components/ui'

type TimeRange = '7d' | '30d' | '90d' | 'all'

const RANGES: TimeRange[] = ['7d', '30d', '90d', 'all']

export default function Stats() {
  useTranslation()
  const { data: sessionsData } = useSessions({ limit: 100 })
  const [range, setRange] = useState<TimeRange>('30d')

  const cutoff = useMemo(() => {
    if (range === 'all') return null
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    return new Date(Date.now() - days * 86400000)
  }, [range])

  const filtered = useMemo(() => {
    const sessions = sessionsData?.sessions || []
    return sessions
      .filter((s) => !cutoff || new Date(s.session_date) >= cutoff)
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
  }, [sessionsData, cutoff])

  /**
   * Pull the real per-session score series from the API. Sessions
   * without a computed score are dropped — we don't fabricate "70"
   * anymore, so the chart is honest about how much data backs it.
   */
  const series = (
    key:
      | 'strike_score'
      | 'face_control_score'
      | 'distance_control_score'
      | 'dispersion_score',
  ) =>
    filtered
      .map((s) => s.computed_stats?.[key])
      .filter((v): v is number => typeof v === 'number')

  function avg(arr: number[]) {
    if (!arr.length) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6 flex items-end justify-between gap-8">
        <div>
          <div className="micro mb-3">HQ › STATS</div>
          <h1 className="display text-[64px] m-0">
            By the <em>numbers.</em>
          </h1>
          <p className="text-body text-ink-2 mt-3">
            Trends across {filtered.length} session{filtered.length === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="flex border border-line-strong">
          {RANGES.map((r, i) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`mono text-[10px] uppercase tracking-micro px-3 py-2 ${
                i < RANGES.length - 1 ? 'border-r border-line-strong' : ''
              } ${range === r ? 'ui-selected' : 'text-ink-3 hover:text-ink hover:bg-bg-2'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'M 01', label: 'STRIKE', key: 'strike_score' as const },
          { id: 'M 02', label: 'FACE', key: 'face_control_score' as const },
          { id: 'M 03', label: 'DISTANCE', key: 'distance_control_score' as const },
          { id: 'M 04', label: 'DISPERSION', key: 'dispersion_score' as const },
        ].map((m) => {
          const data = series(m.key)
          return (
            <Panel key={m.id} id={m.id} title={m.label}>
              <Stat
                label="AVG"
                value={data.length ? avg(data).toFixed(1) : '—'}
                unit={data.length ? '/100' : ''}
              />
              <div className="mt-3.5">
                {data.length > 0 ? (
                  <Spark data={data} w={220} h={42} fill />
                ) : (
                  <Spark data={[0, 0, 0, 0, 0, 0]} w={220} h={42} fill />
                )}
              </div>
            </Panel>
          )
        })}
      </div>

      <Panel id="LOG" title="SESSION TIMELINE">
        {filtered.length === 0 && (
          <div className="text-body text-ink-3">No sessions in selected range.</div>
        )}
        <div
          className="grid gap-3 items-center pb-2 border-b border-line-strong mb-2"
          style={{ gridTemplateColumns: '90px 1fr 60px 60px 60px 60px' }}
        >
          {['DATE', 'SESSION', 'STRIKE', 'FACE', 'DIST', 'DISP'].map((h) => (
            <span key={h} className="mono text-[9px] text-ink-3 tracking-micro-tight">
              {h}
            </span>
          ))}
        </div>
        {filtered.map((s) => (
          <div
            key={s.id}
            className="grid gap-3 items-center py-2.5 border-b border-line"
            style={{ gridTemplateColumns: '90px 1fr 60px 60px 60px 60px' }}
          >
            <span className="mono text-[11px] text-ink-2">
              {new Date(s.session_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
            </span>
            <span className="text-[14px]">{s.name || s.source}</span>
            <span className="num text-[13px]">{Math.round(s.computed_stats?.strike_score ?? 0) || '—'}</span>
            <span className="num text-[13px]">{Math.round(s.computed_stats?.face_control_score ?? 0) || '—'}</span>
            <span className="num text-[13px]">{Math.round(s.computed_stats?.distance_control_score ?? 0) || '—'}</span>
            <span className="num text-[13px]">{Math.round(s.computed_stats?.dispersion_score ?? 0) || '—'}</span>
          </div>
        ))}
      </Panel>
    </div>
  )
}
