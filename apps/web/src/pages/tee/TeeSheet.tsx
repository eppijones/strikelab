import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { useCourse } from '@/api/courses'
import {
  useBestWindows,
  useHoldSlotV2,
  useTeeSheet,
  type TeeSheetSlot,
} from '@/api/tee'
import { useAuthStore } from '@/stores/authStore'
import { Panel } from '@/components/ui'
import {
  TeeSheetGrid,
  TeeSheetFilterBar,
  WindowCard,
  WindowLandscape,
  type SheetFilter,
} from '@/components/tee'
import clsx from 'clsx'

type View = 'grid' | 'window'

export default function TeeSheetPage() {
  const { t, i18n } = useTranslation()
  const { id = '' } = useParams<{ id: string }>()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const date = params.get('date') ?? new Date().toISOString().slice(0, 10)
  const view = (params.get('view') as View) ?? 'grid'

  const { data: course } = useCourse(id)
  const { data: sheet } = useTeeSheet(id, date)
  const { data: windows } = useBestWindows(id, date)
  const hold = useHoldSlotV2()

  const [players, setPlayers] = useState(2)
  const [holes, setHoles] = useState<9 | 18>(18)
  const [filter, setFilter] = useState<SheetFilter>('all')
  const [emptyOnly, setEmptyOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedSlot = useMemo<TeeSheetSlot | null>(() => {
    if (!sheet) return null
    return sheet.slots.find((s) => s.id === selectedId) ?? null
  }, [sheet, selectedId])

  const visibleSlots = useMemo(() => {
    if (!sheet) return []
    return sheet.slots.filter((s) => {
      if (s.is_blocked) return false
      const d = new Date(s.tee_time)
      if (emptyOnly && s.players_taken > 0) return false
      if (filter === 'golden' && d.getHours() < 18) return false
      if (filter === 'morning' && (d.getHours() < 6 || d.getHours() >= 11)) return false
      return true
    })
  }, [sheet, filter, emptyOnly])

  const setView = (v: View) => {
    params.set('view', v)
    setParams(params, { replace: true })
  }

  if (!course || !sheet) {
    return <div className="text-body text-ink-3">Loading…</div>
  }

  async function continueToGroup() {
    if (!selectedSlot || !course) return
    const result = await hold.mutateAsync({
      slot_id: selectedSlot.id,
      course_id: course.id,
      course_name: course.name,
      tee_time: selectedSlot.tee_time,
      players,
      provider: 'internal',
      price_amount: selectedSlot.price_amount ?? 0,
      currency: selectedSlot.currency,
      player_payload: [
        {
          user_id: user?.id ?? null,
          name: user?.displayName ?? 'You',
          handicap: user?.handicapIndex ?? null,
        },
      ],
    })
    navigate(`/tee/booking/${result.id}/group?course_id=${course.id}`)
  }

  const best = windows?.[0]

  return (
    <div className="space-y-5">
      <header className="flex items-baseline justify-between gap-4 border-b border-line-strong pb-4">
        <div>
          <Link
            to={`/tee/courses/${id}`}
            className="mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-ink"
          >
            ← {course.name}
          </Link>
          <h1 className="display text-[40px] m-0 mt-2">
            {view === 'window' ? <em>The Window</em> : <em>Day grid</em>}
          </h1>
          <div className="mono text-[11px] text-ink-3 mt-1">
            {new Date(date).toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              params.set('date', e.target.value)
              setParams(params, { replace: true })
            }}
            className="bg-bg-2 border border-line-strong text-ink mono text-[12px] px-3 py-2"
          />
          <div className="flex border border-line-strong">
            {(
              [
                ['grid', t('tee.viewGrid')],
                ['window', t('tee.viewWindow')],
              ] as const
            ).map(([id, label], i) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id as View)}
                className={clsx(
                  'mono text-[10px] uppercase tracking-micro px-3 py-2 transition-colors',
                  i > 0 && 'border-l border-line-strong',
                  view === id
                    ? 'ui-selected'
                    : 'text-ink-3 hover:text-ink hover:bg-bg-2',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <TeeSheetFilterBar
        filter={filter}
        setFilter={setFilter}
        emptyOnly={emptyOnly}
        setEmptyOnly={setEmptyOnly}
        players={players}
        setPlayers={setPlayers}
        holes={holes}
        setHoles={setHoles}
      />

      {view === 'window' ? (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          <div className="space-y-3">
            {(windows ?? []).map((w) => (
              <WindowCard
                key={w.label}
                window={w}
                language={i18n.language as 'en' | 'no'}
              />
            ))}
          </div>
          <WindowLandscape
            slots={visibleSlots}
            conditions={sheet.conditions}
            selectedId={selectedId}
            onSelect={(s) => setSelectedId(s.id)}
            windowStart={best?.start_hour}
            windowEnd={best?.end_hour}
            windowLabel={(i18n.language === 'no' ? best?.label_no : best?.label_en) ?? undefined}
          />
        </div>
      ) : (
        <Panel id="GR" title={`SLOTS · ${visibleSlots.length}`}>
          <TeeSheetGrid
            sheet={{ ...sheet, slots: visibleSlots }}
            onSelect={(s) => setSelectedId(s.id)}
            selectedId={selectedId}
            filter={filter}
            emptyOnly={emptyOnly}
          />
        </Panel>
      )}

      {/* Sticky bottom selection bar */}
      {selectedSlot && (
        <div className="sticky bottom-4 bg-surface-solid border border-line-strong rounded-[2px] p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="micro">SELECTED</div>
            <div className="display text-[28px] mt-1">
              {new Date(selectedSlot.tee_time).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="mono text-[11px] text-ink-3 mt-1">
              {players} × {Math.round(selectedSlot.price_amount ?? 0)} kr ={' '}
              {Math.round((selectedSlot.price_amount ?? 0) * players)} kr
            </div>
          </div>
          <button
            type="button"
            disabled={hold.isPending}
            onClick={continueToGroup}
            className="bg-accent text-accent-ink px-6 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
          >
            {t('tee.next')} →
          </button>
        </div>
      )}
    </div>
  )
}
