import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

// Types
export interface Club {
  id: string
  bag_id: string
  club_type: string
  club_label: string | null
  brand_id: string
  model_name: string
  year: number | null
  shaft_brand: string | null
  shaft_model: string | null
  shaft_flex: string | null
  shaft_weight: number | null
  loft: number | null
  lie: number | null
  length: number | null
  swing_weight: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Bag {
  id: string
  user_id: string
  name: string
  is_primary: number
  ball_brand: string | null
  ball_model: string | null
  clubs: Club[]
  created_at: string
  updated_at: string
}

export interface BagListItem {
  id: string
  name: string
  is_primary: number
  club_count: number
}

export interface ClubStats {
  id: string
  club_label: string
  total_shots: number
  good_shots: number
  avg_carry: number | null
  max_carry: number | null
  avg_ball_speed: number | null
  avg_launch_angle: number | null
  avg_spin_rate: number | null
  avg_club_speed: number | null
  avg_smash_factor: number | null
  dispersion_radius: number | null
  last_updated: string
}

export interface CreateBagData {
  name: string
  ball_brand?: string
  ball_model?: string
  clubs?: CreateClubData[]
}

export interface CreateClubData {
  club_type: string
  club_label?: string
  brand_id: string
  model_name: string
  year?: number
  shaft_brand?: string
  shaft_model?: string
  shaft_flex?: string
  loft?: number
}

export interface QuickAddClubData {
  club_type: string
  club_label: string
  brand_id: string
  model_name: string
}

// API Functions
async function fetchBags(): Promise<BagListItem[]> {
  const response = await apiClient.get('/equipment/bags')
  return response.data
}

async function fetchBag(bagId: string): Promise<Bag> {
  const response = await apiClient.get(`/equipment/bags/${bagId}`)
  return response.data
}

async function fetchMyBag(): Promise<Bag> {
  const response = await apiClient.get('/equipment/my-bag')
  return response.data
}

async function createBag(data: CreateBagData): Promise<Bag> {
  const response = await apiClient.post('/equipment/bags', data)
  return response.data
}

async function updateBag(bagId: string, data: Partial<CreateBagData>): Promise<Bag> {
  const response = await apiClient.patch(`/equipment/bags/${bagId}`, data)
  return response.data
}

async function deleteBag(bagId: string): Promise<void> {
  await apiClient.delete(`/equipment/bags/${bagId}`)
}

async function addClub(bagId: string, data: CreateClubData): Promise<Club> {
  const response = await apiClient.post(`/equipment/bags/${bagId}/clubs`, data)
  return response.data
}

async function quickAddClubs(bagId: string, clubs: QuickAddClubData[]): Promise<Club[]> {
  const response = await apiClient.post(`/equipment/bags/${bagId}/quick-add`, clubs)
  return response.data
}

async function updateClub(clubId: string, data: Partial<CreateClubData>): Promise<Club> {
  const response = await apiClient.patch(`/equipment/clubs/${clubId}`, data)
  return response.data
}

async function deleteClub(clubId: string): Promise<void> {
  await apiClient.delete(`/equipment/clubs/${clubId}`)
}

async function fetchClubStats(): Promise<ClubStats[]> {
  const response = await apiClient.get('/equipment/stats')
  return response.data
}

// React Query Hooks
export function useBags() {
  return useQuery({
    queryKey: ['bags'],
    queryFn: fetchBags,
  })
}

export function useBag(bagId: string) {
  return useQuery({
    queryKey: ['bag', bagId],
    queryFn: () => fetchBag(bagId),
    enabled: !!bagId,
  })
}

export function useMyBag() {
  return useQuery({
    queryKey: ['my-bag'],
    queryFn: fetchMyBag,
  })
}

export function useCreateBag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createBag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bags'] })
      queryClient.invalidateQueries({ queryKey: ['my-bag'] })
    },
  })
}

export function useUpdateBag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bagId, data }: { bagId: string; data: Partial<CreateBagData> }) =>
      updateBag(bagId, data),
    onSuccess: (_, { bagId }) => {
      queryClient.invalidateQueries({ queryKey: ['bags'] })
      queryClient.invalidateQueries({ queryKey: ['bag', bagId] })
      queryClient.invalidateQueries({ queryKey: ['my-bag'] })
    },
  })
}

export function useDeleteBag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteBag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bags'] })
      queryClient.invalidateQueries({ queryKey: ['my-bag'] })
    },
  })
}

export function useAddClub() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bagId, data }: { bagId: string; data: CreateClubData }) =>
      addClub(bagId, data),
    onSuccess: (_, { bagId }) => {
      queryClient.invalidateQueries({ queryKey: ['bag', bagId] })
      queryClient.invalidateQueries({ queryKey: ['my-bag'] })
      queryClient.invalidateQueries({ queryKey: ['bags'] })
    },
  })
}

export function useQuickAddClubs() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bagId, clubs }: { bagId: string; clubs: QuickAddClubData[] }) =>
      quickAddClubs(bagId, clubs),
    onSuccess: (_, { bagId }) => {
      queryClient.invalidateQueries({ queryKey: ['bag', bagId] })
      queryClient.invalidateQueries({ queryKey: ['my-bag'] })
      queryClient.invalidateQueries({ queryKey: ['bags'] })
    },
  })
}

export function useUpdateClub() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ clubId, data }: { clubId: string; data: Partial<CreateClubData> }) =>
      updateClub(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bag'] })
      queryClient.invalidateQueries({ queryKey: ['my-bag'] })
    },
  })
}

export function useDeleteClub() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bag'] })
      queryClient.invalidateQueries({ queryKey: ['my-bag'] })
      queryClient.invalidateQueries({ queryKey: ['bags'] })
    },
  })
}

export function useClubStats() {
  return useQuery({
    queryKey: ['club-stats'],
    queryFn: fetchClubStats,
  })
}
