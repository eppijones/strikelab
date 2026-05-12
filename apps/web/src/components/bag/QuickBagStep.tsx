import { useState } from 'react'

import { useBrands } from '@/api/catalog'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { brandHasLogo } from '@/components/brand/logoAssets'
import type { QuickAddClubData } from '@/api/equipment'

const QUICK_SLOTS: Array<{ club_type: string; club_label: string }> = [
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
]

interface Props {
  /** Latest brand selections per slot index. */
  value: Array<string | null>
  onChange: (value: Array<string | null>) => void
}

/**
 * Compact bag picker for onboarding. Pick a brand for each common slot;
 * "Skip" is allowed by leaving slots empty.
 */
export function QuickBagStep({ value, onChange }: Props) {
  const { data: brands = [] } = useBrands()
  const [activeSlot, setActiveSlot] = useState<number | null>(null)

  const update = (idx: number, brandId: string | null) => {
    const next = [...value]
    while (next.length < QUICK_SLOTS.length) next.push(null)
    next[idx] = brandId
    onChange(next.slice(0, QUICK_SLOTS.length))
    setActiveSlot(null)
  }

  return (
    <div>
      <p className="text-body text-ink-2 mb-4">
        Tap a slot, pick the brand. Skip any you don't carry — you can fine-tune
        every club later in the bag editor.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {QUICK_SLOTS.map((slot, idx) => {
          const brandId = value[idx] ?? null
          const brand = brands.find((b) => b.id === brandId)
          return (
            <button
              key={idx}
              onClick={() => setActiveSlot(idx)}
              className={`text-left p-3 border ${
                activeSlot === idx
                  ? 'border-accent-fg text-accent-fg'
                  : brand
                  ? 'border-line-strong text-ink hover:border-ink-3'
                  : 'border-line text-ink-3 hover:border-ink-3'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] tracking-micro">
                  {slot.club_label.toUpperCase()}
                </span>
                <span className="mono text-[9px] text-ink-4 tracking-micro-tight">
                  {slot.club_type.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 h-6 flex items-center">
                {brand ? (
                  <BrandLogo id={brand.id} brand={brand} size={20} compact />
                ) : (
                  <span className="mono text-[10px] text-ink-4 tracking-micro">
                    TAP TO PICK
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {activeSlot !== null && (
        <div className="mt-4 border border-line-strong p-3">
          <div className="flex items-baseline justify-between mb-3">
            <div className="micro">
              SLOT {QUICK_SLOTS[activeSlot].club_label.toUpperCase()} · BRAND
            </div>
            <button
              onClick={() => update(activeSlot, null)}
              className="mono text-[10px] text-ink-3 uppercase tracking-micro hover:text-bad"
            >
              CLEAR
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {brands.filter((b) => brandHasLogo(b.id)).map((b) => (
              <button
                key={b.id}
                onClick={() => update(activeSlot, b.id)}
                className="border border-line-strong p-2 hover:border-accent-fg text-left"
              >
                <BrandLogo id={b.id} brand={b} size={20} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function quickBagToPayload(
  selections: Array<string | null>
): QuickAddClubData[] {
  const out: QuickAddClubData[] = []
  selections.forEach((brandId, idx) => {
    if (!brandId) return
    const slot = QUICK_SLOTS[idx]
    if (!slot) return
    out.push({
      club_type: slot.club_type,
      club_label: slot.club_label,
      brand_id: brandId,
      model_name: '—',
    })
  })
  return out
}
