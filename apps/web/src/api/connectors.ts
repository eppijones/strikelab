import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

interface Connector {
  id: string
  name: string
  description: string
  status: 'available' | 'connected' | 'coming_soon'
  connected: boolean
  last_sync?: string
  capabilities: string[]
}

interface ImportResponse {
  success: boolean
  session_id?: string
  shots_imported: number
  errors: string[]
  warnings: string[]
}

export function useConnectors() {
  return useQuery({
    queryKey: ['connectors'],
    queryFn: () => apiClient.get<Connector[]>('/connectors'),
  })
}

export function useConnectConnector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectorId: string) => {
      return apiClient.post(`/connectors/${connectorId}/connect`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] })
    },
  })
}

export function useDisconnectConnector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectorId: string) => {
      return apiClient.post(`/connectors/${connectorId}/disconnect`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] })
    },
  })
}

export function useImportCSV() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      sessionName,
      sessionType,
    }: {
      file: File
      sessionName?: string
      sessionType?: string
    }) => {
      return apiClient.uploadFile<ImportResponse>('/sessions/import/csv', file, {
        session_name: sessionName || '',
        session_type: sessionType || 'range',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useImportFromConnector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      connectorId,
      options,
    }: {
      connectorId: string
      options?: Record<string, unknown>
    }) => {
      return apiClient.post<ImportResponse>(
        `/sessions/import/connector/${connectorId}`,
        options
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
