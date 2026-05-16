import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessions } from '@/api/sessions'
import { useRangeSessionsList } from '@/api/rangeSessions'
import type { RangeSessionApiListItem } from '@/api/rangeSessions'
import { Panel, Tag } from '@/components/ui'

const SOURCES = ['ALL', 'TRACKMAN', 'FORESIGHT', 'TOPGOLF', 'GSPRO', 'CSV', 'CADDIE'] as const

type SessionKind = 'connector' | 'range'

interface UnifiedSessionRow {
  kind: SessionKind
  id: string
  source: string
  session_type: string
  name?: string | null
  session_date: string
  shot_count: number
  computed_stats?: { strike_score?: number }
}

function rangeToRow(r: RangeSessionApiListItem): UnifiedSessionRow {
  const when = r.start_time ?? r.updated_at
  const label =
    r.location?.trim() ||
    `Driving range · ${new Date(when).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
  return {
    kind: 'range',
    id: r.id,
    source: 'caddie',
    session_type: 'range',
    name: label,
    session_date: when,
    shot_count: r.shot_count,
  }
}

export default function Sessions() {
  const { t } = useTranslation()
  const [source, setSource] = useState<(typeof SOURCES)[number]>('ALL')
  const { data, isLoading: loadingConnector } = useSessions({ limit: 50 })
  const { data: rangeData, isLoading: loadingRange } = useRangeSessionsList()
  const rangeList = rangeData?.sessions ?? []
  const rangeLoadError = rangeData?.error ?? null

  const sessions = data?.sessions || []

  const merged = useMemo((): UnifiedSessionRow[] => {
    const connectorRows: UnifiedSessionRow[] = sessions.map((s) => ({
      kind: 'connector' as const,
      id: s.id,
      source: s.source,
      session_type: s.session_type,
      name: s.name,
      session_date: s.session_date,
      shot_count: s.shot_count ?? 0,
      computed_stats: s.computed_stats,
    }))
    const rangeRows: UnifiedSessionRow[] = rangeList.map(rangeToRow)
    return [...rangeRows, ...connectorRows].sort(
      (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime(),
    )
  }, [sessions, rangeList])

  const filtered = useMemo(() => {
    if (source === 'ALL') return merged
    if (source === 'CADDIE') {
      return merged.filter(
        (r) => r.kind === 'range' || r.source.toUpperCase() === 'CADDIE',
      )
    }
    return merged.filter((r) => r.kind === 'connector' && r.source.toUpperCase() === source)
  }, [merged, source])

  const isLoading = loadingConnector || loadingRange

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between border-b border-line-strong pb-4">
        <div>
          <div className="micro">{t('sessions.title').toUpperCase()}</div>
          <h1 className="display text-[64px] mt-2">Sessions</h1>
          <p className="text-body text-ink-2 mt-2">
            Every range bucket, sim block, and on-course round is a measurement.
          </p>
        </div>
        <div className="flex border border-line-strong">
          {SOURCES.map((s, i) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`mono text-[10px] uppercase tracking-micro px-3 py-2 ${
                i < SOURCES.length - 1 ? 'border-r border-line-strong' : ''
              } ${source === s ? 'ui-selected' : 'text-ink-3 hover:text-ink hover:bg-bg-2'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {rangeLoadError ? (
        <p className="text-warn mono text-[11px] max-w-3xl">
          Caddie range sessions: {rangeLoadError}
        </p>
      ) : null}

      <Panel title="ALL SESSIONS" right={<span className="micro">{filtered.length} ROWS</span>}>
        <div
          className="grid gap-3 items-center pb-2 border-b border-line-strong mb-2"
          style={{ gridTemplateColumns: '60px 90px 1fr 80px 80px 100px 60px 16px' }}
        >
          {['#', 'DATE', 'SESSION', 'TYPE', 'SHOTS', 'SOURCE', 'STATS', ''].map((h) => (
            <span key={h} className="mono text-[9px] text-ink-3 tracking-micro-tight">
              {h}
            </span>
          ))}
        </div>
        {isLoading && <div className="py-8 text-center text-ink-3 mono text-[11px]">LOADING…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <p className="text-body text-ink-3">No sessions match this filter.</p>
            {source === 'CADDIE' ? (
              <p className="text-body text-ink-3 text-[13px] max-w-md mx-auto">
                Caddie driving-range data lives under <strong className="text-ink">Range Lab</strong> until it is synced
                from the iPhone (signed in with the same account). Import a JSON export from the phone, or open Range
                Lab after a sync.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/practice"
                className="mono text-[11px] text-accent-fg uppercase tracking-micro inline-block border border-accent-fg px-4 py-2 hover:bg-bg-2"
              >
                Practice — import / view →
              </Link>
              <Link
                to="/connectors"
                className="mono text-[11px] text-accent-fg uppercase tracking-micro inline-block"
              >
                Connectors — import →
              </Link>
            </div>
          </div>
        )}
        {filtered.map((s, i) => {
          const stats = s.computed_stats
          const href = s.kind === 'range' ? `/lab/range/${encodeURIComponent(s.id)}` : `/sessions/${s.id}`
          return (
            <Link
              key={`${s.kind}-${s.id}`}
              to={href}
              className="grid gap-3 items-center py-3 border-b border-line hover:bg-bg-2 transition-colors"
              style={{ gridTemplateColumns: '60px 90px 1fr 80px 80px 100px 60px 16px' }}
            >
              <span className="mono text-[11px] text-ink-3">
                {String(filtered.length - i).padStart(3, '0')}
              </span>
              <span className="mono text-[11px] text-ink-2">
                {new Date(s.session_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: '2-digit',
                }).toUpperCase()}
              </span>
              <span className="text-[14px] text-ink">{s.name || '—'}</span>
              <Tag>{s.session_type.toUpperCase()}</Tag>
              <span className="num text-[13px] text-ink-2">{s.shot_count ?? 0}</span>
              <span className="mono text-[10px] text-ink-3 tracking-micro-tight">
                {s.source.toUpperCase()}
              </span>
              <span className="num text-[12px] text-ink-2">
                {stats?.strike_score ? Math.round(stats.strike_score) : '—'}
              </span>
              <span className="text-ink-3">›</span>
            </Link>
          )
        })}
      </Panel>
    </div>
  )
}
