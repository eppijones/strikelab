import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useFriends, useCreateInvite, useFriendCompare } from '@/api/auth'
import { usePlaymates } from '@/api/tee'
import { useAuthStore } from '@/stores/authStore'
import { Panel, Stat, Tag } from '@/components/ui'

export default function Friends() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: friends = [], isLoading } = useFriends()
  const createInvite = useCreateInvite()

  const accepted = friends.filter((f) => (f.status ?? 'accepted') === 'accepted')
  const sortedFriends = useMemo(
    () =>
      [...accepted].sort(
        (a, b) => (a.handicap_index ?? 99) - (b.handicap_index ?? 99),
      ),
    [accepted],
  )

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [compareWith, setCompareWith] = useState<string | null>(null)
  const compare = useFriendCompare(compareWith)

  // Norwegian-first share text — falls back to English if the user's
  // current language is not `no`.
  const shareText = useMemo(() => {
    const link = inviteLink ?? '<link>'
    if (i18n.language === 'no') {
      return `Hei! Jeg bruker StrikeLab for å spore golfen min. Bli med meg her: ${link}`
    }
    return `Hey! I'm using StrikeLab to track my golf. Join me here: ${link}`
  }, [i18n.language, inviteLink])

  async function invite() {
    const result = await createInvite.mutateAsync({
      email: inviteEmail || undefined,
    })
    setInviteLink(`https://strikelab.golf/invite/${result.token}`)
    setInviteEmail('')
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText)
    } catch {
      // ignore — old browsers without clipboard API
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">{t('friends.title').toUpperCase()}</div>
        <h1 className="display text-[64px] m-0">
          {t('friends.leaderboard')} <em>·</em> {t('friends.compare').toLowerCase()}.
        </h1>
        <p className="text-body text-ink-2 mt-3 max-w-[640px]">
          {i18n.language === 'no'
            ? 'Følg vennene dine, sammenlign tall, push hverandre. Ingen jukser.'
            : 'Follow your friends, compare numbers, push each other. Nobody fakes.'}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* LEADERBOARD + COMPARE */}
        <div className="space-y-4">
          <Panel
            id="LIST"
            title={`${t('friends.leaderboard').toUpperCase()} · ${sortedFriends.length + 1}`}
          >
            {isLoading && (
              <div className="mono text-[11px] text-ink-3 uppercase tracking-micro">
                {t('common.loading')}
              </div>
            )}

            {!isLoading && (
              <div>
                {/* Pin the current user at the top */}
                {user && (
                  <Row
                    name={user.displayName ?? user.email}
                    handicap={user.handicapIndex ?? null}
                    isYou
                  />
                )}
                {sortedFriends.map((f) => (
                  <Row
                    key={f.id}
                    name={f.display_name}
                    handicap={f.handicap_index ?? null}
                    onCompare={() => setCompareWith(f.id)}
                    isComparing={compareWith === f.id}
                  />
                ))}
                {sortedFriends.length === 0 && (
                  <p className="text-body text-ink-3 mt-3">
                    {t('friends.noFriends')}
                  </p>
                )}
              </div>
            )}
          </Panel>

          {compareWith && compare.data && (
            <Panel
              id="CMP"
              title={t('friends.compare').toUpperCase()}
              right={
                <button
                  onClick={() => setCompareWith(null)}
                  className="mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-accent-fg"
                >
                  {t('common.close').toUpperCase()} ×
                </button>
              }
            >
              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="mono text-[10px] uppercase tracking-micro text-ink-3" />
                <div className="text-[14px] text-ink truncate">
                  {compare.data.user.display_name}
                </div>
                <div className="text-[14px] text-ink truncate">
                  {compare.data.friend.display_name}
                </div>

                <CompareRow
                  label="HCP"
                  a={compare.data.user.handicap}
                  b={compare.data.friend.handicap}
                  fmt={(n) => n.toFixed(1)}
                />
                <CompareRow
                  label="DRIVER CARRY"
                  unit="YDS"
                  a={compare.data.user.driver_carry}
                  b={compare.data.friend.driver_carry}
                />
                <CompareRow
                  label="7i CARRY"
                  unit="YDS"
                  a={compare.data.user.seven_iron_carry}
                  b={compare.data.friend.seven_iron_carry}
                />
              </div>
              <p className="text-[12px] text-ink-3 mt-4">
                {i18n.language === 'no'
                  ? 'Detaljert sammenligning (slag-DNA, runde mot runde) kommer i Phase 2.'
                  : 'Detailed compare (shot DNA, round-by-round) ships in Phase 2.'}
              </p>
            </Panel>
          )}
        </div>

        {/* INVITE */}
        <Panel id="INV" title={t('friends.invite').toUpperCase()}>
          <p className="text-body text-ink-2 mb-3">
            {i18n.language === 'no'
              ? 'Send en lenke til broren din eller en kompis. De får sin egen StrikeLab-konto og dukker opp i topplisten din.'
              : 'Send a link to your brother or a buddy. They get their own StrikeLab account and show up on your leaderboard.'}
          </p>
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={
              i18n.language === 'no' ? 'venn@epost.no (valgfritt)' : 'friend@email.com (optional)'
            }
            className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
          />
          <button
            onClick={invite}
            disabled={createInvite.isPending}
            className="mt-3 w-full bg-accent text-accent-ink px-4 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
          >
            {createInvite.isPending
              ? t('common.loading')
              : t('friends.invite').toUpperCase() + ' →'}
          </button>

          {inviteLink && (
            <div className="mt-4 space-y-2">
              <div className="micro">
                {i18n.language === 'no' ? 'INVITASJONSLINK' : 'INVITE LINK'}
              </div>
              <div className="mono text-[11px] text-ink-2 break-all border border-line-strong p-2 bg-bg-2">
                {inviteLink}
              </div>
              <button
                onClick={copyShare}
                className="w-full mt-1 bg-transparent text-ink border border-line-strong px-4 py-2 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg"
              >
                {i18n.language === 'no' ? 'KOPIER MELDING' : 'COPY MESSAGE'}
              </button>
            </div>
          )}

          <Link
            to="/play"
            className="block mt-6 mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
          >
            {t('caddie.newRound')} →
          </Link>
        </Panel>

        <PlaymateRail />
      </div>
    </div>
  )
}

function PlaymateRail() {
  const { t, i18n } = useTranslation()
  const { data: playmates = [] } = usePlaymates()
  if (playmates.length === 0) return null
  const heading =
    i18n.language === 'no' ? 'NYLIG SPILT MED' : 'RECENTLY PLAYED WITH'
  return (
    <Panel id="PLY" title={heading}>
      <div className="space-y-2">
        {playmates.slice(0, 6).map((p) => {
          const name = p.display_name ?? 'Spiller'
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2 border-b border-line last:border-0"
            >
              <div className="w-8 h-8 mono text-[11px] flex items-center justify-center bg-surface-2 border border-line-strong">
                {name
                  .split(/\s+/)
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-ink truncate">{name}</div>
                <div className="mono text-[10.5px] text-ink-3">
                  HCP {p.handicap?.toFixed(1) ?? '—'} · {p.rounds_together}{' '}
                  {p.rounds_together === 1
                    ? i18n.language === 'no'
                      ? 'runde'
                      : 'round'
                    : i18n.language === 'no'
                    ? 'runder'
                    : 'rounds'}
                </div>
              </div>
              <Link
                to="/tee"
                className="mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
              >
                {t('tee.bestNow')} →
              </Link>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function Row({
  name,
  handicap,
  isYou,
  onCompare,
  isComparing,
}: {
  name: string
  handicap: number | null
  isYou?: boolean
  onCompare?: () => void
  isComparing?: boolean
}) {
  return (
    <div
      className="grid items-center gap-3 py-2.5 border-b border-line last:border-0"
      style={{ gridTemplateColumns: '1fr 80px 80px 80px' }}
    >
      <span className="text-[14px] text-ink truncate">{name}</span>
      <span className="num text-[13px] text-right">
        {handicap != null ? handicap.toFixed(1) : '—'}
      </span>
      <span className="text-right">
        {isYou ? <Tag tone="accent">YOU</Tag> : <Tag>HCP</Tag>}
      </span>
      <span className="text-right">
        {!isYou && onCompare ? (
          <button
            onClick={onCompare}
            className={`mono text-[10px] uppercase tracking-micro ${
              isComparing ? 'text-accent-fg' : 'text-ink-3 hover:text-ink'
            }`}
          >
            COMPARE →
          </button>
        ) : null}
      </span>
    </div>
  )
}

function CompareRow({
  label,
  unit,
  a,
  b,
  fmt,
}: {
  label: string
  unit?: string
  a: number | null | undefined
  b: number | null | undefined
  fmt?: (n: number) => string
}) {
  const format = (n: number | null | undefined) => {
    if (n == null) return '—'
    const s = fmt ? fmt(n) : Math.round(n).toString()
    return unit ? `${s} ${unit}` : s
  }
  return (
    <>
      <div className="mono text-[10px] uppercase tracking-micro text-ink-3 py-2 border-t border-line">
        {label}
      </div>
      <div className="num text-[16px] py-2 border-t border-line">{format(a)}</div>
      <div className="num text-[16px] py-2 border-t border-line">{format(b)}</div>
    </>
  )
}

// --- i18n addition: leaderboard label is missing fallback in some keys
//     We use t('friends.leaderboard') which is defined in both en/no.
