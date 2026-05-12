import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession, useSessionShots } from '@/api/sessions'
import { Panel, Stat, Tag } from '@/components/ui'

type Tab = 'shots' | 'trends' | 'log' | 'raw'

export default function SessionDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: session, isLoading: loadingSession } = useSession(id)
  const { data: shots = [], isLoading: loadingShots } = useSessionShots(id)
  const [tab, setTab] = useState<Tab>('shots')

  if (loadingSession || !session) {
    return <div className="mono text-[11px] text-ink-3">LOADING SESSION…</div>
  }

  const carries = shots.map((s) => s.carry_distance).filter((v): v is number => typeof v === 'number')
  const offsets = shots.map((s) => s.offline_distance).filter((v): v is number => typeof v === 'number')
  const avgCarry = carries.length ? carries.reduce((a, b) => a + b, 0) / carries.length : 0
  const sigma = (() => {
    if (!offsets.length) return 0
    const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length
    const variance = offsets.reduce((a, b) => a + (b - mean) ** 2, 0) / offsets.length
    return Math.sqrt(variance)
  })()
  const smashAvg = (() => {
    const arr = shots.map((s) => s.smash_factor).filter((v): v is number => typeof v === 'number')
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  })()
  const sessionDate = new Date(session.session_date)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to="/" className="hover:text-ink">HQ</Link> ›{' '}
          <Link to="/sessions" className="hover:text-ink">SESSIONS</Link> ›{' '}
          <span className="text-ink">S-{session.id.slice(-4).toUpperCase()}</span>
        </div>
        <div className="flex items-end justify-between gap-8">
          <div>
            <h1 className="display text-[64px] m-0">{session.name || 'Session'}</h1>
            <div className="mono text-[11px] text-ink-3 mt-3 flex items-center gap-3">
              <span>{sessionDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
              <span>·</span>
              <span>{shots.length} SHOTS</span>
              <span>·</span>
              <Tag>{session.source.toUpperCase()}</Tag>
              <Tag>{session.session_type.toUpperCase()}</Tag>
            </div>
          </div>
          <Link
            to={`/sessions/${id}/log`}
            className="bg-transparent text-ink border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg"
          >
            Open Session Log →
          </Link>
        </div>
      </header>

      {/* TAB STRIP */}
      <nav className="flex border border-line-strong w-fit">
        {(['shots', 'trends', 'log', 'raw'] as const).map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`mono text-[10px] uppercase tracking-micro px-5 py-2.5 ${
              i < 3 ? 'border-r border-line-strong' : ''
            } ${tab === t ? 'ui-selected' : 'text-ink-3 hover:text-ink hover:bg-bg-2'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel id="S 01" title="AVG CARRY">
          <Stat label="OVERALL" value={avgCarry.toFixed(1)} unit="YDS" />
        </Panel>
        <Panel id="S 02" title="DISPERSION">
          <Stat label="σ · L+R" value={sigma.toFixed(1)} unit="YDS" deltaTone="neutral" />
        </Panel>
        <Panel id="S 03" title="SMASH FACTOR">
          <Stat label="AVG" value={smashAvg.toFixed(2)} />
        </Panel>
        <Panel id="S 04" title="MISHITS">
          <Stat
            label="FLAGGED"
            value={shots.filter((s) => s.is_mishit).length}
            unit="SHOTS"
            deltaTone="warn"
          />
        </Panel>
      </div>

      {/* TAB CONTENT */}
      {tab === 'shots' && (
        <Panel id="SHOTS" title="SHOT-BY-SHOT">
          {loadingShots && <div className="mono text-[11px] text-ink-3">LOADING…</div>}
          {!loadingShots && shots.length === 0 && (
            <div className="py-8 text-center text-ink-3">No shots in this session.</div>
          )}
          <div
            className="grid gap-3 items-center pb-2 border-b border-line-strong mb-2"
            style={{ gridTemplateColumns: '50px 60px 70px 70px 70px 70px 60px 16px' }}
          >
            {['#', 'CLUB', 'CARRY', 'TOTAL', 'BALL SPD', 'SMASH', 'OFFLINE', ''].map((h) => (
              <span key={h} className="mono text-[9px] text-ink-3 tracking-micro-tight">
                {h}
              </span>
            ))}
          </div>
          {shots.map((s) => (
            <div
              key={s.id}
              className="grid gap-3 items-center py-2.5 border-b border-line"
              style={{ gridTemplateColumns: '50px 60px 70px 70px 70px 70px 60px 16px' }}
            >
              <span className="mono text-[11px] text-ink-3">{String(s.shot_number).padStart(3, '0')}</span>
              <span className="mono text-[11px] text-ink-2">{s.club}</span>
              <span className="num text-[13px]">{s.carry_distance?.toFixed(0) ?? '—'}</span>
              <span className="num text-[13px]">{s.total_distance?.toFixed(0) ?? '—'}</span>
              <span className="num text-[13px]">{s.ball_speed?.toFixed(0) ?? '—'}</span>
              <span className="num text-[13px]">{s.smash_factor?.toFixed(2) ?? '—'}</span>
              <span className={`num text-[13px] ${s.is_mishit ? 'text-warn' : ''}`}>
                {s.offline_distance != null ? `${s.offline_distance > 0 ? 'R' : 'L'}${Math.abs(s.offline_distance).toFixed(0)}` : '—'}
              </span>
              <span className="text-ink-3">{s.is_mishit ? '!' : ''}</span>
            </div>
          ))}
        </Panel>
      )}

      {tab === 'trends' && (
        <Panel id="TRENDS" title="SHOT TRENDS">
          <div className="text-body text-ink-2">Trend chart placeholder — wired in next iteration.</div>
        </Panel>
      )}

      {tab === 'log' && (
        <Panel id="LOG" title="SUBJECTIVE LOG">
          <div className="text-body text-ink-2">
            Subjective notes live on the Session Log page.{' '}
            <Link to={`/sessions/${id}/log`} className="text-accent-fg">
              Open log →
            </Link>
          </div>
        </Panel>
      )}

      {tab === 'raw' && (
        <Panel id="RAW" title="RAW DATA">
          <pre className="mono text-[11px] text-ink-2 overflow-auto">
            {JSON.stringify(session.computed_stats, null, 2)}
          </pre>
        </Panel>
      )}
    </div>
  )
}
