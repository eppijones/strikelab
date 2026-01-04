import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '@/stores/authStore'

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  display_name: string
  language?: string
  units?: string
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: string
    email: string
    display_name: string
    handicap_index?: number
    goal_handicap?: number
    dream_handicap?: number
    practice_frequency?: string
    onboarding_completed?: boolean
    language: string
    units: string
    created_at: string
  }
}

interface InviteRequest {
  email?: string
  message?: string
}

interface Invite {
  id: string
  token: string
  email?: string
  message?: string
  used: boolean
  created_at: string
  expires_at?: string
}

interface Friend {
  id: string
  display_name: string
  handicap_index?: number
  status: string
}

export function useLogin() {
  const { setUser, setTokens } = useAuthStore()

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        data,
        { skipAuth: true }
      )
      return response
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      setUser({
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.display_name,
        handicapIndex: data.user.handicap_index,
        goalHandicap: data.user.goal_handicap,
        dreamHandicap: data.user.dream_handicap,
        practiceFrequency: data.user.practice_frequency,
        onboardingCompleted: data.user.onboarding_completed,
        language: data.user.language,
        units: data.user.units,
      })
    },
  })
}

export function useRegister() {
  const { setUser, setTokens } = useAuthStore()

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiClient.post<AuthResponse>(
        '/auth/register',
        data,
        { skipAuth: true }
      )
      return response
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      setUser({
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.display_name,
        handicapIndex: data.user.handicap_index,
        goalHandicap: data.user.goal_handicap,
        dreamHandicap: data.user.dream_handicap,
        practiceFrequency: data.user.practice_frequency,
        onboardingCompleted: data.user.onboarding_completed,
        language: data.user.language,
        units: data.user.units,
      })
    },
  })
}

export function useLogout() {
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      // Optionally call logout endpoint
      return Promise.resolve()
    },
    onSuccess: () => {
      logout()
    },
  })
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: async (data: InviteRequest) => {
      return apiClient.post<Invite>('/auth/invite/create', data)
    },
  })
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      return apiClient.post('/auth/invite/accept', { token })
    },
  })
}

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => apiClient.get<Friend[]>('/friends'),
  })
}

export interface ProfileUpdate {
  display_name?: string
  handicap_index?: number
  goal_handicap?: number
  dream_handicap?: number
  practice_frequency?: string
  onboarding_completed?: boolean
  language?: string
  units?: string
}

export function useUpdateProfile() {
  const { updateUser } = useAuthStore()

  return useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const response = await apiClient.patch<AuthResponse['user']>('/auth/me', data)
      return response
    },
    onSuccess: (data) => {
      updateUser({
        displayName: data.display_name,
        handicapIndex: data.handicap_index,
        goalHandicap: data.goal_handicap,
        dreamHandicap: data.dream_handicap,
        practiceFrequency: data.practice_frequency,
        onboardingCompleted: data.onboarding_completed,
        language: data.language,
        units: data.units,
      })
    },
  })
}
