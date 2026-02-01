import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSessions } from '@/api/sessions'
import { 
  Card, Button, Badge, PillButton,
  FadeIn, StaggerContainer, StaggerItem
} from '@/components/ui'
import { Spotlight } from '@/components/ui/backgrounds'
import { formatDate } from '@/lib/utils'

type SessionFilter = 'all' | 'range' | 'simulator' | 'round'

export default function Sessions() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<SessionFilter>('all')

  const { data, isLoading } = useSessions({
    session_type: filter === 'all' ? undefined : filter,
    limit: 50,
  })

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="relative">
          <Spotlight className="left-0 top-0 -translate-y-1/2" size={400} />
          
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-theme-accent-subtle flex items-center justify-center">
                  <svg className="w-5 h-5 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-theme-text-primary">
                    {t('sessions.title')}
                  </h1>
                  <p className="text-sm text-theme-text-muted">
                    {data?.total || 0} sessions recorded
                  </p>
                </div>
              </div>
            </div>
            
            <Link to="/connectors">
              <Button variant="primary" leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }>
                {t('sessions.newSession')}
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap gap-2">
          {(['all', 'range', 'simulator', 'round'] as const).map((value) => (
            <PillButton
              key={value}
              variant="secondary"
              active={filter === value}
              onClick={() => setFilter(value)}
            >
              {t(`sessions.filters.${value}`)}
            </PillButton>
          ))}
        </div>
      </FadeIn>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-28 shimmer" />
          ))}
        </div>
      ) : data?.sessions && data.sessions.length > 0 ? (
        <StaggerContainer className="space-y-3" staggerDelay={0.05}>
          {data.sessions.map((session) => (
            <StaggerItem key={session.id}>
              <Link to={`/sessions/${session.id}`}>
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <Card variant="interactive" padding="md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-theme-text-primary group-hover:text-theme-accent transition-colors truncate">
                            {session.name || `${session.source} Session`}
                          </h3>
                          <Badge variant="accent" size="sm">{session.source}</Badge>
                          {session.shot_count > 100 && (
                            <Badge variant="success" size="sm">Pro</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-theme-text-muted mb-3">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            {formatDate(session.session_date)}
                          </span>
                          <span className="text-theme-border">•</span>
                          <span>{session.shot_count} {t('sessions.shotCount', 'shots')}</span>
                        </div>
                        
                        {session.computed_stats?.clubs_used && session.computed_stats.clubs_used.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {session.computed_stats.clubs_used.slice(0, 5).map((club) => (
                              <span
                                key={club}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-theme-bg-surface border border-theme-border text-theme-text-muted"
                              >
                                {club}
                              </span>
                            ))}
                            {session.computed_stats.clubs_used.length > 5 && (
                              <span className="text-[10px] text-theme-text-muted self-center">
                                +{session.computed_stats.clubs_used.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-4">
                        {session.computed_stats?.strike_score && (
                          <div className="text-right">
                            <p className="text-3xl font-semibold text-theme-accent">
                              {Math.round(session.computed_stats.strike_score)}
                            </p>
                            <p className="text-[10px] text-theme-text-muted uppercase tracking-wider">
                              {t('scores.strikeScore')}
                            </p>
                          </div>
                        )}
                        
                        {/* Arrow indicator */}
                        <svg 
                          className="w-5 h-5 text-theme-text-muted group-hover:text-theme-accent group-hover:translate-x-1 transition-all" 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <FadeIn>
          <Card className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-theme-accent-subtle flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <p className="text-theme-text-primary text-lg font-medium mb-2">
              {t('sessions.empty', 'No sessions yet')}
            </p>
            <p className="text-sm text-theme-text-muted mb-6 max-w-sm mx-auto">
              {t('sessions.emptyDescription', 'Import your first session to start tracking your progress.')}
            </p>
            <Link to="/connectors">
              <Button variant="primary">{t('connectors.importCSV')}</Button>
            </Link>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}
