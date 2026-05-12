import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { API_URL } from '@/lib/constants'

export interface RoundHole {
  hole_number: number
  par: number
  handicap_index: number
  strokes_received: number
  gross_strokes: number
  net_strokes: number
  putts: number
  fairway_hit: boolean | null
  green_in_regulation: boolean | null
  notes?: string | null
}

export interface RoundShot {
  id: string
  hole_number: number
  shot_number: number
  club: string
  timestamp?: string
  start_lat?: number
  start_lon?: number
  end_lat?: number
  end_lon?: number
  distance_yards?: number
  distance_meters?: number
  confidence?: number | null
  is_manual?: boolean
  motion_data?: unknown
  heart_rate_at_shot?: number | null
  heart_rate_variability?: number | null
  biometric_data?: unknown
  outcome?: string
  miss_direction?: string
  lie_type?: string
  shot_context?: {
    audio?: {
      url?: string
      content_type?: string
      byte_count?: number
    }
  } | null
}

export interface Round {
  id: string
  user_id: string
  course_id?: string | null
  course_name: string
  date: string
  selected_tee?: string | null
  is_complete: boolean
  current_hole_number: number
  total_gross: number
  total_net: number
  total_par: number
  holes: RoundHole[]
  shots?: RoundShot[]
}

export function roundShotAudioUrl(roundId: string, shotId: string): string {
  return `${API_URL}/rounds/${encodeURIComponent(roundId)}/shots/${encodeURIComponent(shotId)}/audio`
}

export function useRounds() {
  return useQuery({
    queryKey: ['rounds'],
    queryFn: () => apiClient.get<Round[]>('/rounds'),
    refetchOnWindowFocus: true,
  })
}

export function useRound(id: string) {
  return useQuery({
    queryKey: ['round', id],
    queryFn: () => apiClient.get<Round>(`/rounds/${id}`),
    enabled: !!id,
    refetchOnWindowFocus: true,
  })
}
