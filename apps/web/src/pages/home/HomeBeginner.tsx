import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Panel, SLLogo, Tag } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useTeeTimes, useCourse } from '@/api/courses'
import { useRounds } from '@/api/rounds'
import { FriendsLeaderboard } from '@/components/friends/FriendsLeaderboard'

/**
 * Beginner Home — the friendliest surface in the app.
 *
 * Three cards: a "today" hero (pick a course / book a tee time),
 * "last round" (or invite the user to log one), friends. No metrics,
 * no charts, no fake AI quote until they have data. Everything routes
 * to a single next action.
 */
export default function HomeBeginner() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: teeTimes = [] } = useTeeTimes()
  const { data: rounds = [] } = useRounds()
  const { data: homeClub } = useCourse(user?.homeClubId ?? '')

  const greetingName = user?.displayName?.split(' ')[0] ?? 'Player'
  const nextTee = teeTimes[0]
  const lastRound = rounds[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* MAIN COLUMN */}
      <section className="grid gap-4">
        <Panel title={t('dashboard.welcome').toUpperCase()} padded={false}>
          <div className="p-7">
            <div className="mono text-[10px] uppercase tracking-micro text-ink-3 mb-3">
              {homeClub
                ? homeClub.name.toUpperCase()
                : t('onboarding.homeClub').toUpperCase()}
            </div>
            <h1 className="display text-[56px] m-0">
              Hi <em>{greetingName}.</em>
            </h1>
            <p className="text-[15px] text-ink-2 leading-[1.55] mt-3.5 max-w-[520px]">
              {homeClub
                ? `Welcome back. Your home is ${homeClub.name}. Add a score, book a round, or check in with friends.`
                : 'Pick a home club so we can show yardages, tee times and stats tailored to where you actually play.'}
            </p>
            <div className="flex gap-3 mt-6 flex-wrap">
              {homeClub ? (
                <Link
                  to={`/courses/${homeClub.id}`}
                  className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
                >
                  Open {homeClub.name} →
                </Link>
              ) : (
                <Link
                  to="/courses"
                  className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
                >
                  {t('courses.title')} →
                </Link>
              )}
              <Link
                to="/calendar"
                className="bg-transparent text-ink-2 border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3"
              >
                {t('calendar.addTeeTime')} →
              </Link>
            </div>
          </div>
        </Panel>

        <div className="grid md:grid-cols-2 gap-4">
          <Panel title={t('dashboard.nextRound').toUpperCase()}>
            {nextTee ? (
              <div>
                <div className="display text-[28px]">
                  {new Date(nextTee.tee_time).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
                <div className="mono text-[12px] text-ink-2 mt-1">
                  {new Date(nextTee.tee_time).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {nextTee.course && (
                  <div className="text-[13px] text-ink-3 mt-2">
                    {nextTee.course.name}
                  </div>
                )}
                <Link
                  to="/calendar"
                  className="block mt-4 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
                >
                  {t('common.viewMore')} →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-body text-ink-2">
                  {t('dashboard.noTeeTimes')}
                </p>
                <Link
                  to="/calendar"
                  className="block mt-4 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
                >
                  {t('calendar.addTeeTime')} →
                </Link>
              </div>
            )}
          </Panel>

          <Panel title={t('rounds.title').toUpperCase()}>
            {lastRound ? (
              <div>
                <div className="display text-[28px]">
                  {lastRound.total_gross} <span className="mono text-[12px] text-ink-3">strokes</span>
                </div>
                <div className="text-[13px] text-ink-2 mt-1">
                  {lastRound.course_name}
                </div>
                <div className="mono text-[10px] text-ink-3 uppercase tracking-micro mt-2">
                  {new Date(lastRound.date).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
                <Link
                  to={`/rounds/${lastRound.id}`}
                  className="block mt-4 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
                >
                  {t('rounds.viewDetails')} →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-body text-ink-2">{t('rounds.noRounds')}</p>
                <Link
                  to="/rounds"
                  className="block mt-4 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
                >
                  {t('rounds.newRound')} →
                </Link>
              </div>
            )}
          </Panel>
        </div>

        <Panel title="STRIKELAB · ALWAYS THERE" padded={false}>
          <div className="flex items-center px-5 py-4 gap-4">
            <div className="w-9 h-9 border border-accent-fg flex items-center justify-center text-accent-fg">
              <SLLogo size={18} />
            </div>
            <span className="serif text-[14px] text-ink-2">
              No pressure. Tap any course, log a score after your next round, and we'll start showing real numbers when you've got something to show.
            </span>
            <Tag tone="accent" className="ml-auto">BEGINNER</Tag>
          </div>
        </Panel>
      </section>

      {/* SIDE RAIL */}
      <aside className="grid gap-4 content-start">
        <FriendsLeaderboard />
      </aside>
    </div>
  )
}
