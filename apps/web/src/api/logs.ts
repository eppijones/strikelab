import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

interface SessionLogTemplate {
  id: string
  name: string
  language: string
  description?: string
  structure: {
    pre_session?: Record<string, unknown>
    shot_blocks?: Array<{ name: string; fields: string[] }>
    post_session?: Record<string, unknown>
    fatigue_mode?: boolean
  }
  is_default: boolean
  is_system: boolean
  created_at: string
}

interface SessionLog {
  id: string
  session_id?: string
  template_id?: string
  user_id: string
  tee_time_id?: string
  energy_level?: number
  mental_state?: number
  intent?: string
  routine_discipline?: boolean
  feel_tags?: string[]
  shot_blocks?: Array<Record<string, unknown>>
  what_worked?: string
  take_forward?: string
  dont_overthink?: string
  coach_note?: string
  fatigue_mode: boolean
  created_at: string
  updated_at: string
}

interface SessionLogCreate {
  session_id?: string
  template_id?: string
  tee_time_id?: string
  energy_level?: number
  mental_state?: number
  intent?: string
  routine_discipline?: boolean
  feel_tags?: string[]
  shot_blocks?: Array<Record<string, unknown>>
  what_worked?: string
  take_forward?: string
  dont_overthink?: string
  coach_note?: string
  fatigue_mode?: boolean
}

export function useLogTemplates(language?: string) {
  const queryParams = language ? `?language=${language}` : ''
  
  return useQuery({
    queryKey: ['log-templates', language],
    queryFn: () =>
      apiClient.get<SessionLogTemplate[]>(`/log/templates${queryParams}`),
  })
}

export function useSessionLog(sessionId: string) {
  return useQuery({
    queryKey: ['session-log', sessionId],
    queryFn: () => apiClient.get<SessionLog>(`/log/${sessionId}`),
    enabled: !!sessionId,
  })
}

export function useCreateLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SessionLogCreate) => {
      return apiClient.post<SessionLog>('/log/submit', data)
    },
    onSuccess: (_, variables) => {
      if (variables.session_id) {
        queryClient.invalidateQueries({
          queryKey: ['session-log', variables.session_id],
        })
      }
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<SessionLogTemplate, 'id' | 'is_system' | 'created_at'>) => {
      return apiClient.post<SessionLogTemplate>('/log/templates', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log-templates'] })
    },
  })
}
