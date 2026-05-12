import { API_URL } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'

/** Shared with ApiClient — single implementation of refresh. */
export async function performTokenRefresh(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) return false

    const data = (await response.json()) as { access_token: string; refresh_token: string }
    useAuthStore.getState().setTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    return false
  }
}

export async function setClerkSessionToken(getToken: () => Promise<string | null>): Promise<boolean> {
  const token = await getToken()
  if (!token) return false
  useAuthStore.getState().setTokens(token, null)
  return true
}

function headersWithAuth(base?: HeadersInit): Headers {
  const h = new Headers(base)
  const t = useAuthStore.getState().accessToken
  if (t) h.set('Authorization', `Bearer ${t}`)
  return h
}

/**
 * Authenticated fetch with one 401 → refresh → retry cycle (matches ApiClient).
 * On refresh failure, calls logout and returns the last response.
 */
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const { headers: initHeaders, ...rest } = init
  let res = await fetch(url, { ...rest, headers: headersWithAuth(initHeaders) })

  if (res.status === 401) {
    const refreshed = await performTokenRefresh()
    if (!refreshed) {
      useAuthStore.getState().logout()
      return res
    }
    res = await fetch(url, { ...rest, headers: headersWithAuth(initHeaders) })
    if (res.status === 401) {
      useAuthStore.getState().logout()
    }
  }

  return res
}
