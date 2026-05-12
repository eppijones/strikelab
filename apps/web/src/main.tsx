import React from 'react'
import { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import App from './App'
import { API_URL } from '@/lib/constants'
import { mapApiUser } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import './i18n'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const app = (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      logout()
      return
    }

    let cancelled = false
    async function syncClerkSession() {
      const token = await getToken()
      if (!token || cancelled) return
      setTokens(token, null)
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok || cancelled) return
      const apiUser = await response.json()
      setUser(mapApiUser(apiUser))
    }

    syncClerkSession().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn, logout, setTokens, setUser, user?.id])

  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  clerkPublishableKey ? (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInUrl="/login"
      signUpUrl="/register"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <ClerkAuthBridge>{app}</ClerkAuthBridge>
    </ClerkProvider>
  ) : app,
)
