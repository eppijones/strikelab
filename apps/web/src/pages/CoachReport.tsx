import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCoachReports, useGenerateReport } from '@/api/coach'
import { useSessions } from '@/api/sessions'
import { 
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Select,
  NeuralIcon, StatusPulse, FadeIn, StaggerContainer, StaggerItem,
  DiagnosisProgress, DialedBadge, Spotlight
} from '@/components/ui'
import { formatDate } from '@/lib/utils'

// Icons for each phase
const PhaseIcons = {
  diagnose: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  interpret: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  prescribe: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
    </svg>
  ),
  validate: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
}

interface ReportPhaseProps {
  phase: 'diagnose' | 'interpret' | 'prescribe' | 'validate'
  title: string
  content: string | null
  isActive?: boolean
  isHighlighted?: boolean
}

function ReportPhase({ phase, title, content, isActive, isHighlighted }: ReportPhaseProps) {
  const phaseColors = {
    diagnose: 'from-cyan-500/20 to-transparent border-cyan-500/30 text-cyan-400',
    interpret: 'from-violet-500/20 to-transparent border-violet-500/30 text-violet-400',
    prescribe: 'from-theme-accent/20 to-transparent border-theme-accent/30 text-theme-accent',
    validate: 'from-theme-success/20 to-transparent border-theme-success/30 text-theme-success',
  }

  const iconColors = {
    diagnose: 'bg-cyan-500/20 text-cyan-400',
    interpret: 'bg-violet-500/20 text-violet-400',
    prescribe: 'bg-theme-accent/20 text-theme-accent',
    validate: 'bg-theme-success/20 text-theme-success',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        relative p-5 rounded-xl border transition-all duration-300
        ${isHighlighted 
          ? `bg-gradient-to-br ${phaseColors[phase]} shadow-glow-sm` 
          : 'bg-theme-bg-surface/30 border-theme-border hover:border-theme-border-glow'
        }
      `}
    >
      {/* Phase indicator line */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b ${
        phase === 'diagnose' ? 'from-cyan-500 to-cyan-500/20' :
        phase === 'interpret' ? 'from-violet-500 to-violet-500/20' :
        phase === 'prescribe' ? 'from-theme-accent to-theme-accent/20' :
        'from-theme-success to-theme-success/20'
      }`} />

      <div className="flex items-start gap-4 pl-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColors[phase]}`}>
          {PhaseIcons[phase]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${
            isHighlighted ? phaseColors[phase].split(' ').pop() : 'text-theme-text-muted'
          }`}>
            {title}
          </h3>
          <p className="text-theme-text-primary leading-relaxed">
            {content || 'Analysis pending...'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function CoachReport() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const sessionIdParam = searchParams.get('session')
  
  const [selectedSession, setSelectedSession] = useState(sessionIdParam || '')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
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

  const latestReport = reports?.[0]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="relative">
          <Spotlight className="left-0 top-0 -translate-y-1/2" size={500} />
          
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <NeuralIcon size="md" variant="active" />
                <h1 className="text-3xl font-display font-bold text-theme-text-primary">
                  {t('coach.title')}
                </h1>
              </div>
              <p className="text-theme-text-muted flex items-center gap-2">
                <StatusPulse status="active" size="xs" />
                Neural analysis powered by Sophy v2.4
              </p>
            </div>

            <Link to="/coach/chat">
              <Button variant="gradient" leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              }>
                Chat with Coach
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Workflow Steps */}
      <FadeIn delay={0.1}>
        <div className="flex items-center justify-center gap-4 py-4 overflow-x-auto">
          {['Diagnose', 'Interpret', 'Prescribe', 'Validate'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${i === 0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                  i === 1 ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' :
                  i === 2 ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/30' :
                  'bg-theme-success/20 text-theme-success border border-theme-success/30'
                }
              `}>
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                {step}
              </div>
              {i < 3 && (
                <svg className="w-6 h-6 mx-2 text-theme-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Generate New Report */}
      <FadeIn delay={0.2}>
        <Card variant="neural" padding="none">
          <div className="p-6 border-b border-theme-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-theme-accent-dim flex items-center justify-center">
                <svg className="w-4 h-4 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-theme-text-primary">{t('coach.generateReport')}</h2>
                <p className="text-xs text-theme-text-muted">Select a session to analyze</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  options={[
                    { value: '', label: 'Select a session...' },
                    ...(sessions?.sessions || []).map((s) => ({
                      value: s.id,
                      label: `${s.name || s.source} - ${formatDate(s.session_date)} (${s.shot_count} shots)`,
                    })),
                  ]}
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!selectedSession}
                isLoading={generateReport.isPending}
                variant="gradient"
                leftIcon={<NeuralIcon size="xs" variant="processing" animate={generateReport.isPending} />}
              >
                Analyze
              </Button>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Reports List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[1, 2].map((i) => (
              <Card key={i} className="h-64 shimmer" />
            ))}
          </motion.div>
        ) : reports && reports.length > 0 ? (
          <StaggerContainer className="space-y-6" staggerDelay={0.1}>
            {reports.map((report) => (
              <StaggerItem key={report.id}>
                <motion.div
                  layout
                  className="overflow-hidden"
                >
                  <Card variant="glow" padding="none" className="overflow-hidden">
                    {/* Report Header */}
                    <div className="p-6 border-b border-theme-border bg-gradient-to-r from-theme-bg-surface to-transparent">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <NeuralIcon size="md" variant="success" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-theme-success border-2 border-theme-bg-surface" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="cyan">{report.report_type}</Badge>
                              <DialedBadge state="locked" />
                            </div>
                            <p className="text-sm text-theme-text-muted">
                              {formatDate(report.created_at)} • Session #{report.session_id?.slice(-4)}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                        >
                          {expandedReport === report.id ? 'Collapse' : 'Expand'}
                          <motion.svg 
                            className="w-4 h-4 ml-1"
                            animate={{ rotate: expandedReport === report.id ? 180 : 0 }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </motion.svg>
                        </Button>
                      </div>
                    </div>

                    {/* Report Content */}
                    <AnimatePresence>
                      <motion.div
                        initial={{ height: 'auto' }}
                        animate={{ height: 'auto' }}
                        className="p-6"
                      >
                        <div className="grid gap-4">
                          <ReportPhase 
                            phase="diagnose"
                            title={t('coach.diagnosis')}
                            content={report.diagnosis}
                          />
                          
                          {(expandedReport === report.id || !expandedReport) && (
                            <>
                              <ReportPhase 
                                phase="interpret"
                                title={t('coach.interpretation')}
                                content={report.interpretation}
                              />
                              
                              <ReportPhase 
                                phase="prescribe"
                                title={t('coach.prescription')}
                                content={report.prescription}
                                isHighlighted
                              />
                              
                              <ReportPhase 
                                phase="validate"
                                title={t('coach.validation')}
                                content={report.validation}
                              />
                            </>
                          )}
                        </div>

                        {/* Next Best Move */}
                        {report.next_best_move && (
                          <motion.div 
                            className="mt-6 p-5 rounded-xl bg-gradient-to-br from-violet-500/15 to-theme-bg-surface/30 border border-violet-500/30"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <StatusPulse status="processing" size="xs" />
                                  <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">
                                    {t('coach.nextBestMove')}
                                  </h3>
                                </div>
                                <p className="text-lg font-medium text-theme-text-primary">
                                  {report.next_best_move}
                                </p>
                              </div>
                              <Link to="/training">
                                <Button variant="secondary" size="sm">
                                  Start Drill
                                </Button>
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Report Footer */}
                    <div className="px-6 py-4 border-t border-theme-border bg-theme-bg-surface/30 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                        <StatusPulse status="idle" size="xs" />
                        <span>Model: Sophy v2.4</span>
                        <span className="text-theme-border">•</span>
                        <span>ID: {report.id.slice(-8).toUpperCase()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="xs">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                          </svg>
                          Share
                        </Button>
                        <Button variant="ghost" size="xs">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Export
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <FadeIn>
            <Card className="text-center py-16">
              <NeuralIcon size="lg" variant="default" className="mx-auto mb-4" />
              <p className="text-theme-text-muted text-lg mb-2">{t('coach.noReports')}</p>
              <p className="text-sm text-theme-text-muted">
                Select a session above to generate your first AI coaching report.
              </p>
            </Card>
          </FadeIn>
        )}
      </AnimatePresence>
    </div>
  )
}
