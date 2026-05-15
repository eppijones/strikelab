import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Course } from './courses'
import type { CourseConditions } from './tee'
import type { Brand, ClubModel } from './catalog'

export interface PublicAttribution {
  source_id: string
  name: string
  license_name: string
  license_url?: string | null
  attribution: string
  source_url?: string | null
}

export interface PublicDataSource extends PublicAttribution {
  id: string
  category: string
  terms_url?: string | null
  refresh_interval_hours?: number | null
  is_open: boolean
  notes?: string | null
  updated_at: string
}

export interface PublicConditionSources {
  course_id: string
  source: string
  data_sources: PublicAttribution[]
}

export interface PublicCourse extends Course {
  geometry_summary?: Record<string, unknown> | null
  data_sources: PublicAttribution[]
  golfcourseapi_id?: string | null
  updated_at?: string | null
}

export interface PublicCourseGeometry {
  course_id: string
  geometry_version: string
  features: {
    type: 'FeatureCollection'
    features: Array<{
      id: string
      kind: string
      name?: string | null
      hole?: number | null
      center: { lat: number; lon: number }
      tags?: Record<string, string>
    }>
  }
  summary?: {
    counts?: Record<string, number>
    holes_detected?: number[]
    source?: string
  } | null
  validation?: Record<string, unknown> | null
  confidence?: number | null
  attribution?: string | null
  source?: PublicAttribution | null
}

export interface PublicApiIndex {
  name: string
  scope: string
  version: string
  endpoints: string[]
  terms: string
  attribution_required: boolean
}

export interface GolfCourseAPIProviderStatus {
  provider: string
  configured: boolean
  authenticated?: boolean | null
  sample_query?: string | null
  sample_count?: number | null
  norway_sample_count?: number | null
  rate_limit_plan_hint: string
  recommendation: string
}

export interface GolfCourseAPIProviderSearch {
  provider: string
  query: string
  count: number
  courses: PublicCourse[]
  note?: string | null
}

export function usePublicApiIndex() {
  return useQuery({
    queryKey: ['public-api', 'index'],
    queryFn: () => apiClient.get<PublicApiIndex>('/public', { skipAuth: true }),
    staleTime: 1000 * 60 * 30,
  })
}

export function usePublicSources(category?: string) {
  return useQuery({
    queryKey: ['public-api', 'sources', category ?? null],
    queryFn: () => {
      const qs = category ? `?category=${encodeURIComponent(category)}` : ''
      return apiClient.get<PublicDataSource[]>(`/public/sources${qs}`, { skipAuth: true })
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function usePublicCourse(id: string) {
  return useQuery({
    queryKey: ['public-api', 'course', id],
    queryFn: () => apiClient.get<PublicCourse>(`/public/courses/${id}`, { skipAuth: true }),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function usePublicCourseGeometry(id: string) {
  return useQuery({
    queryKey: ['public-api', 'course-geometry', id],
    queryFn: () =>
      apiClient.get<PublicCourseGeometry>(`/public/courses/${id}/geometry`, { skipAuth: true }),
    enabled: !!id,
    retry: false,
    staleTime: 1000 * 60 * 15,
  })
}

export function usePublicCourseConditions(id: string, date?: string) {
  return useQuery({
    queryKey: ['public-api', 'course-conditions', id, date ?? null],
    queryFn: () => {
      const qs = date ? `?date=${encodeURIComponent(date)}` : ''
      return apiClient.get<CourseConditions>(`/public/courses/${id}/conditions${qs}`, {
        skipAuth: true,
      })
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  })
}

export function usePublicCourseConditionSources(id: string, date?: string) {
  return useQuery({
    queryKey: ['public-api', 'course-condition-sources', id, date ?? null],
    queryFn: () => {
      const qs = date ? `?date=${encodeURIComponent(date)}` : ''
      return apiClient.get<PublicConditionSources>(`/public/courses/${id}/condition-sources${qs}`, {
        skipAuth: true,
      })
    },
    enabled: !!id,
    retry: false,
    staleTime: 1000 * 60 * 30,
  })
}

export function usePublicBrands() {
  return useQuery({
    queryKey: ['public-api', 'brands'],
    queryFn: () => apiClient.get<Brand[]>('/public/equipment/brands', { skipAuth: true }),
    staleTime: 1000 * 60 * 30,
  })
}

export function usePublicClubModels() {
  return useQuery({
    queryKey: ['public-api', 'club-models'],
    queryFn: () => apiClient.get<ClubModel[]>('/public/equipment/club-models', { skipAuth: true }),
    staleTime: 1000 * 60 * 30,
  })
}

export function useGolfCourseAPIStatus() {
  return useQuery({
    queryKey: ['public-api', 'golfcourseapi', 'status'],
    queryFn: () =>
      apiClient.get<GolfCourseAPIProviderStatus>('/public/providers/golfcourseapi/status', {
        skipAuth: true,
      }),
    staleTime: 1000 * 60,
  })
}

export function useGolfCourseAPISearch(query: string) {
  return useQuery({
    queryKey: ['public-api', 'golfcourseapi', 'search', query],
    queryFn: () =>
      apiClient.get<GolfCourseAPIProviderSearch>(
        `/public/providers/golfcourseapi/search?q=${encodeURIComponent(query)}`,
        { skipAuth: true }
      ),
    enabled: query.trim().length >= 2,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}
