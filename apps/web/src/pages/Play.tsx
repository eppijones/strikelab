import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTeeTimes } from '@/api/courses'
import { useRounds } from '@/api/rounds'
import { Panel, Stat, Tag } from '@/components/ui'

export default function Play() {
  const { t } = useTranslation()
  const { data: teeTimes = [] } = useTeeTimes()
  const { data: rounds = [] } = useRounds()
  const next = teeTimes[0]

  // Filter to rounds played in the current calendar year so the
  // "ROUNDS · YEAR" tile is honest. The Rounds API returns ISO dates
  // so a year compare is enough.
  const yearRounds = rounds.filter(
    (r) => new Date(r.date).getFullYear() === new Date().getFullYear(),
  )

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">{t('shell.play').toUpperCase()}</div>
        <h1 className="display text-[64px] m-0">
          On-course <em>missions.</em>
        </h1>
        <p className="text-body text-ink-2 mt-3">
          {t('rounds.title')}. {t('booking.title')}. {t('caddie.title')}.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel id="NEXT" title={t('dashboard.upcomingTeeTimes').toUpperCase()}>
          {next ? (
            <>
              <div className="micro mb-2">{t('caddie.title').toUpperCase()}</div>
              <div className="display text-[40px]">
                {new Date(next.tee_time)
                  .toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
                  .toUpperCase()}
              </div>
              <div className="mono text-[14px] text-ink-2 mt-2">
                {new Date(next.tee_time).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="mt-4">
                <Tag tone="accent">{(next.status ?? 'planned').toUpperCase()}</Tag>
              </div>
              <Link
                to="/tee"
                className="block mt-6 text-center bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
              >
                {t('shell.tee', { defaultValue: 'TEE' })} →
              </Link>
            </>
          ) : (
            <>
              <p className="text-body text-ink-2">{t('dashboard.noTeeTimes')}</p>
              <Link
                to="/tee"
                className="block mt-4 text-center bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
              >
                {t('tee.bestNow')} →
              </Link>
            </>
          )}
        </Panel>

        <Panel id="ROUNDS" title={t('rounds.title').toUpperCase()}>
          <Stat
            label={t('stats.last30Days').toUpperCase()}
            value={yearRounds.length}
            unit={t('rounds.title').toUpperCase()}
          />
          <Link
            to="/rounds"
            className="block mt-6 text-center bg-transparent text-ink border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg"
          >
            {t('common.viewMore')} →
          </Link>
        </Panel>

        <Panel id="CADDIE" title={t('caddie.title').toUpperCase()}>
          <div className="micro mb-2">DEVICE</div>
          <div className="display text-[24px]">
            Pair <em>watch.</em>
          </div>
          <p className="text-body text-ink-2 mt-2">
            Open the StrikeLab Caddie app on iPhone, then start a round to mirror it to your Apple Watch.
          </p>
        </Panel>
      </div>

      {/* COURSES SHORTCUT */}
      <Panel id="CRS" title="COURSES">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="display text-[28px]">
              Browse the <em>course library.</em>
            </div>
            <p className="text-body text-ink-2 mt-2">
              Norwegian, Nordic, and international courses with verified slope/CR ratings.
            </p>
          </div>
          <Link
            to="/courses"
            className="bg-transparent text-ink border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg"
          >
            Open →
          </Link>
        </div>
      </Panel>
    </div>
  )
}
