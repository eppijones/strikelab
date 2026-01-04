import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ScoreRing } from '@/components/ui'

// Demo training plan data
const demoPlan = {
  name: 'Face Control Focus',
  weeks: 4,
  currentWeek: 2,
  focusArea: 'Face Control',
  adherence: 75,
  schedule: [
    { day: 'Monday', type: 'Drill', duration: 45, completed: true },
    { day: 'Wednesday', type: 'Pressure', duration: 30, completed: true },
    { day: 'Friday', type: 'Testing', duration: 60, completed: false },
  ],
  drills: [
    {
      name: 'Pause at Top',
      description: 'Hold 2 seconds at top of backswing before starting down',
      reps: 10,
      club: '7 Iron',
    },
    {
      name: 'Eyes Closed Backswing',
      description: 'Close eyes during backswing to enhance feel',
      reps: 10,
      club: '7 Iron',
    },
    {
      name: 'Half Swing Face Control',
      description: 'Half swings focusing on face awareness',
      reps: 15,
      club: 'PW',
    },
  ],
  validationMetrics: {
    faceToPath: { baseline: 3.2, target: 2.0, current: 2.8 },
    strikeScore: { baseline: 71, target: 80, current: 75 },
  },
}

export default function TrainingPlan() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-ice-white">
            {t('training.title')}
          </h1>
          <p className="text-muted mt-1">{demoPlan.name}</p>
        </div>
        <Badge variant="cyan" size="md">
          {t('training.currentWeek')} {demoPlan.currentWeek} / {demoPlan.weeks}
        </Badge>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <ScoreRing score={demoPlan.adherence} size="sm" label={t('training.adherence')} />
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted mb-2">Focus Area</p>
          <p className="text-xl font-display font-bold text-cyan">{demoPlan.focusArea}</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-muted mb-2">Sessions This Week</p>
          <p className="text-xl font-display font-bold text-ice-white">
            {demoPlan.schedule.filter(s => s.completed).length} / {demoPlan.schedule.length}
          </p>
        </Card>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Week {demoPlan.currentWeek} Schedule</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            {demoPlan.schedule.map((session, i) => (
              <div
                key={i}
                className={`p-4 rounded-button border ${
                  session.completed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-surface border-border'
                }`}
              >
                <p className="text-xs text-muted uppercase tracking-wide">{session.day}</p>
                <p className="text-ice-white font-medium mt-1">{session.type} Session</p>
                <p className="text-sm text-cyan">{session.duration} min</p>
                {session.completed ? (
                  <Badge variant="success" size="sm" className="mt-3">
                    Completed
                  </Badge>
                ) : (
                  <Button variant="secondary" size="sm" className="mt-3">
                    Start Session
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drills */}
      <Card>
        <CardHeader>
          <CardTitle>{t('training.drills')}</CardTitle>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          {demoPlan.drills.map((drill, i) => (
            <div
              key={i}
              className="p-4 rounded-button bg-graphite border border-border"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-ice-white font-medium">{drill.name}</h4>
                  <p className="text-sm text-muted mt-1">{drill.description}</p>
                </div>
                <Badge variant="default" size="sm">
                  {drill.club}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-cyan">{drill.reps} reps</span>
                <Button variant="ghost" size="sm">
                  {t('training.completeDrill')}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Validation Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Metrics</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted">Face-to-Path</span>
                <span className="text-ice-white font-medium">
                  {demoPlan.validationMetrics.faceToPath.current}° → {demoPlan.validationMetrics.faceToPath.target}°
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan rounded-full"
                  style={{
                    width: `${Math.max(0, 100 - (demoPlan.validationMetrics.faceToPath.current / demoPlan.validationMetrics.faceToPath.baseline) * 100 + 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted mt-1">
                Baseline: {demoPlan.validationMetrics.faceToPath.baseline}°
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted">Strike Score</span>
                <span className="text-ice-white font-medium">
                  {demoPlan.validationMetrics.strikeScore.current} → {demoPlan.validationMetrics.strikeScore.target}
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan rounded-full"
                  style={{
                    width: `${((demoPlan.validationMetrics.strikeScore.current - demoPlan.validationMetrics.strikeScore.baseline) / (demoPlan.validationMetrics.strikeScore.target - demoPlan.validationMetrics.strikeScore.baseline)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted mt-1">
                Baseline: {demoPlan.validationMetrics.strikeScore.baseline}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
