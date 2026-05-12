import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// ─────────────────────────────────────────────────────────────────────
// Types — mirror apps/api/app/schemas/booking.py
// ─────────────────────────────────────────────────────────────────────

export interface HourlyCondition {
  h: number
  t: number
  w: number
  dir?: string | null
  sun: number
  cloud: number
  rain: number
}

export interface CourseConditions {
  course_id: string
  captured_at: string
  for_date: string | null
  hourly: HourlyCondition[] | null
  green_speed?: number | null
  fairway_state?: string | null
  rough_state?: string | null
  mowed_hrs_ago?: number | null
  wind_ms?: number | null
  temp_c?: number | null
  sun_pct?: number | null
  cloud_pct?: number | null
  rain_pct?: number | null
  sunrise?: string | null
  sunset?: string | null
  golden_start?: string | null
  source: string
}

export interface SlotOccupant {
  user_id: string
  initials: string
  is_friend: boolean
  handicap?: number | null
}

export interface TeeSheetSlot {
  id: string
  tee_time: string
  players_total: number
  players_taken: number
  available: number
  price_amount: number | null
  currency: string
  peak: boolean
  golden: boolean
  twilight: boolean
  is_blocked: boolean
  provider_ref: string | null
  occupants: SlotOccupant[]
}

export interface TeeSheet {
  id: string
  course_id: string
  course_name: string
  date: string
  opens_at: string
  closes_at: string
  interval_min: number
  currency: string
  provider: string
  slots: TeeSheetSlot[]
  conditions: CourseConditions | null
}

export interface BestWindow {
  label: string
  label_no: string
  label_en: string
  start_hour: number
  end_hour: number
  range: string
  conditions_summary: string
  free_slots: number
  accent: 'moss' | 'sun' | 'fjord'
}

export interface RecommendedSlot {
  course_id: string
  course_name: string
  course_city: string | null
  course_region: string | null
  course_type: string | null
  drive_min: number | null
  drive_km: number | null
  slot_id: string
  tee_time: string
  available: number
  price_amount: number | null
  currency: string
  score: number
  why: string[]
  window_label: string | null
  sun_pct: number | null
  wind_ms: number | null
  temp_c: number | null
  rain_pct: number | null
}

export interface DiscoverResponse {
  bucket: string
  best_now: RecommendedSlot[]
  today_window: RecommendedSlot[]
  tonight: RecommendedSlot[]
  weekend: RecommendedSlot[]
  favorites: RecommendedSlot[]
  nearby: RecommendedSlot[]
}

export interface BookingPreferences {
  id: string
  user_id: string
  time_bands: string[] | null
  max_wind_ms: number | null
  max_rain_pct: number | null
  min_temp_c: number | null
  course_types: string[] | null
  solo_only: boolean
  no_groups_behind_min: number | null
  walking_only: boolean
  favorite_course_id: string | null
  default_player_ids: string[] | null
  show_to_pairs: boolean
  handicap_visible: boolean
}

export interface BookingPreferencesUpdate {
  time_bands?: string[] | null
  max_wind_ms?: number | null
  max_rain_pct?: number | null
  min_temp_c?: number | null
  course_types?: string[] | null
  solo_only?: boolean
  no_groups_behind_min?: number | null
  walking_only?: boolean
  favorite_course_id?: string | null
  default_player_ids?: string[] | null
  show_to_pairs?: boolean
  handicap_visible?: boolean
}

export interface PassPlayer {
  name: string
  initials: string
  handicap?: number | null
  is_you: boolean
}

export interface PassResponse {
  booking_id: string
  course_id: string | null
  course_name: string
  course_city: string | null
  course_region: string | null
  course_type: string | null
  tee_time: string
  countdown_seconds: number
  players: PassPlayer[]
  forecast_temp_c: number | null
  forecast_wind_ms: number | null
  forecast_wind_dir: string | null
  forecast_state: string | null
  drive_min: number | null
  check_in_code: string | null
  qr_code: string | null
  cancel_free_until: string | null
  status: string
}

export interface HoldPlayerInput {
  user_id?: string | null
  name: string
  handicap?: number | null
  phone?: string | null
}

export interface HoldRequest {
  slot_id?: string | null
  course_id?: string | null
  course_name: string
  tee_time: string
  players: number
  player_payload?: HoldPlayerInput[]
  provider?: string
  provider_ref?: string | null
  price_amount?: number | null
  currency?: string
}

export interface HoldResponse {
  id: string
  user_id: string
  slot_id: string | null
  course_id: string | null
  course_name: string
  tee_time: string
  players: number
  provider: string
  provider_ref: string | null
  price_amount: number | null
  currency: string
  total_amount: number | null
  payment_method: string | null
  status: string
  expires_at: string
}

export interface ConfirmRequest {
  hold_id: string
  payment_method: 'vipps' | 'apple_pay' | 'card'
  payment_token?: string
  split_mode?: 'together' | 'split'
  notes?: string
}

export interface ConfirmResponse {
  booking_id: string
  tee_time_id: string | null
  course_name: string
  tee_time: string
  status: string
  check_in_code: string | null
  payment_method: string
  payment_status: string
  pass_url: string | null
}

export interface Playmate {
  id: string
  friend_user_id: string | null
  display_name: string | null
  handicap: number | null
  last_played_at: string | null
  rounds_together: number
  public_handicap_visible: boolean
}

// ─────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────

export function useDiscover() {
  return useQuery({
    queryKey: ['tee', 'discover'],
    queryFn: () => apiClient.get<DiscoverResponse>('/booking/discover'),
    staleTime: 30_000,
  })
}

export function useTeeSheet(courseId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ['tee', 'sheet', courseId, date],
    queryFn: () => {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      return apiClient.get<TeeSheet>(
        `/booking/courses/${courseId}/sheet?${params.toString()}`,
      )
    },
    enabled: !!courseId,
    staleTime: 30_000,
  })
}

export function useBestWindows(courseId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ['tee', 'windows', courseId, date],
    queryFn: () => {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      return apiClient.get<BestWindow[]>(
        `/booking/windows/${courseId}?${params.toString()}`,
      )
    },
    enabled: !!courseId,
    staleTime: 60_000,
  })
}

export function useCourseConditions(courseId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ['tee', 'conditions', courseId, date],
    queryFn: () => {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      return apiClient.get<CourseConditions>(
        `/booking/courses/${courseId}/conditions?${params.toString()}`,
      )
    },
    enabled: !!courseId,
    staleTime: 60_000,
  })
}

export function usePreferences() {
  return useQuery({
    queryKey: ['tee', 'preferences'],
    queryFn: () => apiClient.get<BookingPreferences>('/booking/preferences'),
  })
}

export function useUpdatePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BookingPreferencesUpdate) =>
      apiClient.patch<BookingPreferences>('/booking/preferences', payload),
    onSuccess: (data) => {
      qc.setQueryData(['tee', 'preferences'], data)
      qc.invalidateQueries({ queryKey: ['tee', 'discover'] })
    },
  })
}

export function useHoldSlotV2() {
  return useMutation({
    mutationFn: (payload: HoldRequest) =>
      apiClient.post<HoldResponse>('/booking/hold', payload),
  })
}

export function useConfirmBookingV2() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConfirmRequest) =>
      apiClient.post<ConfirmResponse>('/booking/confirm', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tee'] })
      qc.invalidateQueries({ queryKey: ['tee-times'] })
    },
  })
}

export function usePass(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['tee', 'pass', bookingId],
    queryFn: () => apiClient.get<PassResponse>(`/booking/passes/${bookingId}`),
    enabled: !!bookingId,
    refetchInterval: 60_000, // keep countdown fresh
  })
}

export function useUpcomingPasses() {
  return useQuery({
    queryKey: ['tee', 'passes'],
    queryFn: () => apiClient.get<PassResponse[]>('/booking/passes?upcoming_only=true'),
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) =>
      apiClient.post<{ cancelled: boolean }>(`/booking/cancel/${bookingId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tee'] })
      qc.invalidateQueries({ queryKey: ['tee-times'] })
    },
  })
}

export function usePlaymates() {
  return useQuery({
    queryKey: ['tee', 'playmates'],
    queryFn: () => apiClient.get<Playmate[]>('/booking/playmates'),
  })
}
