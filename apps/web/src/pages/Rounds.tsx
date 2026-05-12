import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRounds } from '@/api/rounds'
import { Panel, Tag } from '@/components/ui'

export default function Rounds() {
  const { t } = useTranslation()
  const { data: rounds = [], isLoading, isError } = useRounds()

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">PLAY › ROUNDS</div>
        <h1 className="display text-[64px] m-0">
          On-course <em>history.</em>
        </h1>
        <p className="text-body text-ink-2 mt-3">
          Every round, every hole, every shot. Synced from the StrikeLab Caddie iOS app.
        </p>
      </header>

      {(isLoading || isError) && (
        <Panel id="WAIT" title="STATUS">
          <p className="text-body text-ink-2">
            {isError
              ? 'Caddie API not reachable. Start the backend and pair your iOS app.'
              : 'Loading rounds…'}
          </p>
        </Panel>
      )}

      {!isLoading && !isError && rounds.length === 0 && (
        <Panel id="EMPTY" title="NO ROUNDS YET">
          <p className="text-body text-ink-2">
            {t('rounds.noRounds')}
          </p>
          <Link to="/play" className="mono text-[11px] text-accent-fg uppercase tracking-micro mt-3 inline-block">
            Open Play surface →
          </Link>
        </Panel>
      )}

      {rounds.length > 0 && (
        <Panel id="RNDS" title="ALL ROUNDS" right={<span className="micro">{rounds.length} ROWS</span>}>
          <div
            className="grid gap-3 items-center pb-2 border-b border-line-strong mb-2"
            style={{ gridTemplateColumns: '60px 90px 1fr 80px 80px 80px 80px 16px' }}
          >
            {['#', 'DATE', 'COURSE', 'GROSS', 'NET', 'vs PAR', 'STATUS', ''].map((h) => (
              <span key={h} className="mono text-[9px] text-ink-3 tracking-micro-tight">
                {h}
              </span>
            ))}
          </div>
          {rounds.map((r, i) => {
            const vsPar = r.total_gross - r.total_par
            return (
              <Link
                key={r.id}
                to={`/rounds/${r.id}`}
                className="grid gap-3 items-center py-2.5 border-b border-line hover:bg-bg-2 transition-colors"
                style={{ gridTemplateColumns: '60px 90px 1fr 80px 80px 80px 80px 16px' }}
              >
                <span className="mono text-[11px] text-ink-3">
                  R-{String(rounds.length - i).padStart(3, '0')}
                </span>
                <span className="mono text-[11px] text-ink-2">
                  {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' }).toUpperCase()}
                </span>
                <span className="text-[14px] text-ink">{r.course_name}</span>
                <span className="num text-[13px]">{r.total_gross}</span>
                <span className="num text-[13px] text-ink-2">{r.total_net}</span>
                <span className={`num text-[13px] ${vsPar > 0 ? 'text-warn' : vsPar < 0 ? 'text-accent-fg' : 'text-ink-3'}`}>
                  {vsPar > 0 ? '+' : ''}
                  {vsPar}
                </span>
                <Tag tone={r.is_complete ? 'accent' : 'warn'}>
                  {r.is_complete ? t('rounds.complete').toUpperCase() : t('rounds.inProgress').toUpperCase()}
                </Tag>
                <span className="text-ink-3">›</span>
              </Link>
            )
          })}
        </Panel>
      )}
    </div>
  )
}
