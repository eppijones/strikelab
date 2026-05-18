import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { useCourse } from '@/api/courses'
import {
  useBestWindows,
  useCourseConditions,
} from '@/api/tee'
import { Panel, Tag } from '@/components/ui'
import {
  ConditionsRow,
  HeroLandscape,
  HeroKind,
  SunArcStrip,
  WindowCard,
} from '@/components/tee'

const KIND_MAP: Record<string, HeroKind> = {
  parkland: 'parkland',
  links: 'links',
  championship: 'championship',
  lakeside: 'lakeside',
  farmland: 'farmland',
  mountain: 'mountain',
  fjord: 'fjord',
}

export default function TeeCourseHero() {
  const { t, i18n } = useTranslation()
  const { id = '' } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const date = params.get('date') ?? new Date().toISOString().slice(0, 10)

  const { data: course } = useCourse(id)
  const { data: conditions } = useCourseConditions(id, date)
  const { data: windows } = useBestWindows(id, date)

  if (!course) {
    return <div className="text-body text-ink-3">Loading…</div>
  }

  const kind: HeroKind = KIND_MAP[course.course_type ?? ''] ?? 'parkland'

  // Highlight band — first window is "best".
  const best = windows?.[0]

  return (
    <div className="max-w-[1180px] mx-auto space-y-6">
      <div className="relative overflow-hidden tee-card">
        <HeroLandscape kind={kind} height={360} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(14,20,16,0.06) 0%, rgba(14,20,16,0.08) 45%, rgba(244,240,232,0.94) 100%)',
          }}
        />
        <div className="absolute left-5 right-5 bottom-6 sm:left-8 sm:right-8">
          <Link
            to="/tee"
            className="tee-pill hover:border-ink-3"
          >
            ← {t('tee.discover')}
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="tee-pill bg-[var(--ink)] text-[var(--surface-solid)] border-transparent">BOOKING BETA</span>
            <span className="tee-pill">
              {[course.city, course.region].filter(Boolean).join(' · ')}
            </span>
          </div>
          <div className="micro mt-4">
            {[course.city, course.region].filter(Boolean).join(' · ').toUpperCase()}
          </div>
          <h1 className="display text-[clamp(3rem,8vw,6.5rem)] m-0 mt-1">{course.name}</h1>
          <div className="mt-2 flex items-center gap-3 mono text-[12px] text-ink-2">
            {course.par != null && <span>PAR {course.par}</span>}
            {course.total_meters != null && <span>· {course.total_meters} m</span>}
            {course.holes_count != null && <span>· {course.holes_count} HOLES</span>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel
          id="C1"
          title={t('tee.conditions').toUpperCase()}
          right={
            <span className="flex items-center gap-1.5 micro text-accent-fg">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {t('tee.live')} · {t('tee.justNow')}
            </span>
          }
        >
          <ConditionsRow conditions={conditions} hour={14} />
        </Panel>
        <Panel id="C2" title={t('tee.todaysWindow').toUpperCase()}>
          <SunArcStrip
            conditions={conditions}
            highlightStart={best?.start_hour}
            highlightEnd={best?.end_hour}
          />
          <div className="mono text-[10.5px] text-ink-3 mt-2 flex items-center justify-between">
            <span>
              {conditions?.sunrise} ↗ ↘ {conditions?.sunset}
            </span>
            {conditions?.golden_start && (
              <span>GOLDEN {conditions.golden_start}</span>
            )}
          </div>
        </Panel>
        <Panel id="C3" title={t('tee.twilightRate').toUpperCase()}>
          <div className="display text-[28px]">
            {/* show the off price from any twilight slot — kept inert here */}
            {/* this is a static panel; the canonical price comes from the sheet */}
            From <em>twilight.</em>
          </div>
          <p className="text-body text-ink-2 mt-2 text-[13px]">
            {t('tee.afterTime', { time: '17:00' })}
          </p>
          <Link
            to={`/tee/courses/${id}/sheet?date=${date}`}
            className="mt-4 tee-cta px-5 py-3 mono text-[11px] uppercase tracking-micro"
          >
            {t('tee.openSheet')} →
          </Link>
        </Panel>
      </div>

      {/* Best Windows */}
      <Panel id="C4" title={t('tee.bestWindows').toUpperCase()}>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {(windows ?? []).map((w) => (
            <WindowCard
              key={w.label}
              window={w}
              language={i18n.language as 'en' | 'no'}
            />
          ))}
          {!windows?.length && (
            <div className="text-body text-ink-3 py-4">{t('tee.noBest')}</div>
          )}
        </div>
      </Panel>

      <div className="sticky bottom-4 tee-card p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="micro">Demo booking</div>
          <div className="text-[14px] text-ink-2 mt-1">Availability and partner integrations are beta while this flow matures.</div>
        </div>
        <Link
          to={`/tee/courses/${id}/sheet?date=${date}&view=grid`}
          className="tee-cta px-5 py-3 mono text-[11px] uppercase tracking-micro"
        >
          {t('tee.openSheet')} →
        </Link>
        <Link
          to={`/tee/courses/${id}/sheet?date=${date}&view=window`}
          className="tee-pill justify-center"
        >
          {t('tee.openWindow')} →
        </Link>
        <Link
          to={`/courses/${id}`}
          className="sm:ml-auto mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-ink"
        >
          {t('tee.signature')} →
        </Link>
      </div>
    </div>
  )
}
