import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAuthStore } from '@/stores/authStore'
import { useSessions } from '@/api/sessions'
import { useMyBag, useClubStats, type Club, type ClubStats } from '@/api/equipment'
import { useCourse } from '@/api/courses'
import { Panel, Stat, Tag, Spark, SLLogo } from '@/components/ui'
import { FriendsLeaderboard } from '@/components/friends/FriendsLeaderboard'

interface Breakdown {
  label: string
  value: number
}

/**
 * Performance Home — the existing cockpit, cleaned up.
 *
 * Important: every metric reads off real data. If a panel has no
 * shots / sessions / clubs to draw from, it renders a clear empty
 * state pointing at the next action ("Connect a launch monitor",
 * "Add your bag", "Log a round"). No `hasShotData ? real : demo`
 * fall-throughs.
 */
function deriveBreakdown(stats: ClubStats[]): Breakdown[] {
  if (stats.length === 0) return []
  const groups: Record<string, ClubStats[]> = {
    Tee: [],
    Approach: [],
    Short: [],
    Putt: [],
  }
  for (const stat of stats) {
    const label = (stat.club_label || '').toLowerCase()
    if (/driver|drv|3w|5w|wood|hybrid|hy/.test(label)) {
      groups.Tee.push(stat)
    } else if (/wedge|w\b|gw|sw|lw|°/.test(label)) {
      groups.Short.push(stat)
    } else if (/put/.test(label)) {
      groups.Putt.push(stat)
    } else {
      groups.Approach.push(stat)
    }
  }
  const score = (s: ClubStats[]): number => {
    if (s.length === 0) return 0
    const total = s.reduce((acc, x) => acc + (x.total_shots || 0), 0)
    if (total === 0) return 0
    const good = s.reduce((acc, x) => acc + (x.good_shots || 0), 0)
    return Math.round((good / total) * 100)
  }
  return [
    { label: 'Tee', value: score(groups.Tee) },
    { label: 'Approach', value: score(groups.Approach) },
    { label: 'Short', value: score(groups.Short) },
    { label: 'Putt', value: score(groups.Putt) },
  ]
}

function clubBagSnapshot(clubs: Club[], stats: ClubStats[]) {
  const sorted = [...clubs].sort((a, b) => a.sort_order - b.sort_order)
  return sorted.slice(0, 6).map((club) => {
    const stat = stats.find((s) => s.club_label === club.club_label)
    return {
      id: club.id,
      label: (club.club_label || club.club_type).toUpperCase(),
      carry: stat?.avg_carry ?? null,
      shots: stat?.total_shots ?? 0,
      ok: (stat?.total_shots ?? 0) > 0,
    }
  })
}

export default function HomePerformance() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: sessionsData } = useSessions({ limit: 5 })
  const { data: bag } = useMyBag()
  const { data: stats = [] } = useClubStats()
  const { data: homeClub } = useCourse(user?.homeClubId ?? '')

  const sessions = sessionsData?.sessions ?? []
  const playerName =
    user?.displayName?.split(' ').map((p, i) => (i === 0 ? `${p[0]}.` : p)).join(' ') ??
    'Player'
  const hcp = user?.handicapIndex
  const targetHcp = user?.goalHandicap

  const clubs = bag?.clubs ?? []
  const bagSnapshot = clubBagSnapshot(clubs, stats)
  const breakdown = deriveBreakdown(stats)
  const hasShotData = stats.some((s) => (s.total_shots ?? 0) > 0)
  const driverStat = stats.find((s) => /driver|drv/i.test(s.club_label))
  const sevenIronStat = stats.find((s) => /^7i$|7 iron/i.test(s.club_label))

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* LEFT RAIL */}
      <aside className="flex flex-col gap-4">
        <Panel title="PLAYER" padded={false}>
          <div className="p-4">
            <div className="micro">
              {homeClub ? homeClub.name.toUpperCase() : 'PLAYER'}
            </div>
            <div className="display text-[28px] mt-1.5">{playerName}</div>
            <div className="mono text-[11px] text-ink-3 mt-1.5">
              HCP {hcp != null ? hcp.toFixed(1) : '—'}
              {targetHcp != null && ` · TARGET ${targetHcp.toFixed(1)}`}
            </div>
          </div>
          <hr className="rule" />
          <div className="p-4">
            <div className="micro mb-2.5">{t('command.breakdown').toUpperCase()}</div>
            {breakdown.length === 0 ? (
              <p className="text-body text-ink-3">
                Import shots to populate strokes-gained breakdown.
                <Link
                  to="/connectors"
                  className="block mono text-[10px] text-accent-fg mt-2 uppercase tracking-micro hover:underline"
                >
                  CONNECT A SOURCE →
                </Link>
              </p>
            ) : (
              breakdown.map(({ label, value }) => (
                <div
                  key={label}
                  className="grid items-center gap-2 mb-2"
                  style={{ gridTemplateColumns: '60px 1fr 36px' }}
                >
                  <span className="mono text-[10px] text-ink-2">
                    {label.toUpperCase()}
                  </span>
                  <div className="h-1 bg-bg-2">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                    />
                  </div>
                  <span className="num text-[13px]">{value || '—'}</span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title={t('command.activeBag').toUpperCase()}
          right={
            <Link
              to="/my-bag"
              className="mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
            >
              EDIT →
            </Link>
          }
        >
          {bagSnapshot.length === 0 ? (
            <div>
              <p className="text-body text-ink-3 mb-3">
                Build your bag to see clubs here.
              </p>
              <Link
                to="/my-bag"
                className="mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
              >
                ADD YOUR FIRST CLUB →
              </Link>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {bagSnapshot.map(({ id, label, carry, ok }) => (
                <div
                  key={id}
                  className="grid items-center gap-3"
                  style={{ gridTemplateColumns: '34px 1fr auto' }}
                >
                  <span className="mono text-[11px] text-ink-3 tracking-micro-tight">
                    {label}
                  </span>
                  <span className="num text-[16px]">
                    {carry != null ? carry.toFixed(0) : '—'}
                    {carry != null && (
                      <span className="mono text-[10px] text-ink-3 ml-1">YDS</span>
                    )}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ok ? 'bg-accent' : 'bg-warn'
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </Panel>

        <FriendsLeaderboard />
      </aside>

      {/* MAIN COLUMN */}
      <section className="grid gap-4">
        {/* PRIORITY MISSION — only shown when we have real data to base it on */}
        {hasShotData ? (
          <Panel
            title={t('command.priorityToday').toUpperCase()}
            padded={false}
          >
            <div className="p-7 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
              <div>
                <div className="flex items-center gap-3 mb-3.5">
                  <Tag tone="accent">PERFORMANCE</Tag>
                  {homeClub && <Tag>{homeClub.name.toUpperCase()}</Tag>}
                </div>
                <h2 className="display text-[56px] m-0">
                  {t('coach.nextBestMove')}
                </h2>
                <p className="text-[15px] text-ink-2 leading-[1.55] mt-3.5 max-w-[480px]">
                  Open the latest Coach Report — it pinpoints the one metric worth fixing this week.
                </p>
                <div className="flex gap-3 mt-6">
                  <Link
                    to="/coach"
                    className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
                  >
                    {t('coach.title')} →
                  </Link>
                  <Link
                    to="/coach/chat"
                    className="bg-transparent text-ink-2 border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3"
                  >
                    {t('coach.askAnything')}
                  </Link>
                </div>
              </div>

              <div className="border-l border-line-strong pl-6">
                <div className="micro mb-3.5">
                  {t('command.trajectory').toUpperCase()}
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <Stat
                    label={t('command.current')}
                    value={hcp != null ? hcp.toFixed(1) : '—'}
                  />
                  <Stat
                    label={t('command.projection')}
                    value={targetHcp != null ? targetHcp.toFixed(1) : '—'}
                  />
                </div>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel title={t('command.priorityToday').toUpperCase()} padded={false}>
            <div className="p-7">
              <div className="flex items-center gap-3 mb-3.5">
                <Tag>PERFORMANCE</Tag>
              </div>
              <h2 className="display text-[44px] m-0">
                Bring some <em>data.</em>
              </h2>
              <p className="text-[15px] text-ink-2 leading-[1.55] mt-3.5 max-w-[520px]">
                Import a CSV from your launch monitor (TrackMan / GSPro / SkyTrak / Garmin) or sync the iPhone Caddie. The cockpit lights up the moment you have something to measure.
              </p>
              <div className="flex gap-3 mt-6">
                <Link
                  to="/connectors"
                  className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
                >
                  {t('connectors.title')} →
                </Link>
                <Link
                  to="/play"
                  className="bg-transparent text-ink-2 border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3"
                >
                  {t('caddie.newRound')} →
                </Link>
              </div>
            </div>
          </Panel>
        )}

        {/* METRIC GRID — driven entirely by real club stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricPanel
            id="M 01"
            title={t('command.carryDriver').toUpperCase()}
            label={t('command.lastFifty').toUpperCase()}
            unit="YDS"
            value={driverStat?.avg_carry ?? null}
          />
          <MetricPanel
            id="M 02"
            title={t('command.dispersion').toUpperCase()}
            label="σ · 7i"
            unit="YDS"
            value={sevenIronStat?.dispersion_radius ?? null}
          />
          <MetricPanel
            id="M 03"
            title={t('command.girLast5').toUpperCase()}
            label={t('command.greensReg').toUpperCase()}
            unit="%"
            value={null}
            placeholder="LOG ROUNDS →"
            placeholderTo="/play"
          />
          <MetricPanel
            id="M 04"
            title={t('command.strokesGained').toUpperCase()}
            label={`${t('command.vsHcp').toUpperCase()}`}
            unit=""
            value={null}
            placeholder="IMPORT SESSION →"
            placeholderTo="/connectors"
          />
        </div>

        {/* RECENT SESSIONS */}
        <Panel
          title={t('dashboard.recentSessions').toUpperCase()}
          right={
            <span className="mono text-[10px] text-ink-3 tracking-micro-tight">
              {t('command.showing').toUpperCase()} {sessions.length}
            </span>
          }
        >
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-ink-3 text-body">
              <p>{t('dashboard.noSessions')}</p>
              <Link
                to="/connectors"
                className="mono text-[11px] text-accent-fg uppercase tracking-micro mt-3 inline-block"
              >
                {t('dashboard.importSession')} →
              </Link>
            </div>
          ) : (
            <>
              <div
                className="grid gap-3 items-center pb-1.5 border-b border-line-strong mb-1.5"
                style={{
                  gridTemplateColumns: '50px 80px 1fr 60px 60px',
                }}
              >
                {['#', 'DATE', 'SESSION', 'SHOTS', 'SOURCE'].map((h) => (
                  <span
                    key={h}
                    className="mono text-[9px] text-ink-3 tracking-micro-tight"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {sessions.slice(0, 5).map((s, i) => (
                <Link
                  key={s.id}
                  to={`/sessions/${s.id}`}
                  className="grid gap-3 items-center py-2.5 border-b border-line hover:bg-bg-2 transition-colors"
                  style={{
                    gridTemplateColumns: '50px 80px 1fr 60px 60px',
                  }}
                >
                  <span className="mono text-[11px] text-ink-3">
                    {String(sessions.length - i).padStart(3, '0')}
                  </span>
                  <span className="mono text-[11px] text-ink-2">
                    {new Date(s.session_date)
                      .toLocaleDateString(undefined, {
                        month: 'short',
                        day: '2-digit',
                      })
                      .toUpperCase()}
                  </span>
                  <span className="text-[14px] truncate">{s.name || s.source}</span>
                  <span className="num text-[13px] text-ink-2">{s.shot_count ?? 0}</span>
                  <span className="mono text-[9px] text-ink-3 tracking-micro-tight">
                    {s.source.toUpperCase()}
                  </span>
                </Link>
              ))}
            </>
          )}
        </Panel>

        <Panel title={t('command.aiAlways').toUpperCase()} padded={false}>
          <div className="flex items-center px-5 py-4 gap-4">
            <div className="w-9 h-9 border border-accent-fg flex items-center justify-center text-accent-fg">
              <SLLogo size={18} />
            </div>
            <span className="serif text-[14px] text-ink-2">
              {hasShotData
                ? 'Open Coach Reports for the latest diagnose / prescribe / validate breakdown.'
                : 'I\'ll start surfacing patterns the moment you bring data — a CSV import or a logged round will do.'}
            </span>
            <Link
              to="/coach/chat"
              className="ml-auto bg-transparent text-accent-fg border border-accent-fg px-4 py-2.5 mono text-[11px] uppercase tracking-micro hover:bg-accent hover:text-accent-ink whitespace-nowrap"
            >
              {t('coach.askAnything').split(' ').slice(0, 2).join(' ')} →
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  )
}

function MetricPanel({
  id,
  title,
  label,
  unit,
  value,
  placeholder,
  placeholderTo,
}: {
  id: string
  title: string
  label: string
  unit: string
  value: number | null
  placeholder?: string
  placeholderTo?: string
}) {
  if (value == null) {
    return (
      <Panel id={id} title={title}>
        <Stat label={label} value="—" unit={unit} />
        <div className="mt-3.5">
          <Spark data={[0, 0, 0, 0, 0, 0]} w={220} h={42} fill />
        </div>
        {placeholder && placeholderTo && (
          <Link
            to={placeholderTo}
            className="mono text-[10px] text-accent-fg uppercase tracking-micro mt-2 inline-block hover:underline"
          >
            {placeholder}
          </Link>
        )}
      </Panel>
    )
  }
  return (
    <Panel id={id} title={title}>
      <Stat label={label} value={value.toFixed(1)} unit={unit} />
    </Panel>
  )
}
