import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Panel, Stat, SLLogo, Tag } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useTeeTimes, useCourse } from '@/api/courses'
import { useRounds } from '@/api/rounds'
import { useSessions } from '@/api/sessions'
import { FriendsLeaderboard } from '@/components/friends/FriendsLeaderboard'

/**
 * Improver Home — between beginner and full cockpit.
 *
 * Adds:
 *  - Real handicap card (current + goal, from `users.handicap_index`).
 *  - Last 5 rounds table (from `/rounds`).
 *  - Friends widget on the right rail.
 *
 * Importantly: every metric panel renders honest empty states. We never
 * fabricate a number to fill space. If the player has zero rounds and
 * zero sessions, this screen reads as a clear next-step list.
 */
export default function HomeImprover() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: teeTimes = [] } = useTeeTimes()
  const { data: rounds = [] } = useRounds()
  const { data: sessionsData } = useSessions({ limit: 5 })
  const sessions = sessionsData?.sessions ?? []
  const { data: homeClub } = useCourse(user?.homeClubId ?? '')

  const greetingName = user?.displayName?.split(' ')[0] ?? 'Player'
  const hcp = user?.handicapIndex
  const goal = user?.goalHandicap
  const last5 = rounds.slice(0, 5)
  const nextTee = teeTimes[0]
  const hasAnyData = rounds.length > 0 || sessions.length > 0

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="grid gap-4">
        {/* HERO */}
        <Panel title={t('dashboard.welcome').toUpperCase()} padded={false}>
          <div className="p-7 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
            <div>
              <div className="mono text-[10px] uppercase tracking-micro text-ink-3 mb-3">
                {homeClub ? homeClub.name.toUpperCase() : 'NO HOME CLUB SET'}
              </div>
              <h1 className="display text-[56px] m-0">
                {greetingName}, <em>let's move it.</em>
              </h1>
              <p className="text-[15px] text-ink-2 leading-[1.55] mt-3.5 max-w-[520px]">
                {hasAnyData
                  ? 'Your latest rounds and sessions are below. Pick the next thing to work on.'
                  : 'Once you log a round or import a session, your handicap trend and patterns appear here.'}
              </p>
              <div className="flex gap-3 mt-6 flex-wrap">
                <Link
                  to="/play"
                  className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
                >
                  {t('caddie.newRound')} →
                </Link>
                <Link
                  to="/sessions"
                  className="bg-transparent text-ink-2 border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3"
                >
                  {t('sessions.title')} →
                </Link>
              </div>
            </div>

            <div className="border-l border-line-strong pl-6">
              <div className="micro mb-3.5">{t('dashboard.currentIndex').toUpperCase()}</div>
              <div className="grid grid-cols-2 gap-3.5">
                <Stat
                  label={t('command.current').toUpperCase()}
                  value={hcp != null ? hcp.toFixed(1) : '—'}
                />
                <Stat
                  label={t('dashboard.targetHandicap').toUpperCase()}
                  value={goal != null ? goal.toFixed(1) : '—'}
                />
              </div>
              {hcp == null && (
                <Link
                  to="/settings"
                  className="block mt-4 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
                >
                  ADD YOUR HANDICAP →
                </Link>
              )}
            </div>
          </div>
        </Panel>

        {/* QUICK CARDS */}
        <div className="grid md:grid-cols-3 gap-4">
          <Panel title={t('dashboard.nextRound').toUpperCase()}>
            {nextTee ? (
              <div>
                <div className="display text-[24px]">
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
              </div>
            ) : (
              <div>
                <p className="text-body text-ink-3">{t('dashboard.noTeeTimes')}</p>
                <Link
                  to="/calendar"
                  className="block mt-3 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
                >
                  {t('calendar.addTeeTime')} →
                </Link>
              </div>
            )}
          </Panel>

          <Panel title={t('rounds.title').toUpperCase()}>
            <Stat
              label={t('dashboard.totalSessions').toUpperCase()}
              value={rounds.length}
            />
            <Link
              to="/rounds"
              className="block mt-4 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
            >
              {t('common.viewMore')} →
            </Link>
          </Panel>

          <Panel title={t('connectors.title').toUpperCase()}>
            <Stat
              label={t('sessions.title').toUpperCase()}
              value={sessions.length}
            />
            <Link
              to="/connectors"
              className="block mt-4 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
            >
              {sessions.length === 0
                ? t('connectors.connect').toUpperCase() + ' →'
                : t('common.viewMore').toUpperCase() + ' →'}
            </Link>
          </Panel>
        </div>

        {/* RECENT ROUNDS */}
        <Panel
          title={t('dashboard.recentRounds').toUpperCase()}
          right={
            rounds.length > 0 ? (
              <Link
                to="/rounds"
                className="mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
              >
                {t('common.viewMore').toUpperCase()} →
              </Link>
            ) : null
          }
        >
          {last5.length === 0 ? (
            <div className="py-10 text-center text-ink-3">
              <p className="text-body">{t('rounds.noRounds')}</p>
              <Link
                to="/play"
                className="mono text-[11px] text-accent-fg uppercase tracking-micro mt-3 inline-block"
              >
                {t('caddie.newRound')} →
              </Link>
            </div>
          ) : (
            <div>
              <div
                className="grid gap-3 items-center pb-1.5 border-b border-line-strong mb-1.5"
                style={{
                  gridTemplateColumns: '60px 1fr 60px 60px',
                }}
              >
                {['DATE', 'COURSE', 'GROSS', 'PAR'].map((h) => (
                  <span
                    key={h}
                    className="mono text-[9px] text-ink-3 tracking-micro-tight"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {last5.map((r) => (
                <Link
                  key={r.id}
                  to={`/rounds/${r.id}`}
                  className="grid gap-3 items-center py-2.5 border-b border-line hover:bg-bg-2 transition-colors"
                  style={{
                    gridTemplateColumns: '60px 1fr 60px 60px',
                  }}
                >
                  <span className="mono text-[11px] text-ink-2">
                    {new Date(r.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: '2-digit',
                    }).toUpperCase()}
                  </span>
                  <span className="text-[14px] truncate">{r.course_name}</span>
                  <span className="num text-[13px]">{r.total_gross}</span>
                  <span className="num text-[13px] text-ink-3">{r.total_par}</span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={t('coach.title').toUpperCase()} padded={false}>
          <div className="flex items-center px-5 py-4 gap-4">
            <div className="w-9 h-9 border border-accent-fg flex items-center justify-center text-accent-fg">
              <SLLogo size={18} />
            </div>
            <span className="serif text-[14px] text-ink-2">
              {hasAnyData
                ? "Once you've got 3+ rounds logged, I'll point at the one number worth fixing this week."
                : 'Log your first round or import a launch monitor session, and I\'ll start surfacing patterns here.'}
            </span>
            <Tag tone="accent" className="ml-auto">IMPROVER</Tag>
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
