import { useQuery } from '@tanstack/react-query'
import { authFetch } from '@/api/authFetch'
import { API_URL } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import type { StrikeLabRangeExport } from '@/features/range-session/types'

export interface RangeSessionApiListItem {
  id: string
  shot_count: number
  start_time: string | null
  location: string | null
  schema_version: number
  updated_at: string
}

export interface RangeSessionApiDetail {
  id: string
  shot_count: number
  start_time: string | null
  location: string | null
  schema_version: number
  created_at: string
  updated_at: string
  payload: Record<string, unknown>
}

export interface RangeSessionsFetchResult {
  sessions: RangeSessionApiListItem[]
  /** When non-null, list is empty but connector sessions can still render. */
  error: string | null
}

/** Strict fetch — throws (used by mutations / detail). */
export async function fetchRangeSessions(): Promise<RangeSessionApiListItem[]> {
  const { sessions, error } = await fetchRangeSessionsResult()
  if (error) {
    throw new Error(error)
  }
  return sessions
}

/** Resilient fetch for React Query — never throws. */
export async function fetchRangeSessionsResult(): Promise<RangeSessionsFetchResult> {
  const res = await authFetch(`${API_URL}/range-sessions`)
  if (res.status === 401) {
    return { sessions: [], error: 'Sign in again to load Caddie range sessions.' }
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return {
      sessions: [],
      error:
        detail.trim() ||
        `Range sessions API returned HTTP ${res.status}. If you just added this feature, run database migrations (alembic upgrade head) and restart the API.`,
    }
  }
  try {
    const data = (await res.json()) as { sessions?: RangeSessionApiListItem[] }
    return { sessions: Array.isArray(data.sessions) ? data.sessions : [], error: null }
  } catch {
    return { sessions: [], error: 'Invalid JSON from range-sessions API.' }
  }
}

export async function fetchRangeSessionDetail(id: string): Promise<RangeSessionApiDetail> {
  const res = await authFetch(`${API_URL}/range-sessions/${encodeURIComponent(id)}`)
  if (res.status === 401) {
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    throw new Error((await res.text()) || `HTTP ${res.status}`)
  }
  return res.json() as Promise<RangeSessionApiDetail>
}

export function rangeShotAudioUrl(sessionId: string, shotId: string): string {
  return `${API_URL}/range-sessions/${encodeURIComponent(sessionId)}/shots/${encodeURIComponent(shotId)}/audio`
}

/** Upsert the same JSON envelope the iPhone exports (`StrikeLabRangeExport`). */
export async function putRangeSessionSync(body: StrikeLabRangeExport): Promise<void> {
  const res = await authFetch(`${API_URL}/range-sessions/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 401) {
    throw new Error('Sign in to sync range sessions to StrikeLab.')
  }
  if (!res.ok) {
    throw new Error((await res.text()) || `HTTP ${res.status}`)
  }
}

/** Cloud range sessions (Watch → Caddie → API). Empty when not signed in; does not throw on API errors. */
export function useRangeSessionsList() {
  const token = useAuthStore((s) => s.accessToken)
  return useQuery({
    queryKey: ['range-sessions'],
    queryFn: fetchRangeSessionsResult,
    enabled: !!token,
  })
}

export async function deleteRangeSession(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/range-sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 404) {
    throw new Error((await res.text()) || `HTTP ${res.status}`)
  }
}
