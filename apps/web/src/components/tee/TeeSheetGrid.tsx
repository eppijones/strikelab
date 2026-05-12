import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { TeeSheet, TeeSheetSlot } from '@/api/tee'

/**
 * Day-grid tee sheet — the GolfBox-killer.
 *
 * Hours run across the top (06–20). Each row is an 8-min offset (00, 08, 16,
 * 24, 32, 40, 48, 56). Each cell is a tiny chip showing player dots, price,
 * and peak/golden/twilight tint. Hovering reveals occupant initials + handicap.
 *
 * Supports the StrikeLab-only filters that GolfBox cannot ship:
 *   - empty-only: hide any slot that already has a player
 *   - golden-only: only 18:00+
 *   - morning-only: 06–11
 *   - solo-only: highlights slots where I would still be alone after joining
 */

interface Props {
  sheet: TeeSheet
  onSelect: (slot: TeeSheetSlot) => void
  selectedId?: string | null
  filter?: SheetFilter
  emptyOnly?: boolean
}

export type SheetFilter = 'all' | 'empty-only' | 'golden' | 'morning'

const HOURS = Array.from({ length: 14 }, (_, i) => 6 + i) // 6..19
const MINUTE_BUCKETS = [0, 8, 16, 24, 32, 40, 48]

interface CellProps {
  slot: TeeSheetSlot | undefined
  selected: boolean
  onSelect: (slot: TeeSheetSlot) => void
  conditionTint: number
}

function Cell({ slot, selected, onSelect, conditionTint }: CellProps) {
  if (!slot) {
    return <div className="h-7 border border-line/30" />
  }
  const taken = slot.players_taken
  const total = slot.players_total
  const avail = Math.max(0, total - taken)
  const blocked = slot.is_blocked
  const isFull = avail === 0

  const tone = blocked
    ? 'border-line/40 text-ink-4'
    : isFull
    ? 'border-line/40 text-ink-4 line-through'
    : slot.golden
    ? 'border-accent-fg/40 text-ink hover:border-accent-fg'
    : slot.twilight
    ? 'border-warn/40 text-ink hover:border-warn'
    : 'border-line-strong text-ink-2 hover:border-ink-2'

  return (
    <button
      type="button"
      onClick={() => !blocked && !isFull && onSelect(slot)}
      title={
        slot.occupants.length
          ? slot.occupants
              .map(
                (o) =>
                  `${o.initials}${o.handicap != null ? ' · ' + o.handicap.toFixed(1) : ''}${
                    o.is_friend ? ' · friend' : ''
                  }`,
              )
              .join('  ')
          : 'Open'
      }
      disabled={blocked || isFull}
      className={clsx(
        'h-7 px-1.5 flex items-center justify-between gap-1 border bg-bg-2 text-[10px] mono uppercase tracking-micro-tight transition-colors',
        tone,
        selected && 'bg-accent text-accent-ink border-accent',
      )}
      style={{
        // Conditions tint — sun adds a subtle lime wash on the row.
        boxShadow:
          !selected && conditionTint > 0
            ? `inset 0 0 0 1px rgba(204, 240, 96, ${conditionTint * 0.06})`
            : undefined,
      }}
    >
      <span className="flex items-center gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={clsx(
              'inline-block w-1 h-1 rounded-full',
              i < taken ? 'bg-current opacity-80' : 'border border-current opacity-30',
            )}
          />
        ))}
      </span>
      {slot.price_amount != null && (
        <span className="ml-auto opacity-80">
          {Math.round(slot.price_amount)}
        </span>
      )}
    </button>
  )
}

export function TeeSheetGrid({
  sheet,
  onSelect,
  selectedId,
  filter = 'all',
  emptyOnly = false,
}: Props) {
  const slotsByHourMin = useMemo(() => {
    const m: Record<string, TeeSheetSlot> = {}
    for (const s of sheet.slots) {
      const d = new Date(s.tee_time)
      m[`${d.getHours()}-${d.getMinutes()}`] = s
    }
    return m
  }, [sheet.slots])

  const conditionTint = useMemo(() => {
    const m: Record<number, number> = {}
    for (const h of sheet.conditions?.hourly ?? []) {
      m[h.h] = (h.sun ?? 0) * (1 - (h.rain ?? 0))
    }
    return m
  }, [sheet.conditions])

  const slotPasses = (slot: TeeSheetSlot | undefined) => {
    if (!slot) return false
    const d = new Date(slot.tee_time)
    if (emptyOnly && slot.players_taken > 0) return false
    if (filter === 'golden' && d.getHours() < 18) return false
    if (filter === 'morning' && (d.getHours() < 6 || d.getHours() >= 11)) return false
    return true
  }

  return (
    <div className="overflow-auto border border-line-strong rounded-[2px] bg-surface-solid">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `48px repeat(${HOURS.length}, minmax(64px, 1fr))`,
          gridAutoRows: 'auto',
        }}
      >
        {/* Hour header row */}
        <div className="sticky top-0 z-10 bg-surface-solid border-b border-line-strong" />
        {HOURS.map((h) => (
          <div
            key={h}
            className="sticky top-0 z-10 bg-surface-solid border-b border-line-strong px-2 py-1.5 mono text-[10px] uppercase tracking-micro text-ink-3 text-center"
          >
            {String(h).padStart(2, '0')}
          </div>
        ))}

        {/* Rows: minute buckets */}
        {MINUTE_BUCKETS.map((minute) => (
          <RowFragment
            key={minute}
            minute={minute}
            slotsByHourMin={slotsByHourMin}
            selectedId={selectedId}
            onSelect={onSelect}
            slotPasses={slotPasses}
            conditionTint={conditionTint}
          />
        ))}
      </div>
    </div>
  )
}

function RowFragment({
  minute,
  slotsByHourMin,
  selectedId,
  onSelect,
  slotPasses,
  conditionTint,
}: {
  minute: number
  slotsByHourMin: Record<string, TeeSheetSlot>
  selectedId?: string | null
  onSelect: (slot: TeeSheetSlot) => void
  slotPasses: (slot: TeeSheetSlot | undefined) => boolean
  conditionTint: Record<number, number>
}) {
  return (
    <>
      <div className="border-b border-line/30 px-2 py-1.5 mono text-[10px] text-ink-3 text-right pr-3">
        :{String(minute).padStart(2, '0')}
      </div>
      {HOURS.map((h) => {
        const key = `${h}-${minute}`
        const slot = slotsByHourMin[key]
        const passes = slotPasses(slot)
        return (
          <div
            key={`${minute}-${h}`}
            className="border-b border-line/30 p-0.5"
            style={{ opacity: passes ? 1 : 0.25 }}
          >
            <Cell
              slot={slot}
              selected={!!slot && selectedId === slot.id}
              onSelect={onSelect}
              conditionTint={conditionTint[h] ?? 0}
            />
          </div>
        )
      })}
    </>
  )
}

interface FilterStripProps {
  filter: SheetFilter
  setFilter: (f: SheetFilter) => void
  emptyOnly: boolean
  setEmptyOnly: (v: boolean) => void
  players: number
  setPlayers: (n: number) => void
  holes: 9 | 18
  setHoles: (n: 9 | 18) => void
}

export function TeeSheetFilterBar({
  filter,
  setFilter,
  emptyOnly,
  setEmptyOnly,
  players,
  setPlayers,
  holes,
  setHoles,
}: FilterStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-3">
      <div className="flex items-center gap-2">
        <span className="micro">PLAYERS</span>
        <div className="flex border border-line-strong">
          {[1, 2, 3, 4].map((n, i) => (
            <button
              key={n}
              type="button"
              onClick={() => setPlayers(n)}
              className={clsx(
                'mono text-[11px] px-2.5 py-1.5 transition-colors',
                i > 0 && 'border-l border-line-strong',
                players === n
                  ? 'ui-selected'
                  : 'text-ink-3 hover:text-ink hover:bg-bg-2',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="micro">HOLES</span>
        <div className="flex border border-line-strong">
          {([9, 18] as const).map((n, i) => (
            <button
              key={n}
              type="button"
              onClick={() => setHoles(n)}
              className={clsx(
                'mono text-[11px] px-2.5 py-1.5 transition-colors',
                i > 0 && 'border-l border-line-strong',
                holes === n
                  ? 'ui-selected'
                  : 'text-ink-3 hover:text-ink hover:bg-bg-2',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="micro">VIEW</span>
        <div className="flex border border-line-strong">
          {(
            [
              ['all', 'ALL'],
              ['empty-only', 'EMPTY'],
              ['morning', 'MORNING'],
              ['golden', 'GOLDEN'],
            ] as const
          ).map(([id, label], i) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === 'empty-only') setEmptyOnly(!emptyOnly)
                else setFilter(id)
              }}
              className={clsx(
                'mono text-[10px] px-2.5 py-1.5 uppercase tracking-micro transition-colors',
                i > 0 && 'border-l border-line-strong',
                (id === 'empty-only' ? emptyOnly : filter === id)
                  ? 'ui-selected'
                  : 'text-ink-3 hover:text-ink hover:bg-bg-2',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SlotDots({ taken, total }: { taken: number; total: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={clsx(
            'inline-block w-1.5 h-1.5 rounded-full',
            i < taken ? 'bg-current opacity-80' : 'border border-current opacity-40',
          )}
        />
      ))}
    </span>
  )
}
