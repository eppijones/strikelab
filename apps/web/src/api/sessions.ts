import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

interface Session {
  id: string
  user_id: string
  source: string
  session_type: string
  name?: string
  notes?: string
  session_date: string
  computed_stats?: {
    shot_count?: number
    clubs_used?: string[]
    avg_carry?: Record<string, number>
    strike_score?: number
    face_control_score?: number
    distance_control_score?: number
    dispersion_score?: number
  }
  created_at: string
  updated_at: string
  shot_count: number
}

interface SessionsResponse {
  sessions: Session[]
  total: number
}

interface Shot {
  id: string
  session_id: string
  shot_number: number
  club: string
  target_distance?: number
  carry_distance?: number
  total_distance?: number
  ball_speed?: number
  launch_angle?: number
  spin_rate?: number
  spin_axis?: number
  peak_height?: number
  land_angle?: number
  hang_time?: number
  offline_distance?: number
  club_speed?: number
  smash_factor?: number
  attack_angle?: number
  club_path?: number
  face_angle?: number
  face_to_path?: number
  face_to_target?: number
  impact_height?: number
  impact_offset?: number
  is_mishit: boolean
  mishit_type?: string
  notes?: string
  created_at: string
}

interface ShotUpdate {
  is_mishit?: boolean
  mishit_type?: string
  notes?: string
}

export function useSessions(params?: {
  session_type?: string
  limit?: number
  offset?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.session_type) queryParams.set('session_type', params.session_type)
  if (params?.limit) queryParams.set('limit', params.limit.toString())
  if (params?.offset) queryParams.set('offset', params.offset.toString())

  const queryString = queryParams.toString()
  const endpoint = `/sessions${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => apiClient.get<SessionsResponse>(endpoint),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => apiClient.get<Session>(`/sessions/${id}`),
    enabled: !!id,
  })
}

export function useSessionShots(sessionId: string) {
  return useQuery({
    queryKey: ['session-shots', sessionId],
    queryFn: () => apiClient.get<Shot[]>(`/sessions/${sessionId}/shots`),
    enabled: !!sessionId,
  })
}

export function useUpdateShot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      shotId,
      data,
    }: {
      sessionId: string
      shotId: string
      data: ShotUpdate
    }) => {
      return apiClient.patch<Shot>(`/sessions/${sessionId}/shots/${shotId}`, data)
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session-shots', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/sessions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
