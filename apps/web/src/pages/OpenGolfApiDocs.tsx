import { Link } from 'react-router-dom'

import {
  usePublicApiIndex,
  usePublicBrands,
  usePublicClubModels,
  useGolfCourseAPIStatus,
  usePublicSources,
} from '@/api/publicGolf'
import { Panel, Stat, Tag } from '@/components/ui'

const EXAMPLES = [
  'GET /public/courses?country_code=NO&has_driving_range=true',
  'GET /public/courses/{course_id}/conditions',
  'GET /public/courses/{course_id}/condition-sources',
  'GET /public/courses/{course_id}/geometry',
  'GET /public/equipment/brands',
  'GET /public/plays-like?distance_m=145&wind_ms=5&temp_c=8',
]

export default function OpenGolfApiDocs() {
  const { data: index } = usePublicApiIndex()
  const { data: sources = [] } = usePublicSources()
  const { data: brands = [] } = usePublicBrands()
  const { data: models = [] } = usePublicClubModels()
  const { data: golfCourseApi } = useGolfCourseAPIStatus()

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">DATA › OPEN GOLF API</div>
        <h1 className="display text-[64px] m-0">
          Norway-first <em>golf data.</em>
        </h1>
        <p className="text-body text-ink-2 mt-3 max-w-3xl">
          Public read-only course, condition, equipment, and source metadata for
          StrikeLab. The API exposes factual course data and keeps player
          performance, rounds, bookings, and private caddie intelligence out.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel id="API 01" title="SCOPE">
          <Stat label="MARKET" value="NO" unit="FIRST" />
        </Panel>
        <Panel id="API 02" title="SOURCES">
          <Stat label="ATTRIBUTED" value={sources.length || '—'} />
        </Panel>
        <Panel id="API 03" title="EQUIPMENT">
          <Stat label="CATALOG" value={brands.length} unit={`${models.length} MODELS`} />
        </Panel>
      </div>

      <Panel id="ENDP" title="ENDPOINTS">
        <div className="grid lg:grid-cols-2 gap-3">
          {(index?.endpoints ?? EXAMPLES).map((endpoint) => (
            <code
              key={endpoint}
              className="block border border-line-strong bg-bg-2 px-4 py-3 mono text-[11px] text-ink-2"
            >
              {endpoint}
            </code>
          ))}
        </div>
      </Panel>

      <Panel id="LEGAL" title="LICENSE + ATTRIBUTION">
        <div className="space-y-3">
          <p className="text-body text-ink-2">
            Clients must preserve source attribution from API responses. OSM
            geometry is ODbL-derived, weather data carries MET Norway/Open-Meteo
            attribution, daylight comes from Sunrise-Sunset.org when available,
            and StrikeLab-maintained equipment facts avoid copied proprietary
            marketing text.
          </p>
          <div className="grid lg:grid-cols-2 gap-3">
            {sources.map((source) => (
              <div key={source.id} className="border border-line-strong p-4">
                <div className="flex items-center gap-2">
                  <div className="text-[15px] text-ink">{source.name}</div>
                  <Tag tone={source.is_open ? 'accent' : 'default'}>
                    {source.is_open ? 'OPEN' : 'VERIFY'}
                  </Tag>
                </div>
                <div className="mono text-[10px] text-ink-3 mt-2 uppercase tracking-micro-tight">
                  {source.category} · {source.license_name}
                </div>
                <p className="text-body text-ink-2 mt-3">{source.attribution}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel id="GCA" title="GOLF COURSE API PROVIDER">
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <div className="display text-[24px]">
              Global course enrichment, <em>not Norway source of truth.</em>
            </div>
            <p className="text-body text-ink-2 mt-2">
              {golfCourseApi?.recommendation ??
                'Provider status loads from the backend so API keys never ship to browsers or devices.'}
            </p>
            <div className="mono text-[11px] text-ink-3 mt-3 uppercase tracking-micro-tight">
              {golfCourseApi?.rate_limit_plan_hint ?? 'Free: 300/day · Pro: 10,000/day · Enterprise: 100,000/day'}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Tag tone={golfCourseApi?.configured ? 'accent' : 'default'}>
              {golfCourseApi?.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
            </Tag>
            {golfCourseApi?.authenticated != null && (
              <Tag tone={golfCourseApi.authenticated ? 'accent' : 'default'}>
                {golfCourseApi.authenticated ? 'AUTH OK' : 'AUTH BLOCKED'}
              </Tag>
            )}
            {golfCourseApi?.norway_sample_count === 0 && <Tag>NORWAY GAP</Tag>}
          </div>
        </div>
      </Panel>

      <Panel id="USE" title="USE IT">
        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
          <p className="text-body text-ink-2">
            Start with the course catalog and source registry. Public endpoints
            are cacheable and require no account; authenticated app endpoints
            handle personal rounds, bookings, and caddie state.
          </p>
          <Link
            to="/courses"
            className="border border-line-strong px-5 py-3 mono text-[11px] uppercase tracking-micro text-ink hover:border-accent-fg hover:text-accent-fg"
          >
            Browse Courses →
          </Link>
        </div>
      </Panel>
    </div>
  )
}
