import { useEffect, useMemo, useState } from 'react'

import { useBrands, useClubModels, type Brand, type ClubModel } from '@/api/catalog'
import {
  useAddClub,
  useUpdateClub,
  type Club,
  type CreateClubData,
} from '@/api/equipment'

import { BrandLogo } from '@/components/brand/BrandLogo'
import { brandHasLogo } from '@/components/brand/logoAssets'
import { Tag } from '@/components/ui'

import { CLUB_TYPES, SHAFT_FLEX_OPTIONS, defaultLabelForType } from './clubTypes'

type Step = 'type' | 'brand' | 'model' | 'specs'

interface Props {
  bagId: string
  open: boolean
  /** Initial club for edit mode. */
  club?: Club | null
  /** Existing labels in the bag — used to auto-pick the next iron / wedge. */
  existingLabels?: string[]
  onClose: () => void
}

interface Draft {
  club_type: string
  club_label: string
  brand_id: string
  brand_name: string
  model_name: string
  custom_model: boolean
  year?: number
  loft?: number | ''
  lie?: number | ''
  length?: number | ''
  shaft_brand?: string
  shaft_model?: string
  shaft_flex?: string
  swing_weight?: string
  notes?: string
}

const EMPTY_DRAFT: Draft = {
  club_type: '',
  club_label: '',
  brand_id: '',
  brand_name: '',
  model_name: '',
  custom_model: false,
  loft: '',
  lie: '',
  length: '',
  shaft_brand: '',
  shaft_model: '',
  shaft_flex: '',
  swing_weight: '',
  notes: '',
}

export function ClubEditorDrawer({
  bagId,
  open,
  club,
  existingLabels = [],
  onClose,
}: Props) {
  const isEdit = !!club
  const [step, setStep] = useState<Step>('type')
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  const { data: brands = [] } = useBrands()
  const { data: models = [] } = useClubModels(
    draft.brand_id
      ? { brandId: draft.brand_id, clubType: draft.club_type || undefined }
      : undefined
  )

  const addClub = useAddClub()
  const updateClub = useUpdateClub()

  // Reset draft on open / club change.
  useEffect(() => {
    if (!open) return

    if (club) {
      const matchedBrand = brands.find((b) => b.id === club.brand_id)
      setDraft({
        club_type: club.club_type,
        club_label: club.club_label ?? '',
        brand_id: club.brand_id,
        brand_name: matchedBrand?.name ?? club.brand_id,
        model_name: club.model_name,
        custom_model: false,
        year: club.year ?? undefined,
        loft: club.loft ?? '',
        lie: club.lie ?? '',
        length: club.length ?? '',
        shaft_brand: club.shaft_brand ?? '',
        shaft_model: club.shaft_model ?? '',
        shaft_flex: club.shaft_flex ?? '',
        swing_weight: club.swing_weight ?? '',
        notes: club.notes ?? '',
      })
      setStep('specs')
    } else {
      setDraft(EMPTY_DRAFT)
      setStep('type')
    }
  }, [open, club, brands])

  const canSave =
    !!draft.club_type && !!draft.brand_id && !!draft.model_name.trim()

  const stepLabel = useMemo<Record<Step, string>>(
    () => ({
      type: 'TYPE',
      brand: 'BRAND',
      model: 'MODEL',
      specs: 'SPECS',
    }),
    []
  )

  if (!open) return null

  const close = () => {
    onClose()
  }

  const handleSave = async () => {
    if (!canSave) return

    const payload: CreateClubData = {
      club_type: draft.club_type,
      club_label: draft.club_label || undefined,
      brand_id: draft.brand_id,
      model_name: draft.model_name,
      year: draft.year,
      loft: draft.loft === '' ? undefined : Number(draft.loft),
      lie: draft.lie === '' ? undefined : Number(draft.lie),
      shaft_brand: draft.shaft_brand || undefined,
      shaft_model: draft.shaft_model || undefined,
      shaft_flex: draft.shaft_flex || undefined,
    }

    if (isEdit && club) {
      await updateClub.mutateAsync({ clubId: club.id, data: payload })
    } else {
      await addClub.mutateAsync({ bagId, data: payload })
    }

    close()
  }

  const pickType = (typeId: string) => {
    const label = defaultLabelForType(typeId, existingLabels)
    setDraft((d) => ({ ...d, club_type: typeId, club_label: label }))
    setStep('brand')
  }

  const pickBrand = (brand: Brand) => {
    setDraft((d) => ({
      ...d,
      brand_id: brand.id,
      brand_name: brand.name,
      // reset model when switching brand
      model_name: '',
      custom_model: false,
    }))
    setStep('model')
  }

  const pickModel = (model: ClubModel) => {
    setDraft((d) => ({
      ...d,
      model_name: model.name,
      custom_model: false,
      year: model.year ?? d.year,
      loft: model.default_loft ?? d.loft,
      lie: model.default_lie ?? d.lie,
    }))
    setStep('specs')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50">
      <div
        className="bg-bg border-l border-line-strong w-full max-w-[560px] flex flex-col"
        role="dialog"
        aria-modal
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-strong">
          <div>
            <div className="micro">{isEdit ? 'EDIT CLUB' : 'ADD CLUB'}</div>
            <div className="display text-[24px] mt-1">
              {isEdit ? 'Update' : 'Build'} the <em>club.</em>
            </div>
          </div>
          <button
            onClick={close}
            className="mono text-[10px] text-ink-3 hover:text-ink uppercase tracking-micro"
          >
            CLOSE ✕
          </button>
        </div>

        {/* PROGRESS */}
        <div className="flex border-b border-line">
          {(['type', 'brand', 'model', 'specs'] as Step[]).map((s) => {
            const done =
              (s === 'type' && draft.club_type) ||
              (s === 'brand' && draft.brand_id) ||
              (s === 'model' && draft.model_name) ||
              (s === 'specs' && step === 'specs')
            const isActive = step === s
            return (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 px-3 py-2.5 mono text-[10px] uppercase tracking-micro border-r border-line last:border-r-0 transition-colors ${
                  isActive
                    ? 'text-accent-fg bg-bg-2'
                    : done
                    ? 'text-ink hover:bg-bg-2'
                    : 'text-ink-3 hover:bg-bg-2'
                }`}
              >
                {stepLabel[s]}
              </button>
            )
          })}
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {step === 'type' && (
            <div>
              <div className="micro mb-3">SELECT CLUB TYPE</div>
              <div className="grid grid-cols-2 gap-2">
                {CLUB_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => pickType(t.id)}
                    className={`text-left p-4 border ${
                      draft.club_type === t.id
                        ? 'border-accent-fg text-accent-fg'
                        : 'border-line-strong text-ink hover:border-ink-3'
                    }`}
                  >
                    <div className="mono text-[10px] text-ink-3 tracking-micro">
                      {t.shortLabel}
                    </div>
                    <div className="text-[16px] mt-1">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'brand' && (
            <BrandPicker
              brands={brands}
              selected={draft.brand_id}
              onSelect={pickBrand}
            />
          )}

          {step === 'model' && (
            <ModelPicker
              brandName={draft.brand_name || draft.brand_id}
              models={models}
              selected={draft.model_name}
              onSelect={pickModel}
              onCustom={(name) => {
                setDraft((d) => ({
                  ...d,
                  model_name: name,
                  custom_model: true,
                }))
                setStep('specs')
              }}
            />
          )}

          {step === 'specs' && <SpecsForm draft={draft} setDraft={setDraft} />}
        </div>

        {/* FOOTER */}
        <div className="border-t border-line-strong px-5 py-4 flex items-center justify-between">
          <div className="mono text-[10px] text-ink-3 tracking-micro">
            {draft.club_label && (
              <span className="text-ink-2">{draft.club_label} · </span>
            )}
            {draft.brand_name || '—'}
            {draft.model_name ? ` · ${draft.model_name}` : ''}
          </div>
          <div className="flex gap-2">
            {step !== 'type' && (
              <button
                onClick={() => {
                  const order: Step[] = ['type', 'brand', 'model', 'specs']
                  const idx = order.indexOf(step)
                  setStep(order[Math.max(0, idx - 1)])
                }}
                className="bg-transparent text-ink-2 border border-line-strong px-4 py-2.5 mono text-[10px] uppercase tracking-micro hover:border-ink-3"
              >
                BACK
              </button>
            )}
            {step !== 'specs' ? (
              <button
                onClick={() => {
                  const order: Step[] = ['type', 'brand', 'model', 'specs']
                  const idx = order.indexOf(step)
                  setStep(order[Math.min(order.length - 1, idx + 1)])
                }}
                disabled={
                  (step === 'type' && !draft.club_type) ||
                  (step === 'brand' && !draft.brand_id) ||
                  (step === 'model' && !draft.model_name)
                }
                className="bg-accent text-accent-ink px-4 py-2.5 mono text-[10px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
              >
                NEXT →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={!canSave || addClub.isPending || updateClub.isPending}
                className="bg-accent text-accent-ink px-4 py-2.5 mono text-[10px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
              >
                {isEdit ? 'SAVE CHANGES' : 'ADD CLUB'} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BrandPicker({
  brands,
  selected,
  onSelect,
}: {
  brands: Brand[]
  selected: string
  onSelect: (b: Brand) => void
}) {
  const [q, setQ] = useState('')
  // Only show brands we have a real logo asset for. The rest are hidden
  // until proper marks are added under apps/web/public/brands/.
  const supported = brands.filter((b) => brandHasLogo(b.id))
  const filtered = q
    ? supported.filter((b) =>
        b.name.toLowerCase().includes(q.toLowerCase()) ||
        b.id.toLowerCase().includes(q.toLowerCase())
      )
    : supported

  return (
    <div>
      <div className="micro mb-3">SELECT BRAND</div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by name…"
        className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-2.5 mono text-[12px] focus:border-accent-fg focus:outline-none mb-3"
      />
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className={`text-left p-3 border flex flex-col gap-2 ${
              selected === b.id
                ? 'border-accent-fg text-accent-fg'
                : 'border-line-strong text-ink hover:border-ink-3'
            }`}
          >
            <BrandLogo id={b.id} brand={b} size={22} />
            <div className="mono text-[10px] text-ink-3 tracking-micro">
              {b.country?.toUpperCase() ?? '—'}
              {b.founded ? ` · ${b.founded}` : ''}
            </div>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-body text-ink-3 mt-4">No brands match.</div>
      )}
    </div>
  )
}

function ModelPicker({
  brandName,
  models,
  selected,
  onSelect,
  onCustom,
}: {
  brandName: string
  models: ClubModel[]
  selected: string
  onSelect: (m: ClubModel) => void
  onCustom: (name: string) => void
}) {
  const [custom, setCustom] = useState('')

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="micro">SELECT MODEL</div>
        <div className="mono text-[10px] text-ink-3 tracking-micro">{brandName.toUpperCase()}</div>
      </div>

      {models.length === 0 && (
        <div className="text-body text-ink-3 mb-3">
          No catalog models for this combination yet — enter a custom model below.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className={`text-left px-4 py-2.5 border flex items-center justify-between ${
              selected === m.name
                ? 'border-accent-fg text-accent-fg'
                : 'border-line-strong text-ink hover:border-ink-3'
            }`}
          >
            <span className="text-[14px]">{m.name}</span>
            <span className="mono text-[10px] text-ink-3 tracking-micro">
              {m.year ?? '—'}
              {m.default_loft ? ` · ${m.default_loft}°` : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-line my-5" />
      <div className="micro mb-2">CUSTOM MODEL</div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. Qi35 Tour Driver"
          className="flex-1 bg-bg-2 border border-line-strong text-ink px-4 py-2.5 mono text-[12px] focus:border-accent-fg focus:outline-none"
        />
        <button
          onClick={() => custom.trim() && onCustom(custom.trim())}
          disabled={!custom.trim()}
          className="bg-transparent text-ink border border-line-strong px-4 py-2.5 mono text-[10px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg disabled:opacity-50"
        >
          USE CUSTOM →
        </button>
      </div>
    </div>
  )
}

function SpecsForm({
  draft,
  setDraft,
}: {
  draft: Draft
  setDraft: React.Dispatch<React.SetStateAction<Draft>>
}) {
  return (
    <div className="space-y-4">
      <div className="border border-line-strong p-4">
        <div className="micro mb-2">SUMMARY</div>
        <div className="flex items-baseline gap-2">
          <Tag>{draft.club_label || draft.club_type.toUpperCase()}</Tag>
          <BrandLogo id={draft.brand_id} size={18} />
          <span className="text-[14px] text-ink">{draft.model_name}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="LABEL">
          <input
            value={draft.club_label}
            onChange={(e) => setDraft((d) => ({ ...d, club_label: e.target.value }))}
            placeholder="e.g. 7i"
            className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
          />
        </Field>
        <Field label="YEAR">
          <input
            type="number"
            value={draft.year ?? ''}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                year: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            placeholder="2024"
            className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
          />
        </Field>

        <Field label="LOFT (°)">
          <input
            type="number"
            step="0.5"
            value={draft.loft ?? ''}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                loft: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
            placeholder="10.5"
            className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
          />
        </Field>

        <Field label="LIE (°)">
          <input
            type="number"
            step="0.5"
            value={draft.lie ?? ''}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                lie: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
            placeholder="61.5"
            className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
          />
        </Field>

        <Field label="SHAFT BRAND">
          <input
            value={draft.shaft_brand ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, shaft_brand: e.target.value }))}
            placeholder="e.g. Project X"
            className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
          />
        </Field>

        <Field label="SHAFT MODEL">
          <input
            value={draft.shaft_model ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, shaft_model: e.target.value }))}
            placeholder="e.g. Hzrdus Smoke"
            className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
          />
        </Field>

        <Field label="SHAFT FLEX">
          <div className="flex gap-1">
            {SHAFT_FLEX_OPTIONS.map((flex) => (
              <button
                key={flex}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    shaft_flex: d.shaft_flex === flex ? '' : flex,
                  }))
                }
                className={`flex-1 py-2 mono text-[11px] border ${
                  draft.shaft_flex === flex
                    ? 'border-accent-fg text-accent-fg'
                    : 'border-line-strong text-ink-2 hover:border-ink-3'
                }`}
              >
                {flex}
              </button>
            ))}
          </div>
        </Field>

        <Field label="SWING WEIGHT">
          <input
            value={draft.swing_weight ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, swing_weight: e.target.value }))}
            placeholder="e.g. D2"
            className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none"
          />
        </Field>
      </div>

      <Field label="NOTES">
        <textarea
          value={draft.notes ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          rows={3}
          placeholder="Anything you want to remember about this club…"
          className="w-full bg-bg-2 border border-line-strong text-ink px-3 py-2 mono text-[12px] focus:border-accent-fg focus:outline-none resize-none"
        />
      </Field>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="micro mb-1.5">{label}</div>
      {children}
    </label>
  )
}

export default ClubEditorDrawer
