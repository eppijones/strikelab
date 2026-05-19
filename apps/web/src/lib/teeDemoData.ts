import type { Course } from '@/api/courses'
import type { BestWindow, CourseConditions, TeeSheet, TeeSheetSlot } from '@/api/tee'

export interface DemoSocialPlayer {
  id: string
  name: string
  initials: string
  handicap: number
  note: string
  availability: string
  favorite?: boolean
  level: 'similar' | 'better' | 'mentor'
}

export const DEMO_TEE_COURSES: Course[] = [
  {
    id: 'miklagard',
    name: 'Miklagard Golf',
    city: 'Klofta',
    region: 'Oslo',
    country: 'Norway',
    country_code: 'NO',
    course_type: 'championship',
    holes_count: 18,
    par: 72,
    total_meters: 6765,
    course_rating: 4.7,
    slope_rating: 138,
    has_driving_range: true,
    has_practice_area: true,
    has_putting_green: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'losby',
    name: 'Losby Golfklubb',
    city: 'Lorenskog',
    region: 'Akershus',
    country: 'Norway',
    country_code: 'NO',
    course_type: 'parkland',
    holes_count: 18,
    par: 72,
    total_meters: 6158,
    course_rating: 4.6,
    has_driving_range: true,
    has_practice_area: true,
    has_putting_green: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tyrifjord',
    name: 'Tyrifjord Golfklubb',
    city: 'Krokkleiva',
    region: 'Buskerud',
    country: 'Norway',
    country_code: 'NO',
    course_type: 'lakeside',
    holes_count: 18,
    par: 72,
    total_meters: 6105,
    course_rating: 4.5,
    has_driving_range: true,
    has_practice_area: true,
    has_putting_green: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'atlungstad',
    name: 'Atlungstad Golf',
    city: 'Ottestad',
    region: 'Innlandet',
    country: 'Norway',
    country_code: 'NO',
    course_type: 'farmland',
    holes_count: 18,
    par: 72,
    total_meters: 6240,
    course_rating: 4.5,
    has_driving_range: true,
    has_practice_area: true,
    has_putting_green: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'larvik',
    name: 'Larvik Golfklubb',
    city: 'Larvik',
    region: 'Vestfold',
    country: 'Norway',
    country_code: 'NO',
    course_type: 'links',
    holes_count: 18,
    par: 72,
    total_meters: 6040,
    course_rating: 4.8,
    has_driving_range: true,
    has_practice_area: true,
    has_putting_green: true,
    created_at: '2026-01-01T00:00:00Z',
  },
]

export function getDemoTeeCourse(id: string | undefined) {
  if (!id) return undefined
  return DEMO_TEE_COURSES.find((course) => course.id === id)
}

export function getDemoCourseConditions(courseId: string, date: string): CourseConditions {
  return {
    course_id: courseId,
    captured_at: new Date().toISOString(),
    for_date: date,
    source: 'local-demo',
    green_speed: 9.7,
    fairway_state: 'fast',
    rough_state: 'medium',
    mowed_hrs_ago: 4,
    wind_ms: 3.8,
    temp_c: 18,
    sun_pct: 68,
    cloud_pct: 24,
    rain_pct: 6,
    sunrise: '04:32',
    sunset: '22:05',
    golden_start: '19:40',
    hourly: Array.from({ length: 16 }, (_, index) => {
      const h = index + 6
      return {
        h,
        t: 13 + Math.round(Math.sin((index / 15) * Math.PI) * 7),
        w: 2.5 + (index % 4) * 0.7,
        dir: ['N', 'NE', 'E', 'SE'][index % 4],
        sun: Math.max(20, 78 - Math.abs(14 - h) * 5),
        cloud: 18 + (index % 5) * 4,
        rain: index > 12 ? 10 : 4,
      }
    }),
  }
}

export function getDemoBestWindows(): BestWindow[] {
  return [
    {
      label: 'Golden two-ball',
      label_no: 'Gylden toball',
      label_en: 'Golden two-ball',
      start_hour: 18,
      end_hour: 20,
      range: '18:10-19:50',
      conditions_summary: 'Light wind, firm fairways, low rain risk.',
      free_slots: 7,
      accent: 'sun',
    },
    {
      label: 'Morning calm',
      label_no: 'Morgenstille',
      label_en: 'Morning calm',
      start_hour: 8,
      end_hour: 10,
      range: '08:00-10:20',
      conditions_summary: 'Cool start and open tee sheet.',
      free_slots: 9,
      accent: 'moss',
    },
    {
      label: 'Late twilight',
      label_no: 'Sen tussmorke',
      label_en: 'Late twilight',
      start_hour: 20,
      end_hour: 22,
      range: '20:00-21:20',
      conditions_summary: 'Soft light with reduced demo pricing.',
      free_slots: 5,
      accent: 'fjord',
    },
  ]
}

export function getDemoTeeSheet(course: Course, date: string): TeeSheet {
  const slots: TeeSheetSlot[] = Array.from({ length: 34 }, (_, index) => {
    const minutes = 7 * 60 + index * 12
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const teeTime = `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
    const twilight = h >= 18
    const golden = h >= 18 && h < 20
    const playersTaken = index % 5 === 0 ? 2 : index % 7 === 0 ? 1 : 0

    return {
      id: `${course.id}-${date}-${h}-${m}`,
      tee_time: teeTime,
      players_total: 4,
      players_taken: playersTaken,
      available: 4 - playersTaken,
      price_amount: twilight ? 690 : golden ? 890 : 1040,
      currency: 'NOK',
      peak: h >= 10 && h < 15,
      golden,
      twilight,
      is_blocked: index % 17 === 0,
      provider_ref: `demo-${index}`,
      occupants:
        playersTaken > 0
          ? [
              {
                user_id: `demo-occupant-${index}`,
                initials: ['MH', 'IN', 'AK', 'TS'][index % 4],
                is_friend: index % 5 === 0,
                handicap: [8.4, 11.8, 14.2, 5.6][index % 4],
              },
            ]
          : [],
    }
  })

  return {
    id: `${course.id}-${date}`,
    course_id: course.id,
    course_name: course.name,
    date,
    opens_at: `${date}T07:00:00`,
    closes_at: `${date}T22:00:00`,
    interval_min: 12,
    currency: 'NOK',
    provider: 'local-demo',
    slots,
    conditions: getDemoCourseConditions(course.id, date),
  }
}

export const DEMO_FAVORITE_PLAYERS: DemoSocialPlayer[] = [
  {
    id: 'fav-marius',
    name: 'Marius Holm',
    initials: 'MH',
    handicap: 10.8,
    note: 'Usually joins twilight rounds',
    availability: 'Free after 17:00',
    favorite: true,
    level: 'similar',
  },
  {
    id: 'fav-ida',
    name: 'Ida Nilsen',
    initials: 'IN',
    handicap: 13.2,
    note: 'Prefers walking 18',
    availability: 'Can join today',
    favorite: true,
    level: 'similar',
  },
  {
    id: 'fav-kasper',
    name: 'Kasper Berg',
    initials: 'KB',
    handicap: 6.4,
    note: 'Great match if you want a push',
    availability: 'Open this evening',
    favorite: true,
    level: 'better',
  },
]

export const DEMO_SIMILAR_PLAYERS: DemoSocialPlayer[] = [
  {
    id: 'sim-emilie',
    name: 'Emilie Strand',
    initials: 'ES',
    handicap: 12.1,
    note: 'Similar handicap, plays Miklagard often',
    availability: 'Open to invites',
    level: 'similar',
  },
  {
    id: 'sim-thomas',
    name: 'Thomas Vik',
    initials: 'TV',
    handicap: 8.9,
    note: 'Lower HCP, likes competitive groups',
    availability: 'Open to invites',
    level: 'better',
  },
  {
    id: 'sim-amalie',
    name: 'Amalie Krogh',
    initials: 'AK',
    handicap: 15.0,
    note: 'Same level band, social rounds',
    availability: 'Can accept within 20 min',
    level: 'similar',
  },
  {
    id: 'sim-sander',
    name: 'Sander Lie',
    initials: 'SL',
    handicap: 3.7,
    note: 'Strong player, good mentor round',
    availability: 'Open this weekend',
    level: 'mentor',
  },
]
