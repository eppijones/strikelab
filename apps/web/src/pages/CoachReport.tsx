import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useCoachReports, useGenerateReport } from '@/api/coach'
import { useSessions } from '@/api/sessions'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'

export default function CoachReport() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const sessionIdParam = searchParams.get('session')
  
  const [selectedSession, setSelectedSession] = useState(sessionIdParam || '')
  const { data: sessions } = useSessions({ limit: 20 })
  const { data: reports, isLoading } = useCoachReports(selectedSession || undefined)
  const generateReport = useGenerateReport()

  const handleGenerate = async () => {
    if (!selectedSession) return
    await generateReport.mutateAsync({
      session_id: selectedSession,
      language: 'en',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-ice-white">
            {t('coach.title')}
          </h1>
          <p className="text-muted mt-1">
            Diagnose → Interpret → Prescribe → Validate
          </p>
        </div>
      </div>

      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle>{t('coach.generateReport')}</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                options={[
                  { value: '', label: 'Select a session...' },
                  ...(sessions?.sessions || []).map((s) => ({
                    value: s.id,
                    label: `${s.name || s.source} - ${formatDate(s.session_date)}`,
                  })),
                ]}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!selectedSession}
              isLoading={generateReport.isPending}
            >
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="h-64 shimmer" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id} variant="glow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Badge variant="cyan">{report.report_type}</Badge>
                    <p className="text-sm text-muted mt-2">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Diagnosis */}
                  <div>
                    <h3 className="text-sm font-medium text-cyan uppercase tracking-wide mb-2">
                      {t('coach.diagnosis')}
                    </h3>
                    <p className="text-ice-white leading-relaxed">
                      {report.diagnosis || 'No diagnosis available.'}
                    </p>
                  </div>

                  {/* Interpretation */}
                  <div>
                    <h3 className="text-sm font-medium text-cyan uppercase tracking-wide mb-2">
                      {t('coach.interpretation')}
                    </h3>
                    <p className="text-ice-white leading-relaxed">
                      {report.interpretation || 'No interpretation available.'}
                    </p>
                  </div>

                  {/* Prescription */}
                  <div className="p-4 rounded-button bg-cyan/10 border border-cyan/30">
                    <h3 className="text-sm font-medium text-cyan uppercase tracking-wide mb-2">
                      {t('coach.prescription')}
                    </h3>
                    <p className="text-ice-white leading-relaxed">
                      {report.prescription || 'No prescription available.'}
                    </p>
                  </div>

                  {/* Validation */}
                  <div>
                    <h3 className="text-sm font-medium text-cyan uppercase tracking-wide mb-2">
                      {t('coach.validation')}
                    </h3>
                    <p className="text-muted leading-relaxed">
                      {report.validation || 'No validation criteria.'}
                    </p>
                  </div>

                  {/* Next Best Move */}
                  {report.next_best_move && (
                    <div className="p-4 rounded-button bg-surface border border-border">
                      <h3 className="text-sm font-medium text-ice-white mb-2">
                        ⚡ {t('coach.nextBestMove')}
                      </h3>
                      <p className="text-cyan font-medium">
                        {report.next_best_move}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-muted text-lg">{t('coach.noReports')}</p>
          <p className="text-sm text-muted mt-2">
            Select a session above to generate your first report.
          </p>
        </Card>
      )}
    </div>
  )
}
