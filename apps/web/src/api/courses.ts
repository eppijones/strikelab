import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// Types
export interface Course {
  id: string
  name: string
  city?: string
  country?: string
  par?: number
  slope_rating?: number
  course_rating?: number
  holes?: { number: number; par: number; handicap: number; yards: number }[]
  latitude?: number
  longitude?: number
  website?: string
  phone?: string
  created_at: string
}

export interface TeeTime {
  id: string
  user_id: string
  course_id?: string
  tee_time: string
  players?: string[]
  notes?: string
  prep_notes?: string
  focus_areas?: string[]
  booking_source?: string
  booking_reference?: string
  status: string
  session_id?: string
  created_at: string
  course?: Course
}

export interface TeeTimeCreate {
  course_id?: string
  course_name?: string // For manual entry without course_id
  tee_time: string
  players?: string[]
  notes?: string
  prep_notes?: string
  focus_areas?: string[]
  booking_source?: string
  booking_reference?: string
}

// Courses hooks
export function useCourses(params?: { q?: string; country?: string; limit?: number }) {
  const queryParams = new URLSearchParams()
  if (params?.q) queryParams.set('q', params.q)
  if (params?.country) queryParams.set('country', params.country)
  if (params?.limit) queryParams.set('limit', params.limit.toString())

  const queryString = queryParams.toString()
  const endpoint = `/courses/search${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => apiClient.get<Course[]>(endpoint),
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => apiClient.get<Course>(`/courses/${id}`),
    enabled: !!id,
  })
}

// Tee Times hooks
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
