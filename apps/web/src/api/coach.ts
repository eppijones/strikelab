import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

interface CoachReport {
  id: string
  session_id: string
  user_id: string
  diagnosis?: string
  interpretation?: string
  prescription?: string
  validation?: string
  next_best_move?: string
  linked_metrics?: Record<string, unknown>
  report_type: string
  language: string
  created_at: string
}

interface CoachReportCreate {
  session_id: string
  report_type?: string
  language?: string
}

interface ChatMessage {
  id: string
  user_id: string
  session_id?: string
  role: 'user' | 'assistant'
  content: string
  context?: Record<string, unknown>
  created_at: string
}

interface ChatRequest {
  content: string
  session_id?: string
  context?: Record<string, unknown>
}

export function useCoachReports(sessionId?: string) {
  const queryParams = sessionId ? `?session_id=${sessionId}` : ''
  
  return useQuery({
    queryKey: ['coach-reports', sessionId],
    queryFn: () =>
      apiClient.get<CoachReport[]>(`/coach/reports${queryParams}`),
  })
}

export function useCoachReport(id: string) {
  return useQuery({
    queryKey: ['coach-report', id],
    queryFn: () => apiClient.get<CoachReport>(`/coach/reports/${id}`),
    enabled: !!id,
  })
}

export function useGenerateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CoachReportCreate) => {
      return apiClient.post<CoachReport>('/coach/report', data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['coach-reports', variables.session_id],
      })
      queryClient.invalidateQueries({ queryKey: ['coach-reports'] })
    },
  })
}

export function useChatHistory(sessionId?: string) {
  const queryParams = sessionId ? `?session_id=${sessionId}` : ''
  
  return useQuery({
    queryKey: ['chat-history', sessionId],
    queryFn: () =>
      apiClient.get<ChatMessage[]>(`/coach/chat${queryParams}`),
  })
}

export function useSendChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ChatRequest) => {
      return apiClient.post<ChatMessage>('/coach/chat', data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['chat-history', variables.session_id],
      })
      queryClient.invalidateQueries({ queryKey: ['chat-history'] })
    },
  })
}
