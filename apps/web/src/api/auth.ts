import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore, type Persona } from '@/stores/authStore'

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
  persona?: Persona
  home_club_id?: string | null
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
    persona?: Persona
    home_club_id?: string | null
    onboarding_completed?: boolean
    language: string
    units: string
    created_at: string
  }
}

export function mapApiUser(u: AuthResponse['user']) {
  return mapUser(u)
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

function mapUser(u: AuthResponse['user']) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    handicapIndex: u.handicap_index,
    goalHandicap: u.goal_handicap,
    dreamHandicap: u.dream_handicap,
    practiceFrequency: u.practice_frequency,
    persona: u.persona,
    homeClubId: u.home_club_id ?? null,
    onboardingCompleted: u.onboarding_completed,
    language: u.language,
    units: u.units,
  }
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
      setUser(mapUser(data.user))
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
      setUser(mapUser(data.user))
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

interface CompareSide {
  id: string
  display_name: string
  handicap?: number | null
  driver_carry?: number | null
  seven_iron_carry?: number | null
}

export interface FriendCompareResponse {
  user: CompareSide
  friend: CompareSide
}

export function useFriendCompare(friendId: string | null) {
  return useQuery({
    queryKey: ['friend-compare', friendId],
    queryFn: () =>
      apiClient.get<FriendCompareResponse>(`/friends/compare/${friendId}`),
    enabled: !!friendId,
  })
}

export interface ProfileUpdate {
  display_name?: string
  handicap_index?: number
  goal_handicap?: number
  dream_handicap?: number
  practice_frequency?: string
  persona?: Persona
  home_club_id?: string | null
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
      updateUser(mapUser(data))
    },
  })
}
