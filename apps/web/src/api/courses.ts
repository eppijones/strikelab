import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '@/stores/authStore'
import { API_URL } from '@/lib/constants'

export interface HoleData {
  number: number
  par: number
  handicap?: number
  yards?: number
  meters?: number
}

export interface Course {
  id: string
  name: string
  city?: string | null
  region?: string | null
  country?: string | null
  country_code?: string | null
  course_type?: string | null
  par?: number | null
  holes_count?: number | null
  slope_rating?: number | null
  course_rating?: number | null
  total_yards?: number | null
  total_meters?: number | null
  holes?: HoleData[] | null
  latitude?: number | null
  longitude?: number | null
  has_driving_range?: boolean | null
  has_practice_area?: boolean | null
  has_putting_green?: boolean | null
  has_par3_course?: boolean | null
  has_simulator?: boolean | null
  facilities?: Record<string, unknown> | null
  website?: string | null
  phone?: string | null
  email?: string | null
  designer?: string | null
  established?: number | null
  ngf_club_id?: string | null
  osm_id?: string | null
  is_verified?: boolean
  created_by_user_id?: string | null
  created_at: string
}

export interface CourseInput {
  name: string
  city?: string
  region?: string
  country?: string
  country_code?: string
  course_type?: string
  par?: number
  holes_count?: number
  slope_rating?: number
  course_rating?: number
  total_yards?: number
  total_meters?: number
  holes?: HoleData[]
  latitude?: number
  longitude?: number
  has_driving_range?: boolean
  has_practice_area?: boolean
  has_putting_green?: boolean
  has_par3_course?: boolean
  has_simulator?: boolean
  facilities?: Record<string, unknown>
  website?: string
  phone?: string
  email?: string
  designer?: string
  established?: number
}

export interface CourseRegion {
  region: string
  count: number
}

export interface CourseImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export interface TeeTime {
  id: string
  user_id: string
  course_id?: string | null
  tee_time: string
  players?: string[] | null
  notes?: string | null
  prep_notes?: string | null
  focus_areas?: string[] | null
  booking_source?: string | null
  booking_reference?: string | null
  status: string
  session_id?: string | null
  created_at: string
  course?: Course | null
}

export interface TeeTimeCreate {
  course_id?: string
  course_name?: string
  tee_time: string
  players?: string[]
  notes?: string
  prep_notes?: string
  focus_areas?: string[]
  booking_source?: string
  booking_reference?: string
}

// === Courses hooks ===

export function useCourses(params?: {
  q?: string
  country?: string
  country_code?: string
  region?: string
  course_type?: string
  has_driving_range?: boolean
  has_practice_area?: boolean
  has_simulator?: boolean
  holes_count?: number
  mine?: boolean
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.q) queryParams.set('q', params.q)
  if (params?.country) queryParams.set('country', params.country)
  if (params?.country_code) queryParams.set('country_code', params.country_code)
  if (params?.region) queryParams.set('region', params.region)
  if (params?.course_type) queryParams.set('course_type', params.course_type)
  if (params?.has_driving_range !== undefined)
    queryParams.set('has_driving_range', String(params.has_driving_range))
  if (params?.has_practice_area !== undefined)
    queryParams.set('has_practice_area', String(params.has_practice_area))
  if (params?.has_simulator !== undefined)
    queryParams.set('has_simulator', String(params.has_simulator))
  if (params?.holes_count !== undefined)
    queryParams.set('holes_count', params.holes_count.toString())
  if (params?.mine) queryParams.set('mine', 'true')
  if (params?.limit) queryParams.set('limit', params.limit.toString())

  const queryString = queryParams.toString()
  const endpoint = `/courses/search${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => apiClient.get<Course[]>(endpoint),
  })
}

export function useCourseRegions(countryCode: string = 'NO') {
  return useQuery({
    queryKey: ['course-regions', countryCode],
    queryFn: () =>
      apiClient.get<CourseRegion[]>(
        `/courses/regions?country_code=${encodeURIComponent(countryCode)}`
      ),
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => apiClient.get<Course>(`/courses/${id}`),
    enabled: !!id,
  })
}

export function useFavoriteCourses() {
  return useQuery({
    queryKey: ['courses', 'favorites'],
    queryFn: () => apiClient.get<Course[]>('/courses/me/favorites'),
  })
}

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CourseInput) => apiClient.post<Course>('/courses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseInput> }) =>
      apiClient.patch<Course>(`/courses/${id}`, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['courses'] })
      qc.invalidateQueries({ queryKey: ['course', variables.id] })
    },
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function useImportCoursesCsv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File): Promise<CourseImportResult> => {
      const form = new FormData()
      form.append('file', file)
      const token = useAuthStore.getState().accessToken
      const res = await fetch(`${API_URL}/courses/import`, {
        method: 'POST',
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Import failed')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function useFavoriteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      on
        ? apiClient.post(`/courses/${id}/favorite`)
        : apiClient.delete(`/courses/${id}/favorite`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', 'favorites'] })
    },
  })
}

// === Tee Times hooks ===

export function useTeeTimes(upcomingOnly: boolean = true) {
  const queryParams = new URLSearchParams()
  queryParams.set('upcoming_only', upcomingOnly.toString())

  return useQuery({
    queryKey: ['tee-times', upcomingOnly],
    queryFn: () => apiClient.get<TeeTime[]>(`/courses/tee-times?${queryParams.toString()}`),
  })
}

export function useCreateTeeTime() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TeeTimeCreate) => {
      return apiClient.post<TeeTime>('/courses/tee-times', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tee-times'] })
    },
  })
}

export function useDeleteTeeTime() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/courses/tee-times/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tee-times'] })
    },
  })
}
