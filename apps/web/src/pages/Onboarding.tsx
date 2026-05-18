import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuthStore, type Persona } from '@/stores/authStore'
import { useUpdateProfile } from '@/api/auth'
import { useMyBag, useQuickAddClubs } from '@/api/equipment'
import { useCourses, type Course } from '@/api/courses'
import { useSettingsStore } from '@/stores/settingsStore'
import { Panel, SLLogo } from '@/components/ui'
import { QuickBagStep, quickBagToPayload } from '@/components/bag/QuickBagStep'

type Step = 'language' | 'persona' | 'home_club' | 'handicap' | 'bag' | 'review'

const PERSONAS: Array<{
  value: Persona
  titleKey: string
  bodyKey: string
}> = [
  {
    value: 'beginner',
    titleKey: 'onboarding.personaBeginnerTitle',
    bodyKey: 'onboarding.personaBeginnerBody',
  },
  {
    value: 'improver',
    titleKey: 'onboarding.personaImproverTitle',
    bodyKey: 'onboarding.personaImproverBody',
  },
  {
    value: 'performance',
    titleKey: 'onboarding.personaPerformanceTitle',
    bodyKey: 'onboarding.personaPerformanceBody',
  },
]

/**
 * Build the steps that apply to a given persona. Beginner skips bag and
 * doesn't require a handicap; Improver gets handicap; Performance gets
 * the full flow including bag setup. Order is stable so the progress
 * bar stays predictable.
 */
function stepsFor(persona: Persona | null): Step[] {
  const base: Step[] = ['language', 'persona', 'home_club']
  if (!persona) return [...base, 'review']
  if (persona === 'beginner') return [...base, 'review']
  if (persona === 'improver') return [...base, 'handicap', 'review']
  return [...base, 'handicap', 'bag', 'review']
}

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useUpdateProfile()
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const { data: bag } = useMyBag()
  const quickAdd = useQuickAddClubs()

  // Default the home-club search to Norway since that's where the
  // current rollout is. The user can clear the search field freely.
  const [step, setStep] = useState<Step>('language')
  const [persona, setPersona] = useState<Persona | null>(
    (user?.persona as Persona | undefined) ?? null
  )
  const [homeClubId, setHomeClubId] = useState<string | null>(
    user?.homeClubId ?? null
  )
  const [homeClubName, setHomeClubName] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [handicap, setHandicap] = useState<string>(
    user?.handicapIndex?.toString() ?? ''
  )
  const [goal, setGoal] = useState<string>(user?.goalHandicap?.toString() ?? '')
  const [bagSelections, setBagSelections] = useState<boolean[]>([])

  const steps = useMemo(() => stepsFor(persona), [persona])
  const stepIdx = steps.indexOf(step)

  // Keep i18n in lockstep with the picker so subsequent screens are
  // already translated by the time the user clicks "Next".
  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language)
  }, [language, i18n])

  const { data: courses = [], isLoading: coursesLoading } = useCourses({
    country_code: 'NO',
    q: search || undefined,
    limit: 30,
  })

  function goNext() {
    const idx = steps.indexOf(step)
    if (idx >= 0 && idx < steps.length - 1) setStep(steps[idx + 1])
  }
  function goBack() {
    const idx = steps.indexOf(step)
    if (idx > 0) setStep(steps[idx - 1])
  }

  async function finish() {
    if (persona === 'performance' && bag?.id) {
      const payload = quickBagToPayload(bagSelections)
      if (payload.length > 0) {
        try {
          await quickAdd.mutateAsync({ bagId: bag.id, clubs: payload })
        } catch {
          // Don't block onboarding on bag failure.
        }
      }
    }

    await updateProfile.mutateAsync({
      persona: persona ?? 'improver',
      home_club_id: homeClubId,
      handicap_index: handicap ? parseFloat(handicap) : undefined,
      goal_handicap: goal ? parseFloat(goal) : undefined,
      language,
      onboarding_completed: true,
    })
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <SLLogo size={32} withWord wordSize={20} condensed />
          <div className="mono text-[10px] uppercase tracking-micro text-ink-3 mt-4">
            {t('onboarding.welcome')}
          </div>
        </div>

        <div className="flex gap-1">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 ${i <= stepIdx ? 'bg-accent' : 'bg-bg-2'}`}
            />
          ))}
        </div>

        {step === 'language' && (
          <Panel id="01" title={t('onboarding.language').toUpperCase()}>
            <p className="text-body text-ink-2 mb-4">
              {t('onboarding.languageSub')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['no', 'en'] as const).map((code) => {
                const active = language === code
                return (
                  <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`text-left p-4 border ${
                      active
                        ? 'border-accent-fg text-accent-fg'
                        : 'border-line-strong text-ink-2 hover:border-ink-3'
                    }`}
                  >
                    <div className="display text-[28px]">
                      {code === 'no' ? 'Norsk' : 'English'}
                    </div>
                    <div className="mono text-[10px] uppercase tracking-micro text-ink-3 mt-1">
                      {code === 'no' ? 'NO · Bokmål' : 'EN · International'}
                    </div>
                  </button>
                )
              })}
            </div>
            <Nav
              onBack={null}
              onNext={goNext}
              nextLabel={t('onboarding.begin')}
            />
          </Panel>
        )}

        {step === 'persona' && (
          <Panel id="02" title={t('onboarding.persona').toUpperCase()}>
            <p className="text-body text-ink-2 mb-4">
              {t('onboarding.personaSub')}
            </p>
            <div className="grid gap-3">
              {PERSONAS.map((p) => {
                const active = persona === p.value
                return (
                  <button
                    key={p.value}
                    onClick={() => setPersona(p.value)}
                    className={`text-left p-4 border ${
                      active
                        ? 'border-accent-fg'
                        : 'border-line-strong hover:border-ink-3'
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="display text-[24px] text-ink">
                        {t(p.titleKey)}
                      </span>
                      <span className="mono text-[10px] uppercase tracking-micro text-ink-3">
                        {p.value}
                      </span>
                    </div>
                    <p className="text-[14px] text-ink-2 mt-1.5 leading-[1.5]">
                      {t(p.bodyKey)}
                    </p>
                  </button>
                )
              })}
            </div>
            <Nav onBack={goBack} onNext={goNext} disabled={!persona} />
          </Panel>
        )}

        {step === 'home_club' && (
          <Panel
            id="03"
            title={t('onboarding.homeClub').toUpperCase()}
            right={
              <button
                onClick={() => {
                  setHomeClubId(null)
                  setHomeClubName('')
                  goNext()
                }}
                className="mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-accent-fg"
              >
                {t('onboarding.homeClubSkip').toUpperCase()} →
              </button>
            }
          >
            <p className="text-body text-ink-2 mb-4">
              {t('onboarding.homeClubSub')}
            </p>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('onboarding.homeClubSearch')}
              className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
            />
            <div className="mt-3 max-h-[280px] overflow-y-auto border border-line">
              {coursesLoading && (
                <div className="p-4 mono text-[10px] text-ink-3 uppercase tracking-micro">
                  {t('common.loading')}
                </div>
              )}
              {!coursesLoading && courses.length === 0 && (
                <div className="p-4 text-ink-3 text-body">
                  {t('onboarding.homeClubNoResults')}
                </div>
              )}
              {courses.map((c: Course) => {
                const active = homeClubId === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setHomeClubId(c.id)
                      setHomeClubName(c.name)
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-line flex items-baseline gap-3 ${
                      active
                        ? 'bg-bg-2 text-accent-fg'
                        : 'text-ink hover:bg-bg-2'
                    }`}
                  >
                    <span className="text-[14px] flex-1">{c.name}</span>
                    <span className="mono text-[10px] text-ink-3 uppercase tracking-micro">
                      {[c.region, c.holes_count ? `${c.holes_count}H` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </button>
                )
              })}
            </div>
            <Nav onBack={goBack} onNext={goNext} />
          </Panel>
        )}

        {step === 'handicap' && (
          <Panel id="04" title={t('onboarding.handicap').toUpperCase()}>
            <p className="text-body text-ink-2 mb-4">
              {t('onboarding.handicapSub')}
            </p>
            <div className="micro mb-2">{t('onboarding.handicap').toUpperCase()}</div>
            <input
              type="number"
              step="0.1"
              value={handicap}
              onChange={(e) => setHandicap(e.target.value)}
              placeholder="e.g. 12.4"
              className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
            />
            <div className="micro mt-4 mb-2">
              {t('onboarding.goalHandicap').toUpperCase()}
            </div>
            <input
              type="number"
              step="0.1"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. 6.0"
              className="w-full bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
            />
            <Nav onBack={goBack} onNext={goNext} />
          </Panel>
        )}

        {step === 'bag' && (
          <Panel
            id="05"
            title={t('onboarding.bag').toUpperCase()}
            right={
              <button
                onClick={goNext}
                className="mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-accent-fg"
              >
                {t('onboarding.skip').toUpperCase()} →
              </button>
            }
          >
            <p className="text-body text-ink-2 mb-4">
              {t('onboarding.bagSub')}
            </p>
            <QuickBagStep value={bagSelections} onChange={setBagSelections} />
            <Nav onBack={goBack} onNext={goNext} />
          </Panel>
        )}

        {step === 'review' && (
          <Panel id="06" title={t('onboarding.review').toUpperCase()}>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t('onboarding.language').toUpperCase()}
                value={language === 'no' ? 'Norsk' : 'English'}
              />
              <Field
                label={t('onboarding.persona').toUpperCase()}
                value={persona ? t(`onboarding.persona${capitalize(persona)}Title`) : '—'}
              />
              <Field
                label={t('onboarding.homeClub').toUpperCase()}
                value={homeClubName || '—'}
              />
              {persona !== 'beginner' && (
                <Field
                  label={t('onboarding.handicap').toUpperCase()}
                  value={handicap || '—'}
                />
              )}
              {persona === 'performance' && (
                <Field
                  label={t('onboarding.bag').toUpperCase()}
                  value={
                    bagSelections.filter(Boolean).length > 0
                      ? `${bagSelections.filter(Boolean).length} CLUBS`
                      : '—'
                  }
                />
              )}
            </div>
            <button
              onClick={finish}
              disabled={updateProfile.isPending || quickAdd.isPending}
              className="mt-6 w-full bg-accent text-accent-ink py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
            >
              {updateProfile.isPending || quickAdd.isPending
                ? t('common.loading')
                : t('onboarding.enterTheBay')}
            </button>
          </Panel>
        )}
      </div>
    </div>
  )
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1)
}

function Nav({
  onBack,
  onNext,
  disabled,
  nextLabel,
}: {
  onBack: (() => void) | null
  onNext: () => void
  disabled?: boolean
  nextLabel?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-between mt-6">
      {onBack ? (
        <button
          onClick={onBack}
          className="bg-transparent text-ink-2 border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3"
        >
          {t('common.back')}
        </button>
      ) : (
        <span />
      )}
      <button
        onClick={onNext}
        disabled={disabled}
        className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
      >
        {nextLabel || t('common.next')} →
      </button>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="micro">{label}</div>
      <div className="text-[16px] text-ink mt-1">{value}</div>
    </div>
  )
}
