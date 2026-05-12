import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Panel, Tag } from '@/components/ui'
import { useTeeTimes } from '@/api/courses'

/**
 * Training Plan — honest placeholder.
 *
 * The plan generator is a Phase-2 deliverable (it depends on Coach
 * Reports, which require shot data we don't have yet for new accounts).
 * Until then this page renders an empty 8-week grid with a clear "we
 * generate this from your Coach Report" message, and shows real
 * upcoming tee times pulled from `/courses/tee-times`. No fake drills,
 * no fake "Iron Compression / Week 03" mission.
 */
export default function TrainingPlan() {
  const { t, i18n } = useTranslation()
  const { data: teeTimes = [] } = useTeeTimes()

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6 flex items-end justify-between gap-8">
        <div>
          <div className="micro mb-3">{t('training.title').toUpperCase()}</div>
          <h1 className="display text-[64px] m-0">
            8-week <em>block.</em>
          </h1>
          <p className="text-body text-ink-2 mt-3 max-w-[640px]">
            {i18n.language === 'no'
              ? 'Diagnose → resept → valider. Vi bygger en åtte-ukers blokk basert på Coach-rapporten din så snart du har 3+ økter eller runder logget.'
              : 'Diagnose → prescribe → validate. We build the eight-week block from your Coach Report once you have 3+ sessions or rounds logged.'}
          </p>
        </div>
        <Link
          to="/calendar"
          className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
        >
          + {t('calendar.addTeeTime').toUpperCase()}
        </Link>
      </header>

      {/* WEEK STRIP — empty grid until the coach generates a real plan */}
      <Panel
        id="W 00/08"
        title={`${t('command.trainingWeek').toUpperCase()} — / 08`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-3 border border-line-strong text-center"
            >
              <div className="mono text-[9px] text-ink-3 tracking-micro-tight mb-2">
                W{String(i + 1).padStart(2, '0')}
              </div>
              <div className="text-[12px] text-ink-3 leading-tight">—</div>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-ink-3 mt-4">
          {i18n.language === 'no'
            ? 'Logg din første runde eller importer en økt — Coach foreslår blokk én når det er nok data.'
            : 'Log your first round or import a session — the Coach suggests block one once there is enough data.'}
        </p>
      </Panel>

      {/* TODAY + TEE TIMES */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <Panel id="TDY" title={t('common.today').toUpperCase()}>
          <p className="text-body text-ink-2">
            {i18n.language === 'no'
              ? 'Ingen øvelser planlagt for i dag.'
              : 'No drills scheduled for today.'}
          </p>
          <Link
            to="/coach/chat"
            className="block mt-4 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
          >
            {t('coach.askAnything')} →
          </Link>
        </Panel>

        <Panel id="TT" title={t('dashboard.upcomingTeeTimes').toUpperCase()}>
          {teeTimes.length === 0 ? (
            <div>
              <p className="text-body text-ink-3">
                {t('dashboard.noTeeTimes')}
              </p>
              <Link
                to="/calendar"
                className="block mt-3 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
              >
                {t('calendar.addTeeTime')} →
              </Link>
            </div>
          ) : (
            teeTimes.slice(0, 5).map((tt) => (
              <div
                key={tt.id}
                className="grid items-baseline gap-3 py-3 border-b border-line last:border-b-0"
                style={{ gridTemplateColumns: '70px 1fr auto' }}
              >
                <span className="mono text-[11px] text-ink-3">
                  {new Date(tt.tee_time)
                    .toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: 'short',
                    })
                    .toUpperCase()}
                </span>
                <span className="text-[14px] text-ink truncate">
                  {tt.course?.name ?? '—'}
                </span>
                <span className="num text-[13px] text-ink-2">
                  {new Date(tt.tee_time).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </Panel>
      </div>

      <Panel id="HOW" title={t('coach.title').toUpperCase()}>
        <div className="flex items-baseline gap-3 mb-3">
          <Tag tone="accent">PHASE 2</Tag>
          <span className="display text-[20px]">
            {i18n.language === 'no' ? 'Bygges fra Coach.' : 'Generated from Coach.'}
          </span>
        </div>
        <p className="text-body text-ink-2">
          {i18n.language === 'no'
            ? 'Når Coach-rapporten peker på én konkret feil, gjør vi om den til en åtte-ukers blokk: tre økter i uken, to on-course tester. Du kan pause, justere eller bytte fokus når som helst.'
            : 'Once the Coach Report flags one concrete fault, we turn it into an eight-week block: three sessions per week, two on-course tests. You can pause, adjust, or change the focus any time.'}
        </p>
      </Panel>
    </div>
  )
}
