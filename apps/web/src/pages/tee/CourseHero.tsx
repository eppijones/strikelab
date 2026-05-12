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
    <div className="space-y-6">
      <div className="relative -mx-8 -mt-8">
        <HeroLandscape kind={kind} height={280} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,11,10,0) 0%, rgba(10,11,10,0.5) 60%, var(--bg) 100%)',
          }}
        />
        <div className="absolute left-8 right-8 bottom-6">
          <Link
            to="/tee"
            className="mono text-[11px] uppercase tracking-micro text-ink-2 hover:text-ink"
          >
            ← {t('tee.discover')}
          </Link>
          <div className="micro mt-3">
            {[course.city, course.region].filter(Boolean).join(' · ').toUpperCase()}
          </div>
          <h1 className="display text-[64px] m-0 mt-1">{course.name}</h1>
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
            className="mt-4 inline-flex items-center gap-2 bg-accent text-accent-ink px-4 py-2.5 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
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

      <div className="flex items-center gap-3">
        <Link
          to={`/tee/courses/${id}/sheet?date=${date}&view=grid`}
          className="bg-accent text-accent-ink px-4 py-2.5 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
        >
          {t('tee.openSheet')} →
        </Link>
        <Link
          to={`/tee/courses/${id}/sheet?date=${date}&view=window`}
          className="border border-line-strong px-4 py-2.5 mono text-[11px] uppercase tracking-micro text-ink-2 hover:text-ink hover:border-ink-3"
        >
          {t('tee.openWindow')} →
        </Link>
        <Link
          to={`/courses/${id}`}
          className="ml-auto mono text-[10px] uppercase tracking-micro text-ink-3 hover:text-ink"
        >
          {t('tee.signature')} →
        </Link>
      </div>
    </div>
  )
}
