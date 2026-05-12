import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Panel, Tag } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { useFriends } from '@/api/auth'

interface Props {
  /** Optional title override; defaults to the translated "Roster". */
  title?: string
}

/**
 * Compact friends widget for the persona-aware Home pages.
 *
 * Shows the current user pinned at the top followed by accepted friends,
 * sorted by handicap ascending (lowest = leader). Tappable rows route
 * to /friends. Empty state nudges the user to invite the first one,
 * which is the daily-driver loop the trio (HC 11.5 / 15 / 16) cares
 * about.
 */
export function FriendsLeaderboard({ title }: Props) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: friends = [], isLoading } = useFriends()

  // Pin the current user, then accepted friends sorted by lowest HCP first.
  const accepted = friends.filter((f) => (f.status ?? 'accepted') === 'accepted')
  const sorted = [...accepted].sort((a, b) => {
    const ah = a.handicap_index ?? 99
    const bh = b.handicap_index ?? 99
    return ah - bh
  })

  return (
    <Panel
      title={(title ?? t('friends.leaderboard')).toUpperCase()}
      right={
        <Link
          to="/friends"
          className="mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
        >
          {t('friends.invite').toUpperCase()} →
        </Link>
      }
    >
      {isLoading && (
        <div className="mono text-[11px] text-ink-3 uppercase tracking-micro">
          {t('common.loading')}
        </div>
      )}

      {!isLoading && (
        <div>
          {user && (
            <Row
              name={user.displayName ?? user.email}
              handicap={user.handicapIndex ?? null}
              isYou
            />
          )}
          {sorted.map((f) => (
            <Row
              key={f.id}
              name={f.display_name}
              handicap={f.handicap_index ?? null}
            />
          ))}
          {sorted.length === 0 && (
            <p className="text-body text-ink-3 mt-3">{t('friends.noFriends')}</p>
          )}
        </div>
      )}
    </Panel>
  )
}

function Row({
  name,
  handicap,
  isYou,
}: {
  name: string
  handicap: number | null
  isYou?: boolean
}) {
  return (
    <div
      className="grid items-center gap-3 py-2 border-b border-line last:border-0"
      style={{ gridTemplateColumns: '1fr 60px 60px' }}
    >
      <span className="text-[14px] text-ink truncate">{name}</span>
      <span className="num text-[13px] text-right">
        {handicap != null ? handicap.toFixed(1) : '—'}
      </span>
      <span className="text-right">
        {isYou ? <Tag tone="accent">YOU</Tag> : <Tag>HCP</Tag>}
      </span>
    </div>
  )
}
