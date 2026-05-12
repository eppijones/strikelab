import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { API_URL } from '@/lib/constants'

/// Build the WS URL from the configured API URL by swapping the protocol.
function wsUrlFromApi(apiUrl: string): string {
  if (apiUrl.startsWith('/')) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}${apiUrl}/ws/rounds`
  }
  const httpsToWss = apiUrl.replace(/^https?:\/\//, (m) =>
    m === 'https://' ? 'wss://' : 'ws://'
  )
  return `${httpsToWss}/ws/rounds`
}

type RealtimeEvent =
  | { type: 'connected'; user_id: string }
  | { type: 'pong' }
  | { type: 'round.created'; round_id: string }
  | { type: 'round.updated'; round_id: string }
  | { type: 'round.deleted'; round_id: string }
  | { type: 'round.shot.added'; round_id: string; shot_id?: string }
  | { type: 'round.shots.added'; round_id: string; count?: number }

/// Subscribes to `/ws/rounds` for the authenticated user and invalidates
/// the relevant TanStack Query caches when round/shot events arrive.
///
/// Mount once near the root of the app. Reconnects with exponential
/// backoff (1s → 30s cap). Closes cleanly when the user logs out.
export function useRealtime() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.accessToken)
  const reconnectAttemptsRef = useRef(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const closedByUsRef = useRef(false)

  useEffect(() => {
    if (!token) {
      closedByUsRef.current = true
      wsRef.current?.close()
      wsRef.current = null
      return
    }

    closedByUsRef.current = false

    const connect = () => {
      const url = `${wsUrlFromApi(API_URL)}?token=${encodeURIComponent(token)}`
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (e) => {
        let payload: RealtimeEvent | null = null
        try {
          payload = JSON.parse(e.data)
        } catch {
          return
        }
        if (!payload || typeof payload !== 'object') return

        switch (payload.type) {
          case 'round.created':
          case 'round.deleted':
            queryClient.invalidateQueries({ queryKey: ['rounds'] })
            break
          case 'round.updated':
          case 'round.shot.added':
          case 'round.shots.added':
            queryClient.invalidateQueries({ queryKey: ['rounds'] })
            queryClient.invalidateQueries({ queryKey: ['round', payload.round_id] })
            break
          case 'connected':
          case 'pong':
            break
        }
      }

      ws.onclose = () => {
        wsRef.current = null
        if (closedByUsRef.current) return
        const attempt = reconnectAttemptsRef.current + 1
        reconnectAttemptsRef.current = attempt
        const delayMs = Math.min(30_000, 1_000 * Math.pow(2, attempt - 1))
        reconnectTimerRef.current = window.setTimeout(connect, delayMs)
      }

      ws.onerror = () => {
        // Swallow — `onclose` is the source of truth for retries.
      }
    }

    connect()

    return () => {
      closedByUsRef.current = true
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [token, queryClient])
}
