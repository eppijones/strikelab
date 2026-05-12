import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

export interface Brand {
  id: string
  name: string
  slug: string
  country?: string | null
  founded?: number | null
  color?: string | null
  primary_category: string
  categories?: string[] | null
  logo_path?: string | null
  website?: string | null
  description?: string | null
  is_active: boolean
  sort_order: number
}

export interface ClubModel {
  id: string
  brand_id: string
  name: string
  club_type: string
  year?: number | null
  default_loft?: number | null
  default_lie?: number | null
  is_active: boolean
}

export interface ConnectorCatalog {
  id: string
  name: string
  description?: string | null
  status: 'available' | 'coming_soon' | string
  capabilities?: string[] | null
  color?: string | null
  logo_path?: string | null
  website?: string | null
}

export function useBrands(category?: string) {
  return useQuery({
    queryKey: ['catalog', 'brands', category ?? null],
    queryFn: () => {
      const qs = category ? `?category=${encodeURIComponent(category)}` : ''
      return apiClient.get<Brand[]>(`/catalog/brands${qs}`)
    },
    staleTime: 1000 * 60 * 30,
  })
}

export function useClubModels(params?: { brandId?: string; clubType?: string; year?: number }) {
  const qs = new URLSearchParams()
  if (params?.brandId) qs.set('brand_id', params.brandId)
  if (params?.clubType) qs.set('club_type', params.clubType)
  if (params?.year) qs.set('year', String(params.year))
  const query = qs.toString()
  const endpoint = `/catalog/club-models${query ? `?${query}` : ''}`

  return useQuery({
    queryKey: ['catalog', 'club-models', params ?? null],
    queryFn: () => apiClient.get<ClubModel[]>(endpoint),
    enabled: !!params?.brandId,
    staleTime: 1000 * 60 * 30,
  })
}

export function useConnectorsCatalog() {
  return useQuery({
    queryKey: ['catalog', 'connectors'],
    queryFn: () => apiClient.get<ConnectorCatalog[]>('/catalog/connectors'),
    staleTime: 1000 * 60 * 30,
  })
}
