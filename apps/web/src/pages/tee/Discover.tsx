import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { Course, useCourses } from '@/api/courses'
import { RecommendedSlot, useDiscover, useUpcomingPasses } from '@/api/tee'
import { useAuthStore } from '@/stores/authStore'
import { HeroKind, HeroLandscape, PassCard } from '@/components/tee'

const COURSE_KIND: Record<string, HeroKind> = {
  parkland: 'parkland',
  links: 'links',
  championship: 'championship',
  lakeside: 'lakeside',
  farmland: 'farmland',
  mountain: 'mountain',
  fjord: 'fjord',
}

const FALLBACK_COURSES = [
  {
    id: 'losby',
    name: 'Losby Golfklubb',
    city: 'Lørenskog',
    region: 'Oslo',
    course_type: 'parkland',
    holes_count: 18,
    par: 72,
    total_meters: 6420,
    course_rating: 4.6,
  },
  {
    id: 'larvik',
    name: 'Larvik Golfklubb',
    city: 'Larvik',
    region: 'Vestfold',
    course_type: 'links',
    holes_count: 18,
    par: 72,
    total_meters: 6040,
    course_rating: 4.8,
  },
  {
    id: 'miklagard',
    name: 'Miklagard Golf',
    city: 'Kløfta',
    region: 'Oslo',
    course_type: 'championship',
    holes_count: 18,
    par: 72,
    total_meters: 6765,
    course_rating: 4.7,
  },
  {
    id: 'tyrifjord',
    name: 'Tyrifjord Golfklubb',
    city: 'Krokkleiva',
    region: 'Buskerud',
    course_type: 'lakeside',
    holes_count: 18,
    par: 72,
    total_meters: 6105,
    course_rating: 4.5,
  },
  {
    id: 'atlungstad',
    name: 'Atlungstad Golf',
    city: 'Ottestad',
    region: 'Innlandet',
    course_type: 'farmland',
    holes_count: 18,
    par: 72,
    total_meters: 6240,
    course_rating: 4.5,
  },
] satisfies Partial<Course>[]

const FILTERS = {
  en: ['All', 'Near me', 'Windows now', 'Twilight', '18 holes', '9 holes'],
  no: ['Alle', 'Nær meg', 'Med vindu nå', 'Tussmørke', '18 hull', '9 hull'],
}

const WINDOW_LABELS = {
  golden: { en: 'Golden window', no: 'Gylden time' },
  twilight: { en: 'Twilight', no: 'Tussmørke' },
  morning: { en: 'Morning calm', no: 'Morgenstille' },
  midday: { en: 'Midday', no: 'Midt på dagen' },
  default: { en: 'Perfect window', no: 'Perfekt vindu' },
}

const MAP_PINS = [
  { id: 'atlungstad', x: 70, y: 22, label: 'Atlungstad' },
  { id: 'miklagard', x: 66, y: 32, label: 'Miklagard' },
  { id: 'losby', x: 62, y: 40, label: 'Losby' },
  { id: 'tyrifjord', x: 42, y: 46, label: 'Tyrifjord' },
  { id: 'larvik', x: 50, y: 78, label: 'Larvik' },
]

export default function TeeDiscover() {
  const { i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useDiscover()
  const { data: passes } = useUpcomingPasses()
  const { data: courseResults } = useCourses({ country_code: 'NO', limit: 8 })

  const lang = i18n.language === 'no' ? 'no' : 'en'
  const greetingName = user?.displayName?.split(' ')[0] ?? (lang === 'no' ? 'spiller' : 'player')
  const bestNow = data?.best_now ?? []
  const todaysWindow = data?.today_window ?? []
  const featured = todaysWindow[0] ?? bestNow[0]
  const railSlots = (todaysWindow.length ? todaysWindow : bestNow).slice(0, 4)
  const courses = useMemo(
    () => (courseResults?.length ? courseResults : FALLBACK_COURSES) as Course[],
    [courseResults],
  )

  return (
    <div>
      <header className="px-5 pb-12 pt-12 sm:px-8 lg:px-12 lg:pb-16 lg:pt-16">
        <div className="grid items-end gap-10 lg:grid-cols-[1.08fr_0.92fr] xl:gap-16">
          <div>
            <div className="micro mb-5">
              {lang === 'no'
                ? 'Tirsdag 24 juni · 18° · 5 m/s SW · solnedgang 21:12'
                : 'Tuesday June 24 · 18° · 5 m/s SW · sunset 21:12'}
            </div>
            <h1 className="display m-0 max-w-4xl text-[clamp(4.5rem,10vw,8.5rem)]">
              {lang === 'no' ? (
                <>
                  Spill mer.
                  <br />
                  <em className="text-accent-fg">Bestill mindre.</em>
                </>
              ) : (
                <>
                  Play more.
                  <br />
                  <em className="text-accent-fg">Book less.</em>
                </>
              )}
            </h1>
            <p className="serif mt-7 max-w-xl text-[20px] leading-[1.45] text-ink-2">
              {lang === 'no'
                ? `Velg banen som et sted, ikke et regneark. Vinduet viser deg dagen som landskap, slik at ${greetingName} finner øyeblikket, ikke bare en tid.`
                : `Pick a course like a place, not a spreadsheet. The Window shows the day as landscape, so ${greetingName} finds a moment, not just a time.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#windows" className="tee-cta px-6 py-3.5 text-[14px]">
                {lang === 'no' ? 'Finn et vindu nå' : 'Find a window now'} →
              </a>
              <Link to="/tee/preferences" className="tee-pill px-5 py-3.5">
                {lang === 'no' ? 'Hvordan StrikeLab fungerer' : 'How StrikeLab works'}
              </Link>
            </div>
          </div>
          <FeaturedWindow slot={featured} lang={lang} />
        </div>
      </header>

      {passes && passes.length > 0 && (
        <section className="px-5 pb-8 sm:px-8 lg:px-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="display m-0 text-[32px]">{lang === 'no' ? 'Planlagt spill' : 'Scheduled play'}</h2>
            <span className="micro">{lang === 'no' ? 'Dine neste runder' : 'Your upcoming rounds'}</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {passes.slice(0, 2).map((p) => (
              <Link key={p.booking_id} to={`/tee/passes/${p.booking_id}`} className="block hover:opacity-95">
                <PassCard pass={p} compact />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="windows" className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <div className="micro">{lang === 'no' ? 'I dag' : 'Today'}</div>
            <h2 className="display mt-1 text-[38px]">
              {lang === 'no' ? (
                <>
                  Dagens <em className="text-accent-fg">vinduer</em>
                </>
              ) : (
                <>
                  Today's <em className="text-accent-fg">windows</em>
                </>
              )}
            </h2>
          </div>
          <a href="#courses" className="hidden text-[13px] text-ink-2 hover:text-ink sm:inline-flex">
            {lang === 'no' ? 'Alle vinduer' : 'All windows'} →
          </a>
        </div>
        {isLoading && <div className="micro mb-3">SEARCHING...</div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(railSlots.length ? railSlots : courses.slice(0, 4)).map((item, index) =>
            'slot_id' in item ? (
              <WindowRailCard key={item.slot_id} slot={item} lang={lang} />
            ) : (
              <CourseWindowCard key={item.id ?? index} course={item} index={index} lang={lang} />
            ),
          )}
        </div>
      </section>

      <FeatureSection lang={lang} />
      <CourseDirectory courses={courses} lang={lang} />
    </div>
  )
}

function FeaturedWindow({ slot, lang }: { slot?: RecommendedSlot; lang: 'en' | 'no' }) {
  const courseName = slot?.course_name ?? 'Miklagard Golf'
  const kind = COURSE_KIND[slot?.course_type ?? 'championship'] ?? 'championship'
  const time = slot ? formatTime(slot.tee_time) : '12:24'
  const price = slot?.price_amount ? `${Math.round(slot.price_amount)} kr` : '950 kr'

  return (
    <div className="tee-dark-card relative overflow-hidden rounded-[26px] p-7">
      <div className="absolute inset-0 opacity-[0.18]">
        <HeroLandscape kind={kind} height="100%" />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between gap-4 text-[10.5px] uppercase tracking-[0.14em] text-white/55">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--tee-sun)]" />
            {lang === 'no' ? 'Anbefalt for deg nå' : 'Picked for you now'}
          </span>
          <span>★ {lang === 'no' ? 'Perfekt vindu' : 'Perfect window'}</span>
        </div>
        <div className="display mt-5 text-[40px] text-[var(--surface-solid)]">{courseName}</div>
        <div className="mono mt-1 text-[12px] text-white/55">
          {slot
            ? [slot.course_city, slot.drive_min ? `${slot.drive_min} min` : null].filter(Boolean).join(' · ')
            : 'Kløfta · 36 min'}
        </div>
        <SunWindowMini />
        <div className="mt-5 flex items-end justify-between gap-5 border-t border-white/15 pt-5">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/50">
              {lang === 'no' ? 'Beste nå' : 'Best now'}
            </div>
            <div className="display mt-1 text-[30px] text-[var(--surface-solid)]">{time} - 13:48</div>
            <div className="mono mt-1 text-[11px] text-white/55">
              {slot?.temp_c ? `${Math.round(slot.temp_c)}°` : '22°'} ·{' '}
              {slot?.wind_ms ? `${Math.round(slot.wind_ms)} m/s` : '6 m/s'} · {slot?.available ?? 9}{' '}
              {lang === 'no' ? 'ledig' : 'open'} · {price}
            </div>
          </div>
          <Link
            to={slot ? `/tee/courses/${slot.course_id}/sheet?date=${slot.tee_time.slice(0, 10)}` : '/tee/courses/miklagard'}
            className="rounded-pill bg-surface-solid px-5 py-3 text-[13px] font-medium text-ink"
          >
            {lang === 'no' ? 'Bestill' : 'Book'} →
          </Link>
        </div>
      </div>
    </div>
  )
}

function SunWindowMini() {
  const labels = [6, 9, 12, 15, 18, 21]
  return (
    <svg viewBox="0 0 360 112" className="mt-7 block h-[112px] w-full">
      <defs>
        <linearGradient id="discover-sun" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(232,181,71,0.55)" />
          <stop offset="1" stopColor="rgba(232,181,71,0.05)" />
        </linearGradient>
      </defs>
      <path d="M 16 98 L 76 72 L 136 44 L 196 22 L 276 62 L 344 98 Z" fill="url(#discover-sun)" />
      <rect x="168" y="8" width="58" height="86" rx="4" fill="rgba(232,181,71,0.12)" stroke="rgba(232,181,71,0.55)" strokeDasharray="2 4" />
      {labels.map((h, i) => {
        const x = 16 + i * 65.6
        return (
          <g key={h}>
            <line x1={x} y1="98" x2={x} y2="101" stroke="rgba(251,250,246,0.3)" />
            <text x={x} y="111" fill="rgba(251,250,246,0.5)" fontSize="9.5" fontFamily="Geist Mono" textAnchor="middle">
              {h.toString().padStart(2, '0')}
            </text>
          </g>
        )
      })}
      {Array.from({ length: 18 }, (_, i) => (
        <circle key={i} cx={42 + i * 16} cy={82 - Math.sin(i / 3) * 34} r="1.5" fill="rgba(251,250,246,0.82)" />
      ))}
      <circle cx="196" cy="22" r="5" fill="var(--tee-sun)" />
      <circle cx="196" cy="22" r="9" fill="none" stroke="var(--tee-sun)" strokeOpacity="0.42" />
    </svg>
  )
}

function WindowRailCard({ slot, lang }: { slot: RecommendedSlot; lang: 'en' | 'no' }) {
  const time = new Date(slot.tee_time)
  const kind = COURSE_KIND[slot.course_type ?? 'parkland'] ?? 'parkland'
  const label = windowLabel(slot.window_label, lang)

  return (
    <Link
      to={`/tee/courses/${slot.course_id}/sheet?date=${slot.tee_time.slice(0, 10)}`}
      className="tee-card group block overflow-hidden transition hover:-translate-y-0.5 hover:border-ink-3"
    >
      <div className="relative h-[142px]">
        <HeroLandscape kind={kind} height="100%" />
        <div className="absolute left-3 top-3 rounded-pill bg-surface/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink backdrop-blur">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--tee-sun)]" />
          {label}
        </div>
      </div>
      <div className="p-4">
        <div className="display text-[22px] leading-none">{slot.course_name}</div>
        <div className="mono mt-1 text-[11px] text-ink-3">
          {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} -{' '}
          {slot.drive_min ? `${slot.drive_min} min` : lang === 'no' ? 'nær deg' : 'near you'}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 mono text-[11px] text-ink-2">
          <span>
            {slot.temp_c ? `${Math.round(slot.temp_c)}°` : '18°'} ·{' '}
            {slot.wind_ms ? `${Math.round(slot.wind_ms)} m/s` : '5 m/s'}
          </span>
          <span className="text-ink-3">
            {lang === 'no' ? 'fra' : 'from'} {slot.price_amount ? `${Math.round(slot.price_amount)} kr` : '650 kr'}
          </span>
        </div>
      </div>
    </Link>
  )
}

function CourseWindowCard({ course, index, lang }: { course: Course; index: number; lang: 'en' | 'no' }) {
  const kind = COURSE_KIND[course.course_type ?? 'parkland'] ?? 'parkland'
  const labels = ['golden', 'morning', 'midday', 'twilight'] as const
  const label = windowLabel(labels[index % labels.length], lang)

  return (
    <Link to={`/tee/courses/${course.id}`} className="tee-card group block overflow-hidden transition hover:-translate-y-0.5 hover:border-ink-3">
      <div className="relative h-[142px]">
        <HeroLandscape kind={kind} height="100%" />
        <div className="absolute left-3 top-3 rounded-pill bg-surface/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink backdrop-blur">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--tee-sun)]" />
          {label}
        </div>
      </div>
      <div className="p-4">
        <div className="display text-[22px] leading-none">{course.name}</div>
        <div className="mono mt-1 text-[11px] text-ink-3">0{8 + index}:00 - {11 + index}:00</div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 mono text-[11px] text-ink-2">
          <span>{18 + index}° · {5 + index} m/s</span>
          <span className="text-ink-3">{lang === 'no' ? 'fra' : 'from'} {650 + index * 100} kr</span>
        </div>
      </div>
    </Link>
  )
}

function FeatureSection({ lang }: { lang: 'en' | 'no' }) {
  return (
    <section className="px-5 py-10 sm:px-8 lg:px-12">
      <div className="tee-dark-card overflow-hidden rounded-[28px]">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[360px] overflow-hidden">
            <HeroLandscape kind="links" height="100%" className="absolute inset-0 h-full opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[rgba(14,20,16,0.72)]" />
            <div className="absolute bottom-7 left-7">
              <span className="rounded-pill border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/80 backdrop-blur">
                {lang === 'no' ? 'Ukens bane' : 'Course of the week'}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="micro text-white/55">Larvik · Vestfold</div>
            <h3 className="display mt-3 text-[clamp(3.5rem,7vw,5rem)] text-[var(--surface-solid)]">
              Larvik Golfklubb
            </h3>
            <p className="serif mt-5 max-w-xl text-[21px] leading-[1.45] text-white/75">
              {lang === 'no'
                ? 'Kystlinks langs Skagerrak, der vinden er en spiller og solfallet gjør de siste tidene bedre.'
                : 'Coastal links along Skagerrak, where wind is part of the field and late light makes the final times better.'}
            </p>
            <div className="mt-9 grid grid-cols-4 gap-5 border-t border-white/15 pt-7">
              {[
                ['Par', '72'],
                ['Stimp', '10.4'],
                [lang === 'no' ? 'Lengde' : 'Length', '6040m'],
                ['Rating', '4.8'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="micro text-white/45">{label}</div>
                  <div className="display mt-1 text-[28px] text-[var(--surface-solid)]">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/tee/courses/larvik" className="rounded-pill bg-surface-solid px-5 py-3 text-[13px] font-medium text-ink">
                {lang === 'no' ? 'Se vinduet' : 'See the window'}
              </Link>
              <Link to="/tee/courses/larvik" className="rounded-pill border border-white/25 px-5 py-3 text-[13px] font-medium text-white/85">
                {lang === 'no' ? 'Mer om banen' : 'About the course'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CourseDirectory({ courses, lang }: { courses: Course[]; lang: 'en' | 'no' }) {
  return (
    <section id="courses" className="px-5 pb-16 pt-4 sm:px-8 lg:px-12">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="display text-[40px]">
          {lang === 'no' ? (
            <>
              Alle <em className="text-accent-fg">baner</em>
            </>
          ) : (
            <>
              All <em className="text-accent-fg">courses</em>
            </>
          )}
        </h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS[lang].map((filter, index) => (
            <button
              key={filter}
              className={clsx(
                'shrink-0 rounded-pill border px-4 py-2 text-[12.5px] font-medium',
                index === 0
                  ? 'border-ink bg-ink text-surface-solid'
                  : 'border-line text-ink-2 hover:border-ink-3 hover:text-ink',
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-3">
          {courses.slice(0, 5).map((course, index) => (
            <CourseListCard key={course.id ?? index} course={course} index={index} lang={lang} />
          ))}
        </div>
        <FauxMap lang={lang} />
      </div>
    </section>
  )
}

function CourseListCard({ course, index, lang }: { course: Course; index: number; lang: 'en' | 'no' }) {
  const kind = COURSE_KIND[course.course_type ?? 'parkland'] ?? 'parkland'
  const windowStart = [18, 17, 8, 14, 9][index % 5]
  const fromPrice = [750, 650, 950, 700, 620][index % 5]

  return (
    <Link to={`/tee/courses/${course.id}`} className="tee-card grid overflow-hidden transition hover:border-ink-3 md:grid-cols-[190px_1fr_auto]">
      <HeroLandscape kind={kind} height="100%" className="min-h-[150px]" />
      <div className="p-5">
        <div className="micro">{course.region ?? 'Norway'}</div>
        <div className="display mt-1 text-[26px]">{course.name}</div>
        <p className="serif mt-2 max-w-xl text-[15px] leading-[1.35] text-ink-2">
          {course.course_type === 'links'
            ? lang === 'no'
              ? 'Kystlinks langs Skagerrak, vinden er en spiller.'
              : 'Coastal links where the wind is part of play.'
            : lang === 'no'
            ? 'Store greener, rolige linjer og et tydelig vindu for dagen.'
            : 'Big greens, calm lines, and a clear window for the day.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 mono text-[11px] text-ink-2">
          <span>{18 + index}°</span>
          <span>{5 + index} m/s</span>
          <span>{course.par ? `Par ${course.par}` : 'Par 72'}</span>
          <span>{course.total_meters ? `${course.total_meters} m` : '6040 m'}</span>
          <span>★ {course.course_rating ?? (4.5 + index / 10).toFixed(1)}</span>
        </div>
      </div>
      <div className="flex min-w-[156px] flex-row items-center justify-between border-t border-line p-5 md:flex-col md:items-end md:border-l md:border-t-0">
        <div className="text-right">
          <div className="micro">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--tee-sun)]" />
            {lang === 'no' ? 'Vindu' : 'Window'}
          </div>
          <div className="mono mt-1 text-[13px] text-ink">
            {windowStart.toString().padStart(2, '0')}:00-{(windowStart + 2).toString().padStart(2, '0')}:00
          </div>
        </div>
        <div className="text-right">
          <div className="micro">{lang === 'no' ? 'fra' : 'from'}</div>
          <div className="display mt-1 text-[25px]">{fromPrice} kr</div>
        </div>
      </div>
    </Link>
  )
}

function FauxMap({ lang }: { lang: 'en' | 'no' }) {
  return (
    <div className="tee-card tee-map sticky top-24 hidden min-h-[720px] overflow-hidden xl:block">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M 0 ${30 + i * 7} Q 30 ${25 + i * 7} 60 ${35 + i * 7} T 100 ${30 + i * 7}`} fill="none" stroke="rgba(14,20,16,0.05)" strokeWidth="0.2" />
        ))}
        <path d="M 0 95 C 20 88, 35 92, 50 90 S 80 80, 100 85 L 100 100 L 0 100 Z" fill="rgba(62,85,98,0.4)" />
      </svg>
      {MAP_PINS.map((pin, index) => (
        <div
          key={pin.id}
          className="absolute"
          style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
        >
          <div
            className={clsx(
              'flex items-center gap-2 rounded-pill px-3 py-2 text-[11.5px] font-medium shadow-[0_6px_14px_-4px_rgba(14,20,16,0.3)]',
              index === 1 ? 'bg-ink text-surface-solid' : 'border border-line bg-surface-solid text-ink',
            )}
          >
            <span className={clsx('flex h-[18px] w-[18px] items-center justify-center rounded-full mono text-[9px] font-semibold text-surface-solid', index === 1 ? 'bg-[var(--tee-sun)]' : 'bg-accent')}>
              {pin.label[0]}
            </span>
            {pin.label}
          </div>
          <div
            className="mx-auto h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent"
            style={{ borderTopColor: index === 1 ? 'var(--ink)' : 'var(--surface-solid)' }}
          />
        </div>
      ))}
      <div className="absolute bottom-4 left-4 flex gap-4 rounded-xl border border-line bg-surface/90 px-4 py-3 text-[11.5px] text-ink-2 backdrop-blur">
        <span>
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          {lang === 'no' ? 'Ledig nå' : 'Open now'}
        </span>
        <span>
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[var(--tee-sun)]" />
          {lang === 'no' ? 'Perfekt vindu' : 'Perfect window'}
        </span>
      </div>
      <div className="absolute right-4 top-4 flex flex-col gap-1">
        {['+', '-'].map((label) => (
          <button key={label} className="h-8 w-8 rounded-lg border border-line bg-surface-solid text-[16px] text-ink-2">
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function windowLabel(label: string | null | undefined, lang: 'en' | 'no') {
  const key = (label ?? 'default') as keyof typeof WINDOW_LABELS
  return (WINDOW_LABELS[key] ?? WINDOW_LABELS.default)[lang]
}
