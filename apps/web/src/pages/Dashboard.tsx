import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel, Stat, Tag } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useCourse, useTeeTimes } from '@/api/courses'
import { useRounds } from '@/api/rounds'
import { useSessions } from '@/api/sessions'
import { useRangeSessionsList } from '@/api/rangeSessions'
import { useClubStats, useMyBag } from '@/api/equipment'

export default function Dashboard() {
  const { i18n } = useTranslation()
  const isNo = i18n.language === 'no'
  const user = useAuthStore((s) => s.user)
  const { data: homeClub } = useCourse(user?.homeClubId ?? '')
  const { data: teeTimes = [] } = useTeeTimes()
  const { data: rounds = [] } = useRounds()
  const { data: sessionsData } = useSessions({ limit: 4 })
  const { data: rangeData } = useRangeSessionsList()
  const { data: bag } = useMyBag()
  const { data: clubStats = [] } = useClubStats()

  const firstName = user?.displayName?.split(' ')[0] ?? 'Player'
  const nextTee = teeTimes[0]
  const latestRound = rounds[0]
  const connectorSessions = sessionsData?.sessions ?? []
  const rangeSessions = rangeData?.sessions ?? []
  const latestPractice = rangeSessions[0] ?? connectorSessions[0]
  const clubCount = bag?.clubs?.length ?? 0
  const clubsWithData = clubStats.filter((s) => (s.total_shots ?? 0) > 0).length
  const nextAction = nextTee
    ? {
        eyebrow: isNo ? 'Neste runde' : 'Next round',
        title: nextTee.course?.name ?? (isNo ? 'Klar for runde?' : 'Ready to play?'),
        body: `${new Date(nextTee.tee_time).toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
        })} · ${new Date(nextTee.tee_time).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        to: '/play',
        cta: isNo ? 'Åpne spill' : 'Open play',
      }
    : latestPractice
    ? {
        eyebrow: isNo ? 'Siste økt' : 'Latest practice',
        title: isNo ? 'Se hva du trente på.' : 'Review what you practiced.',
        body: `${latestPractice.shot_count ?? 0} ${isNo ? 'slag' : 'shots'}`,
        to: '/practice',
        cta: isNo ? 'Åpne økter' : 'Open sessions',
      }
    : {
        eyebrow: isNo ? 'Kom i gang' : 'Start here',
        title: isNo ? 'Last opp din første rangeøkt.' : 'Upload your first range session.',
        body: isNo
          ? 'Koble iPhone Caddie eller importer en JSON/CSV når du er ferdig på rangen.'
          : 'Connect iPhone Caddie or import JSON/CSV after your next range bucket.',
        to: '/practice',
        cta: isNo ? 'Start practice' : 'Start practice',
      }

  const activity = [
    ...rounds.slice(0, 3).map((r) => ({
      id: `round-${r.id}`,
      date: r.date,
      label: r.course_name,
      meta: `${r.total_gross} / ${r.total_par}`,
      tag: isNo ? 'Runde' : 'Round',
      to: `/rounds/${r.id}`,
    })),
    ...rangeSessions.slice(0, 3).map((s) => ({
      id: `range-${s.id}`,
      date: s.start_time ?? s.updated_at,
      label: s.location || (isNo ? 'Rangeøkt' : 'Range session'),
      meta: `${s.shot_count} ${isNo ? 'slag' : 'shots'}`,
      tag: isNo ? 'Økt' : 'Practice',
      to: `/practice/${encodeURIComponent(s.id)}`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <Panel title={isNo ? 'HJEM' : 'HOME'} padded={false} className="overflow-hidden">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-7">
              <div className="micro mb-3">
                {homeClub ? homeClub.name.toUpperCase() : isNo ? 'INGEN HJEMMEKLUBB' : 'NO HOME CLUB'}
              </div>
              <h1 className="display text-[clamp(2.75rem,7vw,5.75rem)] m-0">
                {firstName}, <em>{isNo ? 'klar?' : 'ready?'}</em>
              </h1>
              <p className="text-[15px] text-ink-2 leading-[1.55] mt-4 max-w-xl">
                {isNo
                  ? 'StrikeLab holder styr på runder, rangeøkter, baner og bagen din. Én tydelig neste ting, resten ligger rolig under.'
                  : 'StrikeLab keeps your rounds, range sessions, courses, and bag together. One clear next thing, with the rest calmly underneath.'}
              </p>
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-line-strong p-7 bg-bg-2/40">
              <div className="micro mb-3">{nextAction.eyebrow}</div>
              <div className="display text-[34px] leading-none">{nextAction.title}</div>
              <p className="text-body text-ink-2 mt-3">{nextAction.body}</p>
              <Link
                to={nextAction.to}
                className="inline-flex mt-6 bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
              >
                {nextAction.cta} →
              </Link>
            </div>
          </div>
        </Panel>

        <div className="grid md:grid-cols-4 gap-4">
          <Panel title={isNo ? 'RUNDER' : 'ROUNDS'}>
            <Stat label={isNo ? 'LOGGET' : 'LOGGED'} value={rounds.length} size="sm" />
          </Panel>
          <Panel title={isNo ? 'PRACTICE' : 'PRACTICE'}>
            <Stat label={isNo ? 'ØKTER' : 'SESSIONS'} value={rangeSessions.length + connectorSessions.length} size="sm" />
          </Panel>
          <Panel title={isNo ? 'BAG' : 'BAG'}>
            <Stat label={isNo ? 'KØLLER' : 'CLUBS'} value={clubCount} unit="/14" size="sm" />
          </Panel>
          <Panel title={isNo ? 'DATA' : 'DATA'}>
            <Stat label={isNo ? 'KØLLER MED DATA' : 'CLUBS WITH DATA'} value={clubsWithData} size="sm" />
          </Panel>
        </div>

        <Panel
          title={isNo ? 'SISTE AKTIVITET' : 'RECENT ACTIVITY'}
          right={
            <Link to="/practice" className="mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline">
              {isNo ? 'Last opp økt' : 'Upload session'} →
            </Link>
          }
        >
          {activity.length === 0 ? (
            <div className="py-10 text-center">
              <div className="display text-[26px]">
                {isNo ? 'Ingen data ennå.' : 'No data yet.'}
              </div>
              <p className="text-body text-ink-3 mt-2">
                {isNo
                  ? 'Logg en runde på iPhone eller last opp en rangeøkt når du er klar.'
                  : 'Log a round on iPhone or upload a range session when you are ready.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {activity.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className="grid grid-cols-[84px_1fr_auto_20px] gap-3 items-center py-3 hover:bg-bg-2"
                >
                  <span className="mono text-[11px] text-ink-3">
                    {new Date(item.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-[14px] text-ink truncate">{item.label}</span>
                  <span className="flex items-center gap-2">
                    <Tag>{item.tag}</Tag>
                    <span className="mono text-[11px] text-ink-3">{item.meta}</span>
                  </span>
                  <span className="text-ink-3">›</span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <aside className="space-y-4">
        <Panel title={isNo ? 'BAG' : 'BAG'} className="glow">
          <div className="display text-[30px]">
            {clubCount ? `${clubCount}/14` : isNo ? 'Bygg bagen.' : 'Build your bag.'}
          </div>
          <p className="text-body text-ink-2 mt-3">
            {clubCount
              ? isNo
                ? `${clubsWithData} køller har range-data. Vi fyller inn carry og spredning etter hvert.`
                : `${clubsWithData} clubs have range data. Carry and dispersion fill in as you practice.`
              : isNo
              ? 'Legg inn driver, jern, wedger og putter. Det tar fem minutter.'
              : 'Add driver, irons, wedges, and putter. It takes five minutes.'}
          </p>
          <Link
            to="/bag"
            className="inline-flex mt-5 border border-line-strong px-4 py-2.5 mono text-[11px] uppercase tracking-micro text-ink hover:border-accent-fg hover:text-accent-fg"
          >
            {isNo ? 'Åpne bag' : 'Open bag'} →
          </Link>
        </Panel>

        <Panel title={isNo ? 'BANER' : 'COURSES'}>
          <div className="display text-[28px]">
            {homeClub ? homeClub.name : isNo ? 'Finn hjemmebanen.' : 'Find your home course.'}
          </div>
          <p className="text-body text-ink-2 mt-3">
            {isNo
              ? 'Norske baner, scorekort, fasiliteter og favoritter samlet ett sted.'
              : 'Norwegian courses, scorecards, facilities, and favorites in one place.'}
          </p>
          <Link
            to="/courses"
            className="inline-flex mt-5 border border-line-strong px-4 py-2.5 mono text-[11px] uppercase tracking-micro text-ink hover:border-accent-fg hover:text-accent-fg"
          >
            {isNo ? 'Åpne baner' : 'Open courses'} →
          </Link>
        </Panel>

        <Panel title={isNo ? 'INNSIKT · DENNE UKA' : 'INSIGHT · THIS WEEK'}>
          <p className="serif text-[20px] text-ink leading-snug">
            {isNo
              ? 'Vi sier mer når vi har sett noen runder og økter. Ingen mas, vi venter.'
              : "We'll say more once we have seen a few rounds and sessions. No nagging, we'll wait."}
          </p>
        </Panel>
      </aside>
    </div>
  )
}
