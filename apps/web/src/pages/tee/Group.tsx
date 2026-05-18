import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { usePlaymates } from '@/api/tee'
import { useAuthStore } from '@/stores/authStore'
import { useFriends } from '@/api/auth'
import { useCourse } from '@/api/courses'
import { Panel } from '@/components/ui'
import { GroupSlot, type GroupPlayer, HeroLandscape, HeroKind } from '@/components/tee'

const KIND_MAP: Record<string, HeroKind> = {
  parkland: 'parkland',
  links: 'links',
  championship: 'championship',
  lakeside: 'lakeside',
  farmland: 'farmland',
  mountain: 'mountain',
  fjord: 'fjord',
}

interface PendingHold {
  course_id?: string | null
  course_name: string
  tee_time: string
  players: number
  price_amount?: number | null
  currency: string
  participants: GroupPlayer[]
  splitMode: 'together' | 'split'
}

export default function TeeGroup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { holdId = '' } = useParams<{ holdId: string }>()
  const [params] = useSearchParams()
  const courseId = params.get('course_id') ?? ''

  const user = useAuthStore((s) => s.user)
  const { data: course } = useCourse(courseId)
  const { data: playmates } = usePlaymates()
  const { data: friends } = useFriends()

  const initialPending = readPendingHold(holdId)

  const [participants, setParticipants] = useState<GroupPlayer[]>(
    initialPending?.participants ??
      [
        {
          user_id: user?.id ?? null,
          name: user?.displayName ?? 'You',
          initials: (user?.displayName ?? 'You').slice(0, 1).toUpperCase(),
          handicap: user?.handicapIndex ?? null,
          is_you: true,
        },
      ],
  )
  const [splitMode, setSplitMode] = useState<'together' | 'split'>(
    initialPending?.splitMode ?? 'together',
  )

  // Persist pending state across refreshes (helpful in dev hot reload).
  useEffect(() => {
    if (!holdId) return
    persistPendingHold(holdId, {
      course_id: courseId || null,
      course_name: course?.name ?? '',
      tee_time: initialPending?.tee_time ?? '',
      players: participants.length,
      price_amount: initialPending?.price_amount ?? null,
      currency: initialPending?.currency ?? 'NOK',
      participants,
      splitMode,
    })
  }, [holdId, participants, splitMode, course, courseId, initialPending])

  const pricePer = initialPending?.price_amount ?? 0
  const total = pricePer * participants.length

  function addPlaymate(p: { user_id?: string | null; name: string; handicap?: number | null }) {
    if (participants.length >= 4) return
    if (p.user_id && participants.some((x) => x.user_id === p.user_id)) return
    setParticipants([
      ...participants,
      {
        user_id: p.user_id ?? null,
        name: p.name,
        initials: p.name
          .split(/\s+/)
          .map((s) => s[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        handicap: p.handicap ?? null,
      },
    ])
  }

  function removeAt(idx: number) {
    if (participants[idx]?.is_you) return
    setParticipants(participants.filter((_, i) => i !== idx))
  }

  const kind: HeroKind = KIND_MAP[course?.course_type ?? ''] ?? 'parkland'

  return (
    <div className="max-w-[860px] mx-auto space-y-6">
      <header className="tee-card p-5 sm:p-6">
        <Link
          to={courseId ? `/tee/courses/${courseId}/sheet` : '/tee'}
          className="tee-pill hover:border-ink-3"
        >
          ← {t('tee.back')}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="tee-pill bg-[var(--ink)] text-[var(--surface-solid)] border-transparent">BETA CHECKOUT</span>
          <span className="tee-pill">2 / 3</span>
        </div>
        <h1 className="display text-[clamp(3rem,7vw,5rem)] m-0 mt-3">
          Bring your <em>group.</em>
        </h1>
        <p className="text-[15px] text-ink-2 mt-3 max-w-2xl">
          This booking checkout is a demo flow while club integrations are WIP.
        </p>
      </header>

      {course && (
        <div className="flex items-center gap-3 tee-card p-3.5">
          <div className="w-16 h-16 overflow-hidden rounded-[18px] flex-shrink-0">
            <HeroLandscape kind={kind} height={56} />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-ink">{course.name}</div>
            <div className="mono text-[11px] text-ink-3 mt-0.5">
              {initialPending?.tee_time
                ? new Date(initialPending.tee_time).toLocaleString()
                : '—'}
            </div>
          </div>
          <div className="text-right">
            <div className="micro">{t('tee.perPlayer')}</div>
            <div className="mono text-[15px] text-ink mt-0.5">
              {Math.round(pricePer)} kr
            </div>
          </div>
        </div>
      )}

      <Panel id="G1" title={t('tee.yourGroup').toUpperCase()}>
        <div className="border border-line-strong rounded-[2px] divide-y divide-line-strong">
          {Array.from({ length: 4 }).map((_, i) => (
            <GroupSlot
              key={i}
              index={i}
              player={participants[i]}
              onAdd={() => {
                /* no-op: use the playmate / friend list below */
              }}
              onRemove={() => removeAt(i)}
              isLast={i === 3}
            />
          ))}
        </div>
      </Panel>

      {/* Recently played with */}
      {(playmates?.length ?? 0) > 0 && (
        <Panel id="G2" title={t('tee.recentlyPlayedWith').toUpperCase()}>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {(playmates ?? []).slice(0, 8).map((p) => {
              const name = p.display_name ?? 'Spiller'
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    addPlaymate({
                      user_id: p.friend_user_id,
                      name,
                      handicap: p.handicap,
                    })
                  }
                  className="flex flex-col items-center gap-1 w-16 hover:opacity-90"
                >
              <div className="w-12 h-12 mono text-[14px] flex items-center justify-center bg-surface-2 border border-line-strong rounded-full">
                    {name
                      .split(/\s+/)
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="mono text-[10px] text-ink-2 truncate w-full text-center">
                    {name.split(' ')[0]}
                  </div>
                </button>
              )
            })}
          </div>
        </Panel>
      )}

      {(friends?.length ?? 0) > 0 && (
        <Panel id="G3" title="FRIENDS">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(friends ?? []).slice(0, 6).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  addPlaymate({
                    user_id: f.id,
                    name: f.display_name,
                    handicap: f.handicap_index ?? null,
                  })
                }
                className="flex items-center gap-2 border border-line-strong p-2 text-left hover:border-ink-3 rounded-[16px] bg-surface-solid"
              >
                <div className="w-8 h-8 bg-surface-2 mono text-[11px] flex items-center justify-center rounded-full">
                  {f.display_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate">{f.display_name}</div>
                  <div className="mono text-[10px] text-ink-3">
                    HCP {f.handicap_index?.toFixed(1) ?? '—'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      )}

      {/* Split toggle */}
      <Panel id="G4" title="SPLIT MODE">
        <div className="flex gap-2">
          {(
            [
              ['together', t('tee.payTogether')],
              ['split', t('tee.payIndividually')],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSplitMode(id)}
              className={
                splitMode === id
                  ? 'flex-1 bg-accent text-accent-ink mono text-[11px] uppercase tracking-micro py-3 first:rounded-l-pill last:rounded-r-pill'
                  : 'flex-1 border border-line-strong text-ink-2 mono text-[11px] uppercase tracking-micro py-3 hover:text-ink first:rounded-l-pill last:rounded-r-pill'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </Panel>

      <div className="flex items-center justify-between mono text-[13px] text-ink-2 pt-2">
        <span>
          {t('tee.totalLabel')} · {participants.length} × {Math.round(pricePer)} kr
        </span>
        <span className="display text-[28px] text-ink">
          {Math.round(total).toLocaleString('nb-NO')} kr
        </span>
      </div>

      <button
        type="button"
        onClick={() =>
          navigate(`/tee/booking/${holdId}/pay?course_id=${courseId}`)
        }
        className="w-full tee-cta py-4 mono text-[12px] uppercase tracking-micro"
      >
        {t('tee.continueToPay')} → {Math.round(total).toLocaleString('nb-NO')} kr
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Tiny localStorage helpers (refresh-resilient pending-hold state)
// ─────────────────────────────────────────────────────────────────────

const KEY = 'strikelab-tee-pending-hold'

function persistPendingHold(holdId: string, payload: PendingHold) {
  try {
    const raw = localStorage.getItem(KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[holdId] = payload
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* noop */
  }
}

function readPendingHold(holdId: string): PendingHold | null {
  if (!holdId) return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const all = JSON.parse(raw)
    return all[holdId] ?? null
  } catch {
    return null
  }
}
