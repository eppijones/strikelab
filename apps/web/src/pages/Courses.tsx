import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  useCourseRegions,
  useCourses,
  useImportCoursesCsv,
  type Course,
} from '@/api/courses'
import { Panel, Tag } from '@/components/ui'
import { CourseEditor } from '@/components/courses/CourseEditor'
import { useRounds } from '@/api/rounds'

type Tab = 'browse' | 'mine'

export default function Courses() {
  const { i18n } = useTranslation()
  const isNo = i18n.language === 'no'
  const [tab, setTab] = useState<Tab>('mine')
  const [q, setQ] = useState('')
  const [country, setCountry] = useState<string>('NO')
  const [region, setRegion] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [drivingRangeOnly, setDrivingRangeOnly] = useState(false)
  const [holesFilter, setHolesFilter] = useState<string>('')

  // The /regions endpoint defaults to Norway. When the user picks another
  // country the region picker is hidden, but if the data is needed for that
  // country we just pass the code through.
  const regionsCountry = country || 'NO'
  const regionsQuery = useCourseRegions(regionsCountry)
  const regions = regionsQuery.data ?? []

  const browse = useCourses({
    q,
    country_code: country || 'NO',
    region: region || undefined,
    course_type: type || undefined,
    has_driving_range: drivingRangeOnly || undefined,
    holes_count: holesFilter ? Number(holesFilter) : undefined,
    limit: 200,
  })
  const mine = useCourses({ mine: true, limit: 200 })
  const { data: rounds = [] } = useRounds()

  const data = tab === 'browse' ? browse : mine
  const courses = data.data ?? []
  const courseRoundCounts = rounds.reduce<Record<string, number>>((acc, round) => {
    if (round.course_id) acc[round.course_id] = (acc[round.course_id] ?? 0) + 1
    return acc
  }, {})
  const recentRounds = rounds.slice(0, 4)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const importCsv = useImportCoursesCsv()
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const startCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const handleFile = async (file: File) => {
    setImportMessage(null)
    try {
      const result = await importCsv.mutateAsync(file)
      setImportMessage(
        `Imported ${result.imported} courses${
          result.skipped ? `, skipped ${result.skipped}` : ''
        }.`
      )
    } catch (e) {
      setImportMessage(e instanceof Error ? e.message : 'Import failed')
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="micro mb-3">{isNo ? 'SPILL › BANER' : 'PLAY › COURSES'}</div>
          <h1 className="display text-[clamp(3rem,8vw,5.75rem)] m-0">
            {isNo ? 'Norske' : 'Norway'} <em>{isNo ? 'baner.' : 'courses.'}</em>
          </h1>
          <p className="text-body text-ink-2 mt-3 max-w-2xl">
            {isNo
              ? 'Finn banene du spiller, se scorekortene dine, og planlegg neste runde. Katalogen starter med norske klubber og rangefasiliteter.'
              : 'Find the courses you play, see your scorecards, and plan the next round. The catalog starts with Norwegian clubs and practice facilities.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startCreate}
            className="bg-accent text-accent-ink px-4 py-2.5 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
          >
            + ADD COURSE
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importCsv.isPending}
            className="bg-transparent text-ink border border-line-strong px-4 py-2.5 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg disabled:opacity-50"
          >
            {importCsv.isPending ? 'UPLOADING…' : 'IMPORT CSV'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.currentTarget.value = ''
            }}
          />
        </div>
      </header>

      {importMessage && (
        <div className="border border-line-strong px-4 py-2.5 mono text-[11px] text-accent-fg">
          {importMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel id="NO" title={isNo ? 'NORSK KATALOG' : 'NORWAY CATALOG'}>
          <div className="display text-[32px]">{regions.reduce((sum, r) => sum + r.count, 0) || '156'}</div>
          <p className="text-body text-ink-2 mt-2">
            {isNo ? 'Klubber og baner fordelt på fylker.' : 'Clubs and courses grouped by region.'}
          </p>
        </Panel>
        <Panel id="MINE" title={isNo ? 'MINE BANER' : 'MY COURSES'}>
          <div className="display text-[32px]">{mine.data?.length ?? 0}</div>
          <p className="text-body text-ink-2 mt-2">
            {isNo ? 'Favoritter og baner du selv har lagt inn.' : 'Favorites and courses you have added.'}
          </p>
        </Panel>
        <Panel id="SCORE" title={isNo ? 'SCOREKORT' : 'SCORECARDS'}>
          <div className="display text-[32px]">{rounds.length}</div>
          <Link to="/rounds" className="mono text-[10px] text-accent-fg uppercase tracking-micro mt-3 inline-block hover:underline">
            {isNo ? 'Se runder' : 'View rounds'} →
          </Link>
        </Panel>
      </div>

      {recentRounds.length > 0 && (
        <Panel id="RECENT" title={isNo ? 'SISTE SCOREKORT' : 'RECENT SCORECARDS'}>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentRounds.map((round) => (
              <Link key={round.id} to={`/rounds/${round.id}`} className="border border-line-strong p-4 hover:border-accent-fg hover:bg-bg-2">
                <div className="mono text-[10px] text-ink-3 uppercase tracking-micro">
                  {new Date(round.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-[15px] text-ink mt-2 truncate">{round.course_name}</div>
                <div className="mono text-[12px] text-ink-2 mt-3">
                  {round.total_gross} / {round.total_par} · {round.is_complete ? (isNo ? 'FERDIG' : 'DONE') : (isNo ? 'PÅGÅR' : 'LIVE')}
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      <div className="flex border border-line-strong w-fit">
        {([['mine', isNo ? 'MINE BANER' : 'MY COURSES'], ['browse', isNo ? 'NORSK KATALOG' : 'NORWAY CATALOG']] as const).map(
          ([id, label], i) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`mono text-[10px] uppercase tracking-micro px-4 py-2 transition-colors ${
                i === 0 ? 'border-r border-line-strong' : ''
              } ${tab === id ? 'ui-selected' : 'text-ink-3 hover:text-ink hover:bg-bg-2'}`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <Panel id="SRCH" title="FILTERS">
        <div className="grid lg:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, city, region…"
            className="bg-bg-2 border border-line-strong text-ink px-4 py-2.5 mono text-[12px] focus:border-accent-fg focus:outline-none"
          />
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value)
              setRegion('')
            }}
            className="bg-bg-2 border border-line-strong text-ink px-4 py-2.5 mono text-[12px] focus:border-accent-fg focus:outline-none"
          >
            <option value="">ANY COUNTRY</option>
            <option value="NO">Norway</option>
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="IE">Ireland</option>
            <option value="ES">Spain</option>
            <option value="SE">Sweden</option>
            <option value="AE">United Arab Emirates</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-bg-2 border border-line-strong text-ink px-4 py-2.5 mono text-[12px] focus:border-accent-fg focus:outline-none"
          >
            <option value="">ANY TYPE</option>
            <option value="parkland">Parkland</option>
            <option value="links">Links</option>
            <option value="heathland">Heathland</option>
            <option value="desert">Desert</option>
            <option value="mountain">Mountain</option>
            <option value="resort">Resort</option>
            <option value="range">Driving Range</option>
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-3 mt-3">
          {(country === 'NO' || country === '') && regions.length > 0 ? (
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-bg-2 border border-line-strong text-ink px-4 py-2.5 mono text-[12px] focus:border-accent-fg focus:outline-none"
            >
              <option value="">ANY REGION (NO)</option>
              {regions.map((r) => (
                <option key={r.region} value={r.region}>
                  {r.region.toUpperCase()} · {r.count}
                </option>
              ))}
            </select>
          ) : (
            <div />
          )}

          <select
            value={holesFilter}
            onChange={(e) => setHolesFilter(e.target.value)}
            className="bg-bg-2 border border-line-strong text-ink px-4 py-2.5 mono text-[12px] focus:border-accent-fg focus:outline-none"
          >
            <option value="">ANY HOLE COUNT</option>
            <option value="9">9 holes</option>
            <option value="18">18 holes</option>
            <option value="27">27 holes</option>
          </select>

          <label className="flex items-center gap-3 border border-line-strong px-4 py-2.5 mono text-[11px] uppercase tracking-micro text-ink-2 cursor-pointer hover:border-accent-fg">
            <input
              type="checkbox"
              checked={drivingRangeOnly}
              onChange={(e) => setDrivingRangeOnly(e.target.checked)}
              className="accent-accent"
            />
            DRIVING RANGE ONLY
          </label>
        </div>
      </Panel>

      <Panel
        id="LIST"
        title={tab === 'browse' ? (isNo ? 'KATALOG' : 'CATALOG') : (isNo ? 'DINE BANER' : 'YOUR COURSES')}
        right={
          <span className="micro">
            {courses.length} {courses.length === 1 ? 'COURSE' : 'COURSES'}
          </span>
        }
      >
        {data.isLoading && (
          <div className="mono text-[11px] text-ink-3">SEARCHING…</div>
        )}
        {!data.isLoading && courses.length === 0 && (
          <div className="py-12 text-center">
            <div className="display text-[24px]">
              {tab === 'mine' ? (isNo ? 'Ingen baner ennå.' : 'No courses yet.') : (isNo ? 'Ingen treff.' : 'No courses match.')}
            </div>
            {tab === 'mine' && (
              <button
                onClick={startCreate}
                className="mt-5 bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2"
              >
                {isNo ? 'LEGG TIL BANE' : 'ADD A COURSE'} →
              </button>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="border border-line-strong p-4 rounded-panel transition-colors hover:border-accent-fg hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-fg block"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[16px] text-ink">{c.name}</div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {c.is_verified && <Tag tone="accent">VERIFIED</Tag>}
                  {c.holes_count != null && <Tag>{c.holes_count}H</Tag>}
                  {c.par != null && <Tag>PAR {c.par}</Tag>}
                  {courseRoundCounts[c.id] ? <Tag tone="accent">{courseRoundCounts[c.id]} {isNo ? 'RUNDER' : 'ROUNDS'}</Tag> : null}
                </div>
              </div>
              <div className="mono text-[11px] text-ink-3 mt-2 uppercase tracking-micro-tight">
                {[c.city, c.region, c.country].filter(Boolean).join(' · ') ||
                  '—'}
                {c.course_type ? ` · ${c.course_type}` : ''}
              </div>
              {(c.has_driving_range ||
                c.has_practice_area ||
                c.has_putting_green ||
                c.has_par3_course ||
                c.has_simulator) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.has_driving_range && <Tag>RANGE</Tag>}
                  {c.has_practice_area && <Tag>SHORT GAME</Tag>}
                  {c.has_putting_green && <Tag>PUTTING</Tag>}
                  {c.has_par3_course && <Tag>PAR-3</Tag>}
                  {c.has_simulator && <Tag tone="accent">SIM</Tag>}
                </div>
              )}
              {(c.slope_rating || c.course_rating || c.total_yards) && (
                <div className="mono text-[11px] text-ink-2 mt-3 flex gap-3">
                  {c.course_rating != null && (
                    <span>CR {c.course_rating.toFixed(1)}</span>
                  )}
                  {c.slope_rating != null && <span>SLOPE {c.slope_rating}</span>}
                  {c.total_yards != null && <span>{c.total_yards} YDS</span>}
                </div>
              )}
            </Link>
          ))}
        </div>
      </Panel>

      <Panel id="CSV" title="CSV TEMPLATE">
        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <div className="display text-[20px] m-0">
              Bring your <em>own</em> course list.
            </div>
            <p className="text-body text-ink-2 mt-2">
              Headers (case-insensitive):
              <span className="mono text-ink ml-2 text-[11px]">
                name, city, region, country, country_code, course_type, par,
                holes_count, slope_rating, course_rating, total_yards,
                total_meters, latitude, longitude, has_driving_range,
                has_practice_area, has_putting_green, has_par3_course,
                has_simulator, website, phone, email, designer, established,
                ngf_club_id, osm_id
              </span>
            </p>
          </div>
        </div>
      </Panel>

      <CourseEditor
        open={editorOpen}
        course={editing}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  )
}
