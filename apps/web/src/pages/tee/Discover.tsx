import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useDiscover, useUpcomingPasses } from '@/api/tee'
import { useAuthStore } from '@/stores/authStore'
import { Panel, Tag } from '@/components/ui'
import { RecommendCard, PassCard } from '@/components/tee'

const FILTERS = [
  { k: 'best-now', key: 'tee.bestNow' },
  { k: 'tonight', key: 'tee.tonight' },
  { k: 'tomorrow', key: 'tee.thisWeek' },
  { k: 'weekend', key: 'tee.weekend' },
] as const

export default function TeeDiscover() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useDiscover()
  const { data: passes } = useUpcomingPasses()

  const greetingName = user?.displayName?.split(' ')[0] ?? 'spiller'
  const todaysWindow = data?.today_window ?? []
  const bestNow = data?.best_now ?? []
  const tonight = data?.tonight ?? []
  const weekend = data?.weekend ?? []
  const favorites = data?.favorites ?? []
  const nearby = data?.nearby ?? []

  return (
    <div className="space-y-8">
      {/* Editorial header */}
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">PLAY · TEE</div>
        <h1 className="display text-[64px] m-0">
          {t('tee.whereToPlay')} <em>{greetingName}?</em>
        </h1>
        <p className="text-body text-ink-2 mt-3">{t('tee.tagline')}</p>
        <div className="mt-4 flex items-center gap-2">
          {FILTERS.map((f, i) => (
            <span
              key={f.k}
              className={
                i === 0
                  ? 'mono text-[10px] uppercase tracking-micro bg-accent text-accent-ink px-2.5 py-1.5'
                  : 'mono text-[10px] uppercase tracking-micro border border-line-strong text-ink-2 px-2.5 py-1.5'
              }
            >
              {t(f.key)}
            </span>
          ))}
          <Link
            to="/tee/preferences"
            className="ml-auto mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-ink"
          >
            {t('tee.preferences')} →
          </Link>
        </div>
      </header>

      {/* Upcoming passes — only show if there are bookings */}
      {passes && passes.length > 0 && (
        <Panel id="P1" title={t('tee.scheduledFor').toUpperCase()}>
          <div className="grid lg:grid-cols-2 gap-3">
            {passes.slice(0, 2).map((p) => (
              <Link
                key={p.booking_id}
                to={`/tee/passes/${p.booking_id}`}
                className="block hover:opacity-95"
              >
                <PassCard pass={p} compact />
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {/* Today's window — recommended slots */}
      <Panel
        id="W1"
        title={t('tee.todaysWindow').toUpperCase()}
        right={<span className="micro">PICKED FOR YOU</span>}
      >
        {isLoading && <div className="micro">SEARCHING…</div>}
        {!isLoading && todaysWindow.length === 0 && (
          <div className="text-body text-ink-3 py-6 text-center">
            {t('tee.noBest')}
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {todaysWindow.slice(0, 6).map((slot) => (
            <RecommendCard key={slot.slot_id} slot={slot} />
          ))}
        </div>
      </Panel>

      {/* Best Now */}
      {bestNow.length > 0 && (
        <Panel id="W2" title={t('tee.bestNow').toUpperCase()}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bestNow.slice(0, 6).map((slot) => (
              <RecommendCard key={slot.slot_id} slot={slot} />
            ))}
          </div>
        </Panel>
      )}

      {/* Tonight + Weekend split */}
      {(tonight.length > 0 || weekend.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {tonight.length > 0 && (
            <Panel id="W3" title={t('tee.tonight').toUpperCase()}>
              <div className="space-y-3">
                {tonight.slice(0, 3).map((slot) => (
                  <RecommendCard key={slot.slot_id} slot={slot} />
                ))}
              </div>
            </Panel>
          )}
          {weekend.length > 0 && (
            <Panel id="W4" title={t('tee.weekend').toUpperCase()}>
              <div className="space-y-3">
                {weekend.slice(0, 3).map((slot) => (
                  <RecommendCard key={slot.slot_id} slot={slot} />
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* Favorites + nearby */}
      {(favorites.length > 0 || nearby.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {favorites.length > 0 && (
            <Panel id="W5" title={t('tee.favorites').toUpperCase()}>
              <div className="space-y-3">
                {favorites.slice(0, 3).map((slot) => (
                  <RecommendCard key={slot.slot_id} slot={slot} showHero={false} />
                ))}
              </div>
            </Panel>
          )}
          {nearby.length > 0 && (
            <Panel id="W6" title={t('tee.nearby').toUpperCase()}>
              <div className="space-y-3">
                {nearby.slice(0, 3).map((slot) => (
                  <RecommendCard key={slot.slot_id} slot={slot} showHero={false} />
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      <Panel id="LIB" title={t('tee.courseLibrary').toUpperCase()}>
        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="display text-[24px] m-0">
              Browse the <em>course library.</em>
            </div>
            <p className="text-body text-ink-2 mt-2">
              200+ Norwegian and Nordic clubs with verified slope, course
              rating, and conditions.
            </p>
          </div>
          <Link
            to="/courses"
            className="border border-line-strong px-4 py-2.5 mono text-[11px] uppercase tracking-micro text-ink hover:border-accent-fg hover:text-accent-fg"
          >
            BROWSE →
          </Link>
        </div>
      </Panel>
    </div>
  )
}
