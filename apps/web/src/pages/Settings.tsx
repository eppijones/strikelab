import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useUpdateProfile } from '@/api/auth'
import { useSettingsStore } from '@/stores/settingsStore'
import { Panel, Tag } from '@/components/ui'

const PRACTICE_OPTIONS = [
  { value: 'daily', label: 'Daily (7x/week)' },
  { value: '4-5x_week', label: '4-5x / week' },
  { value: '2-3x_week', label: '2-3x / week' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'occasional', label: 'Occasional' },
]

export default function Settings() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { language, setLanguage, units, setUnits, theme, setTheme } = useSettingsStore()
  const updateProfile = useUpdateProfile()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [handicap, setHandicap] = useState(user?.handicapIndex?.toString() || '')
  const [goal, setGoal] = useState(user?.goalHandicap?.toString() || '')
  const [practice, setPractice] = useState(user?.practiceFrequency || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName)
      setHandicap(user.handicapIndex?.toString() || '')
      setGoal(user.goalHandicap?.toString() || '')
      setPractice(user.practiceFrequency || '')
    }
  }, [user])

  async function save() {
    await updateProfile.mutateAsync({
      display_name: displayName,
      handicap_index: handicap ? parseFloat(handicap) : undefined,
      goal_handicap: goal ? parseFloat(goal) : undefined,
      practice_frequency: practice || undefined,
      language,
      units,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">SETTINGS</div>
        <h1 className="display text-[64px] m-0">
          {t('settings.title')}
        </h1>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="PROFILE">
          <Field label="DISPLAY NAME">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
            />
          </Field>
          <Field label="HANDICAP INDEX">
            <input
              value={handicap}
              onChange={(e) => setHandicap(e.target.value)}
              type="number"
              step="0.1"
              className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
            />
          </Field>
          <Field label="GOAL HANDICAP">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              type="number"
              step="0.1"
              className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
            />
          </Field>
          <Field label="PRACTICE FREQUENCY">
            <select
              value={practice}
              onChange={(e) => setPractice(e.target.value)}
              className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
            >
              <option value="">Select…</option>
              {PRACTICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3 mt-6">
            <button
              onClick={save}
              disabled={updateProfile.isPending}
              className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
            >
              Save →
            </button>
            {saved && <Tag tone="accent">SAVED</Tag>}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="PREFERENCES">
            <SegmentedRow
              label="LANGUAGE"
              value={language}
              options={[
                { v: 'en', l: 'EN' },
                { v: 'no', l: 'NO' },
              ]}
              onChange={(v) => setLanguage(v as 'en' | 'no')}
            />
            <SegmentedRow
              label="UNITS"
              value={units}
              options={[
                { v: 'yards', l: 'YARDS' },
                { v: 'meters', l: 'METERS' },
              ]}
              onChange={(v) => setUnits(v as 'yards' | 'meters')}
            />
            <SegmentedRow
              label="THEME"
              value={theme}
              options={[
                { v: 'dark', l: 'DARK' },
                { v: 'light', l: 'LIGHT' },
              ]}
              onChange={(v) => setTheme(v as 'dark' | 'light')}
            />
          </Panel>

          <Panel title="ACCOUNT">
            <div className="micro mb-2">EMAIL</div>
            <div className="mono text-[13px] text-ink mb-4">{user?.email}</div>
            <div className="micro mb-2">USER ID</div>
            <div className="mono text-[11px] text-ink-3 break-all">{user?.id}</div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="micro block mb-2">{label}</label>
      {children}
    </div>
  )
}

function SegmentedRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { v: T; l: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="micro block mb-2">{label}</label>
      <div className="flex border border-line-strong">
        {options.map((o, i) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`flex-1 py-2 mono text-[10px] uppercase tracking-micro ${
              i < options.length - 1 ? 'border-r border-line-strong' : ''
            } ${value === o.v ? 'ui-selected' : 'text-ink-3 hover:text-ink hover:bg-bg-2'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}
