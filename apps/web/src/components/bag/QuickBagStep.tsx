import { useState } from 'react'

import type { QuickAddClubData } from '@/api/equipment'

const QUICK_SLOTS = [
  { club_type: 'driver', club_label: 'Driver' },
  { club_type: '3_wood', club_label: '3W' },
  { club_type: 'hybrid', club_label: '4H' },
  { club_type: 'iron', club_label: '5i' },
  { club_type: 'iron', club_label: '6i' },
  { club_type: 'iron', club_label: '7i' },
  { club_type: 'iron', club_label: '8i' },
  { club_type: 'iron', club_label: '9i' },
  { club_type: 'iron', club_label: 'PW' },
  { club_type: 'wedge', club_label: '52°' },
  { club_type: 'wedge', club_label: '56°' },
  { club_type: 'wedge', club_label: '60°' },
  { club_type: 'putter', club_label: 'Putter' },
].map((slot) => ({
  ...slot,
  group:
    slot.club_type === 'driver' ? 'Driver'
    : slot.club_type.includes('wood') ? 'Wood'
    : slot.club_type === 'hybrid' ? 'Hybrid'
    : slot.club_type === 'wedge' ? 'Wedge'
    : slot.club_type === 'putter' ? 'Putter'
    : 'Iron',
}))

interface Props {
  /** Selected slots per index. Details can be added later in the bag editor. */
  value: boolean[]
  onChange: (value: boolean[]) => void
}

/**
 * Compact bag picker for onboarding. Golfers pick the clubs they carry first;
 * brand, loft, shaft, grip, and notes stay optional details for later.
 */
export function QuickBagStep({ value, onChange }: Props) {
  const selectedCount = value.filter(Boolean).length

  const update = (idx: number, selected: boolean) => {
    const next = [...value]
    while (next.length < QUICK_SLOTS.length) next.push(false)
    next[idx] = selected
    onChange(next.slice(0, QUICK_SLOTS.length))
  }

  const selectStarterSet = () => {
    onChange(QUICK_SLOTS.map(() => true))
  }

  const clearAll = () => {
    onChange(QUICK_SLOTS.map(() => false))
  }

  return (
    <div>
      <p className="text-body text-ink-2 mb-4">
        Pick the clubs you carry. Skip any that do not fit your bag. Brand,
        loft, lie, shaft, grip, and notes can be added later only if you care.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={selectStarterSet}
          className="bg-accent text-accent-ink px-4 py-2.5 mono text-[10px] uppercase tracking-micro hover:bg-accent-2"
        >
          Select starter set
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="border border-line-strong text-ink-2 px-4 py-2.5 mono text-[10px] uppercase tracking-micro hover:border-ink-3"
        >
          Clear
        </button>
        <span className="mono text-[10px] text-ink-3 uppercase tracking-micro">
          {selectedCount}/14 clubs selected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {QUICK_SLOTS.map((slot, idx) => {
          const selected = value[idx] ?? false
          return (
            <button
              key={idx}
              type="button"
              onClick={() => update(idx, !selected)}
              className={`text-left p-3 border ${
                selected
                  ? 'border-accent-fg bg-bg-2 text-accent-fg'
                  : 'border-line text-ink-3 hover:border-ink-3 hover:text-ink'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] tracking-micro">
                  {slot.club_label.toUpperCase()}
                </span>
                <span className="mono text-[9px] text-ink-4 tracking-micro-tight">
                  {slot.group.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 mono text-[10px] tracking-micro">
                {selected ? 'IN MY BAG' : 'TAP TO ADD'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function quickBagToPayload(
  selections: boolean[]
): QuickAddClubData[] {
  const out: QuickAddClubData[] = []
  selections.forEach((selected, idx) => {
    if (!selected) return
    const slot = QUICK_SLOTS[idx]
    if (!slot) return
    out.push({
      club_type: slot.club_type,
      club_label: slot.club_label,
      brand_id: 'custom',
      model_name: slot.club_label,
    })
  })
  return out
}
