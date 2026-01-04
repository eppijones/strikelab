import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/api/sessions'
import { useLogTemplates, useCreateLog, useSessionLog } from '@/api/logs'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  TextArea,
  Select,
  Toggle,
  ScaleInput,
  TagInput,
} from '@/components/ui'
import { FEEL_TAGS } from '@/lib/constants'

export default function SessionLog() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const language = useSettingsStore((state) => state.language)

  const { data: session } = useSession(id!)
  const { data: templates } = useLogTemplates(language)
  const { data: existingLog } = useSessionLog(id!)
  const createLog = useCreateLog()

  // Form state
  const [templateId, setTemplateId] = useState<string>('')
  const [fatigueMode, setFatigueMode] = useState(false)
  const [energyLevel, setEnergyLevel] = useState<number | null>(existingLog?.energy_level || null)
  const [mentalState, setMentalState] = useState<number | null>(existingLog?.mental_state || null)
  const [intent, setIntent] = useState(existingLog?.intent || '')
  const [routineDiscipline, setRoutineDiscipline] = useState(existingLog?.routine_discipline || false)
  const [feelTags, setFeelTags] = useState<string[]>(existingLog?.feel_tags || [])
  const [whatWorked, setWhatWorked] = useState(existingLog?.what_worked || '')
  const [takeForward, setTakeForward] = useState(existingLog?.take_forward || '')
  const [dontOverthink, setDontOverthink] = useState(existingLog?.dont_overthink || '')
  const [coachNote, setCoachNote] = useState(existingLog?.coach_note || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await createLog.mutateAsync({
      session_id: id,
      template_id: templateId || undefined,
      energy_level: energyLevel,
      mental_state: mentalState,
      intent,
      routine_discipline: routineDiscipline,
      feel_tags: feelTags,
      what_worked: whatWorked,
      take_forward: takeForward,
      dont_overthink: dontOverthink,
      coach_note: coachNote,
      fatigue_mode: fatigueMode,
    })

    navigate(`/sessions/${id}`)
  }

  const feelTagOptions = language === 'no' ? FEEL_TAGS.no : FEEL_TAGS.en

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to={`/sessions/${id}`} className="text-muted hover:text-cyan text-sm mb-2 inline-block">
          ← Back to session
        </Link>
        <h1 className="text-2xl font-display font-bold text-ice-white">
          {t('log.title')}
        </h1>
        {session && (
          <p className="text-muted mt-1">
            {session.name || `${session.source} Session`}
          </p>
        )}
      </div>

      {/* Fatigue Mode Toggle */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-ice-white font-medium">{t('log.fatigueMode')}</p>
            <p className="text-sm text-muted">{t('log.fatigueModeDesc')}</p>
          </div>
          <Toggle checked={fatigueMode} onChange={setFatigueMode} />
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        {templates && templates.length > 0 && (
          <Select
            label={t('log.template')}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            options={[
              { value: '', label: 'Select template...' },
              ...templates.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        )}

        {/* Pre-Session (skip if fatigue mode) */}
        {!fatigueMode && (
          <Card>
            <CardHeader>
              <CardTitle>{t('log.preSession')}</CardTitle>
            </CardHeader>
            <CardContent className="mt-4 space-y-6">
              <ScaleInput
                label={t('log.energy')}
                value={energyLevel}
                onChange={setEnergyLevel}
                min={1}
                max={5}
              />

              <ScaleInput
                label={t('log.mentalState')}
                value={mentalState}
                onChange={setMentalState}
                min={1}
                max={5}
              />

              <Input
                label={t('log.intent')}
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder={t('log.intentPlaceholder')}
              />

              <Toggle
                checked={routineDiscipline}
                onChange={setRoutineDiscipline}
                label={t('log.routineDiscipline')}
              />

              <TagInput
                label={t('log.feelTags')}
                value={feelTags}
                onChange={setFeelTags}
                options={feelTagOptions}
              />
            </CardContent>
          </Card>
        )}

        {/* Post-Session */}
        <Card>
          <CardHeader>
            <CardTitle>{t('log.postSession')}</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 space-y-6">
            <TextArea
              label={t('log.whatWorked')}
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder={language === 'no' ? 'Hva fungerte i dag?' : 'What clicked today?'}
            />

            <TextArea
              label={t('log.takeForward')}
              value={takeForward}
              onChange={(e) => setTakeForward(e.target.value)}
              placeholder={language === 'no' ? 'Ett fokuspunkt til neste økt' : 'One focus for next session'}
            />

            <TextArea
              label={t('log.dontOverthink')}
              value={dontOverthink}
              onChange={(e) => setDontOverthink(e.target.value)}
              placeholder={language === 'no' ? 'La dette ligge...' : "Let this go..."}
            />

            <TextArea
              label={t('log.coachNote')}
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              placeholder={language === 'no' ? 'Notat til deg selv' : 'Note to future self'}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/sessions/${id}`)}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={createLog.isPending} className="flex-1">
            {t('log.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
