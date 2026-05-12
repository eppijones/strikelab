import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCoachReports } from '@/api/coach'
import { Panel, Tag, Stat } from '@/components/ui'

export default function CoachReport() {
  useTranslation()
  const { data: reports = [], isLoading } = useCoachReports()
  const latest = reports[0]

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">HQ › REPORTS {latest && `› R-${latest.id.slice(-3).toUpperCase()}`}</div>
        <div className="flex items-end justify-between gap-8">
          <div>
            <h1 className="display text-[64px] m-0">
              {latest ? <>Coach <em>Report.</em></> : 'No reports yet.'}
            </h1>
            {latest && (
              <div className="mono text-[11px] text-ink-3 mt-3 flex items-center gap-3">
                <span>{new Date(latest.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                <span>·</span>
                <Tag>{latest.report_type.toUpperCase()}</Tag>
                <Tag tone="accent">{latest.language.toUpperCase()}</Tag>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button className="bg-transparent text-ink-2 border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3">
              Share
            </button>
            <button className="bg-transparent text-ink border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg">
              Export PDF
            </button>
            <Link
              to="/training"
              className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
            >
              Adopt Plan →
            </Link>
          </div>
        </div>
      </header>

      {isLoading && <div className="mono text-[11px] text-ink-3">LOADING REPORTS…</div>}

      {!isLoading && !latest && (
        <Panel id="EMPTY" title="NO REPORTS">
          <p className="text-body text-ink-2">
            Generate your first coach report from any session detail page.
          </p>
          <Link to="/sessions" className="mono text-[11px] text-accent-fg uppercase tracking-micro mt-3 inline-block">
            Pick a session →
          </Link>
        </Panel>
      )}

      {latest && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel id="D-01" title="DIAGNOSE" padded>
              <div className="micro mb-3">FINDINGS</div>
              <p className="text-body text-ink whitespace-pre-line">{latest.diagnosis || '—'}</p>
            </Panel>
            <Panel id="P-01" title="PRESCRIBE" padded>
              <div className="micro mb-3">DRILLS</div>
              <p className="text-body text-ink whitespace-pre-line">{latest.prescription || '—'}</p>
            </Panel>
            <Panel id="V-01" title="VALIDATE" padded>
              <div className="micro mb-3">SUCCESS METRICS</div>
              <p className="text-body text-ink whitespace-pre-line">{latest.validation || '—'}</p>
            </Panel>
          </div>

          {latest.interpretation && (
            <Panel id="WHY" title="INTERPRETATION">
              <p className="text-body text-ink-2 leading-[1.6] whitespace-pre-line">
                {latest.interpretation}
              </p>
            </Panel>
          )}

          {latest.next_best_move && (
            <Panel id="NBM" title="NEXT BEST MOVE" padded>
              <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
                <p className="serif text-[20px] text-ink leading-[1.4]">"{latest.next_best_move}"</p>
                <Link
                  to="/coach/chat"
                  className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 whitespace-nowrap"
                >
                  Discuss →
                </Link>
              </div>
            </Panel>
          )}
        </>
      )}

      {reports.length > 1 && (
        <Panel id="ARCHIVE" title="REPORT ARCHIVE">
          <div
            className="grid gap-3 items-center pb-2 border-b border-line-strong mb-2"
            style={{ gridTemplateColumns: '60px 90px 1fr 100px 60px 16px' }}
          >
            {['#', 'DATE', 'SUMMARY', 'TYPE', 'LANG', ''].map((h) => (
              <span key={h} className="mono text-[9px] text-ink-3 tracking-micro-tight">
                {h}
              </span>
            ))}
          </div>
          {reports.slice(1).map((r, i) => (
            <div
              key={r.id}
              className="grid gap-3 items-center py-2.5 border-b border-line"
              style={{ gridTemplateColumns: '60px 90px 1fr 100px 60px 16px' }}
            >
              <span className="mono text-[11px] text-ink-3">R-{String(reports.length - i - 1).padStart(3, '0')}</span>
              <span className="mono text-[11px] text-ink-2">
                {new Date(r.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
              </span>
              <span className="text-[14px] truncate">{r.diagnosis?.slice(0, 80) || '—'}</span>
              <span className="mono text-[10px] text-ink-3">{r.report_type.toUpperCase()}</span>
              <span className="mono text-[10px] text-ink-3">{r.language.toUpperCase()}</span>
              <span className="text-ink-3">›</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  )
}
