import { useAuthStore } from '@/stores/authStore'
import { API_URL } from '@/lib/constants'

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth, ...fetchOptions } = options
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    }

    if (!skipAuth) {
      const token = useAuthStore.getState().accessToken
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken()
      if (refreshed) {
        // Retry the request
        const newToken = useAuthStore.getState().accessToken
        headers['Authorization'] = `Bearer ${newToken}`
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers,
        })
        if (!retryResponse.ok) {
          throw new Error(`API Error: ${retryResponse.statusText}`)
        }
        return retryResponse.json()
      } else {
        useAuthStore.getState().logout()
        throw new Error('Session expired')
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `API Error: ${response.statusText}`)
    }

    // Handle empty responses
    const text = await response.text()
    return text ? JSON.parse(text) : null
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) return false

      const data = await response.json()
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token)
      return true
    } catch {
      return false
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const token = useAuthStore.getState().accessToken
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || 'Upload failed')
    }

    return response.json()
  }
}

export const apiClient = new ApiClient(API_URL)
