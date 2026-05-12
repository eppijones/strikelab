import { useEffect, useState } from 'react'

import {
  useCreateCourse,
  useUpdateCourse,
  type Course,
  type CourseInput,
  type HoleData,
} from '@/api/courses'

import { HoleTable } from './HoleTable'

interface Props {
  open: boolean
  course?: Course | null
  onClose: () => void
  onSaved?: (course: Course) => void
}

const COURSE_TYPES = ['parkland', 'links', 'heathland', 'desert', 'mountain', 'resort']

interface Draft {
  name: string
  city: string
  country: string
  country_code: string
  course_type: string
  par: number | ''
  slope_rating: number | ''
  course_rating: number | ''
  total_yards: number | ''
  total_meters: number | ''
  designer: string
  established: number | ''
  website: string
  phone: string
  latitude: number | ''
  longitude: number | ''
  holes: HoleData[]
}

const EMPTY_DRAFT: Draft = {
  name: '',
  city: '',
  country: '',
  country_code: '',
  course_type: '',
  par: '',
  slope_rating: '',
  course_rating: '',
  total_yards: '',
  total_meters: '',
  designer: '',
  established: '',
  website: '',
  phone: '',
  latitude: '',
  longitude: '',
  holes: Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4 })),
}

export function CourseEditor({ open, course, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [unit, setUnit] = useState<'yards' | 'meters'>('yards')
  const [showHoles, setShowHoles] = useState(false)
  const create = useCreateCourse()
  const update = useUpdateCourse()
  const isEdit = !!course

  useEffect(() => {
    if (!open) return

    if (course) {
      setDraft({
        name: course.name,
        city: course.city ?? '',
        country: course.country ?? '',
        country_code: course.country_code ?? '',
        course_type: course.course_type ?? '',
        par: course.par ?? '',
        slope_rating: course.slope_rating ?? '',
        course_rating: course.course_rating ?? '',
        total_yards: course.total_yards ?? '',
        total_meters: course.total_meters ?? '',
        designer: course.designer ?? '',
        established: course.established ?? '',
        website: course.website ?? '',
        phone: course.phone ?? '',
        latitude: course.latitude ?? '',
        longitude: course.longitude ?? '',
        holes:
          course.holes && course.holes.length > 0
            ? course.holes
            : EMPTY_DRAFT.holes,
      })
      setShowHoles(!!course.holes && course.holes.length > 0)
    } else {
      setDraft(EMPTY_DRAFT)
      setShowHoles(false)
    }
  }, [open, course])

  if (!open) return null

  const canSave = draft.name.trim().length > 0

  const handleSave = async () => {
    if (!canSave) return

    const num = (v: number | '') => (v === '' ? undefined : Number(v))

    const payload: CourseInput = {
      name: draft.name.trim(),
      city: draft.city || undefined,
      country: draft.country || undefined,
      country_code: draft.country_code || undefined,
      course_type: draft.course_type || undefined,
      par: num(draft.par),
      slope_rating: num(draft.slope_rating),
      course_rating: num(draft.course_rating),
      total_yards: num(draft.total_yards),
      total_meters: num(draft.total_meters),
      designer: draft.designer || undefined,
      established: num(draft.established),
      website: draft.website || undefined,
      phone: draft.phone || undefined,
      latitude: num(draft.latitude),
      longitude: num(draft.longitude),
      holes: showHoles ? draft.holes : undefined,
    }

    let saved: Course
    if (isEdit && course) {
      saved = await update.mutateAsync({ id: course.id, data: payload })
    } else {
      saved = await create.mutateAsync(payload)
    }
    onSaved?.(saved)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50">
      <div
        className="bg-bg border-l border-line-strong w-full max-w-[640px] flex flex-col"
        role="dialog"
        aria-modal
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-strong">
          <div>
            <div className="micro">{isEdit ? 'EDIT COURSE' : 'ADD COURSE'}</div>
            <div className="display text-[24px] mt-1">
              {isEdit ? 'Update' : 'Log'} the <em>course.</em>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mono text-[10px] text-ink-3 hover:text-ink uppercase tracking-micro"
          >
            CLOSE ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Section title="IDENTITY">
            <Field label="COURSE NAME *">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Oslo Golf Club"
                className="input"
              />
            </Field>
            <Row>
              <Field label="CITY">
                <input
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="COUNTRY">
                <input
                  value={draft.country}
                  onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="ISO CODE">
                <input
                  value={draft.country_code}
                  onChange={(e) =>
                    setDraft({ ...draft, country_code: e.target.value.toUpperCase() })
                  }
                  maxLength={3}
                  placeholder="NO"
                  className="input"
                />
              </Field>
            </Row>
            <Row>
              <Field label="DESIGNER">
                <input
                  value={draft.designer}
                  onChange={(e) => setDraft({ ...draft, designer: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="ESTABLISHED">
                <input
                  type="number"
                  value={draft.established}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      established: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </Field>
              <Field label="TYPE">
                <select
                  value={draft.course_type}
                  onChange={(e) => setDraft({ ...draft, course_type: e.target.value })}
                  className="input"
                >
                  <option value="">—</option>
                  {COURSE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </Row>
          </Section>

          <Section title="RATINGS">
            <Row>
              <Field label="PAR">
                <input
                  type="number"
                  value={draft.par}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      par: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </Field>
              <Field label="SLOPE">
                <input
                  type="number"
                  step="1"
                  value={draft.slope_rating}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      slope_rating: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </Field>
              <Field label="COURSE RATING">
                <input
                  type="number"
                  step="0.1"
                  value={draft.course_rating}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      course_rating: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </Field>
            </Row>
            <Row>
              <Field label="TOTAL YARDS">
                <input
                  type="number"
                  value={draft.total_yards}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      total_yards: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </Field>
              <Field label="TOTAL METERS">
                <input
                  type="number"
                  value={draft.total_meters}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      total_meters: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </Field>
            </Row>
          </Section>

          <Section title="LOCATION & CONTACT">
            <Row>
              <Field label="LATITUDE">
                <input
                  type="number"
                  step="0.0001"
                  value={draft.latitude}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      latitude: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </Field>
              <Field label="LONGITUDE">
                <input
                  type="number"
                  step="0.0001"
                  value={draft.longitude}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      longitude: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </Field>
            </Row>
            <Row>
              <Field label="WEBSITE">
                <input
                  value={draft.website}
                  onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                  className="input"
                  placeholder="https://"
                />
              </Field>
              <Field label="PHONE">
                <input
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="input"
                />
              </Field>
            </Row>
          </Section>

          <Section
            title="HOLE-BY-HOLE"
            right={
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowHoles((v) => !v)}
                  className={`mono text-[10px] uppercase tracking-micro px-2 py-1 border ${
                    showHoles
                      ? 'border-accent-fg text-accent-fg'
                      : 'border-line-strong text-ink-3 hover:border-ink-3'
                  }`}
                >
                  {showHoles ? 'INCLUDED' : 'OPTIONAL'}
                </button>
                {showHoles && (
                  <div className="flex gap-1">
                    {(['yards', 'meters'] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`mono text-[10px] uppercase tracking-micro px-2 py-1 border ${
                          unit === u
                            ? 'border-accent-fg text-accent-fg'
                            : 'border-line-strong text-ink-3'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            {showHoles ? (
              <HoleTable
                holes={draft.holes}
                onChange={(holes) => setDraft({ ...draft, holes })}
                unit={unit}
              />
            ) : (
              <p className="text-body text-ink-3">
                Skip the per-hole layout if you only need a top-line rating. You can
                always come back and add it later.
              </p>
            )}
          </Section>
        </div>

        <div className="border-t border-line-strong px-5 py-4 flex items-center justify-between">
          <div className="mono text-[10px] text-ink-3 tracking-micro">
            {draft.name || '—'}
            {draft.country ? ` · ${draft.country}` : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-transparent text-ink-2 border border-line-strong px-4 py-2.5 mono text-[10px] uppercase tracking-micro hover:border-ink-3"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || create.isPending || update.isPending}
              className="bg-accent text-accent-ink px-4 py-2.5 mono text-[10px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
            >
              {isEdit ? 'SAVE COURSE' : 'CREATE COURSE'} →
            </button>
          </div>
        </div>
      </div>

      <style>{`.input{width:100%;background:var(--bg-2);border:1px solid var(--line-strong);color:var(--ink);padding:8px 12px;font-family:var(--font-mono);font-size:12px}.input:focus{outline:none;border-color:var(--accent)}`}</style>
    </div>
  )
}

function Section({
  title,
  right,
  children,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border border-line-strong">
      <div className="flex items-center justify-between px-3 py-2 border-b border-line-strong bg-bg-2">
        <span className="micro">{title}</span>
        {right}
      </div>
      <div className="p-3 space-y-3">{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="micro mb-1.5">{label}</div>
      {children}
    </label>
  )
}

export default CourseEditor
