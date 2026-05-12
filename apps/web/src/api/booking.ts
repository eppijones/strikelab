import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface BookingSlot {
  course_id?: string | null
  course_name: string
  tee_time: string
  players_available: number
  price_currency?: string
  price_amount?: number
  provider: 'internal' | 'manual' | 'golfbox' | 'chronogolf' | string
  provider_ref?: string | null
  book_url?: string | null
}

export interface BookingHold {
  hold_id: string
  expires_at: string
  provider: string
}

export function useBookingSearch(params: { course_id?: string; date?: string; players?: number }) {
  const query = new URLSearchParams()
  if (params.course_id) query.set('course_id', params.course_id)
  if (params.date) query.set('date', params.date)
  if (params.players) query.set('players', params.players.toString())
  return useQuery({
    queryKey: ['booking-search', params],
    queryFn: () => apiClient.get<BookingSlot[]>(`/booking/search?${query.toString()}`),
    enabled: !!params.date,
    retry: false,
  })
}

export function useHoldSlot() {
  return useMutation({
    mutationFn: (slot: BookingSlot & { players?: number }) =>
      apiClient.post<BookingHold>('/booking/hold', {
        course_id: slot.course_id,
        course_name: slot.course_name,
        tee_time: slot.tee_time,
        players: slot.players ?? 1,
        provider: slot.provider,
        provider_ref: slot.provider_ref,
      }),
  })
}

export function useConfirmBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { hold_id: string; notes?: string }) =>
      apiClient.post<{ tee_time_id: string; status: string; course_name: string }>(
        '/booking/confirm',
        data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tee-times'] })
    },
  })
}
