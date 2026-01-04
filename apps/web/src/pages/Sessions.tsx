import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSessions } from '@/api/sessions'
import { Card, Button, Badge, ToggleGroup } from '@/components/ui'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-theme-text-primary">
            {t('sessions.title')}
          </h1>
          <p className="text-theme-text-muted mt-1">
            {data?.total || 0} sessions recorded
          </p>
        </div>
        <Link to="/connectors">
          <Button>{t('sessions.newSession')}</Button>
        </Link>
      </div>

      {/* Filters */}
      <ToggleGroup
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('sessions.filters.all') },
          { value: 'range', label: t('sessions.filters.range') },
          { value: 'simulator', label: t('sessions.filters.simulator') },
          { value: 'round', label: t('sessions.filters.round') },
        ]}
      />

      {/* Sessions List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24 shimmer" />
          ))}
        </div>
      ) : data?.sessions && data.sessions.length > 0 ? (
        <div className="grid gap-4">
          {data.sessions.map((session) => (
            <Link key={session.id} to={`/sessions/${session.id}`}>
              <Card variant="hover" className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-theme-text-primary">
                        {session.name || `${session.source} Session`}
                      </h3>
                      <Badge variant="cyan" size="sm">
                        {session.source}
                      </Badge>
                    </div>
                    <p className="text-theme-text-muted mt-1">
                      {formatDate(session.session_date)} • {session.shot_count}{' '}
                      {t('sessions.shotCount')}
                    </p>
                    {session.computed_stats?.clubs_used && (
                      <div className="flex gap-2 mt-3">
                        {session.computed_stats.clubs_used.slice(0, 4).map((club) => (
                          <span
                            key={club}
                            className="text-xs px-2 py-1 rounded-full bg-theme-bg-surface border border-theme-border text-theme-text-muted"
                          >
                            {club}
                          </span>
                        ))}
                        {session.computed_stats.clubs_used.length > 4 && (
                          <span className="text-xs text-theme-text-muted">
                            +{session.computed_stats.clubs_used.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 text-right">
                    {session.computed_stats?.strike_score && (
                      <div>
                        <p className="text-2xl font-display font-bold text-theme-accent">
                          {Math.round(session.computed_stats.strike_score)}
                        </p>
                        <p className="text-xs text-theme-text-muted">{t('scores.strikeScore')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-theme-text-muted text-lg">{t('dashboard.noSessions')}</p>
          <Link to="/connectors">
            <Button className="mt-4">{t('connectors.importCSV')}</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
