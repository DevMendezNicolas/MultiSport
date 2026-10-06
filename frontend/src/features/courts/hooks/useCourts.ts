import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courtsApi } from '../api/courtsApi'
import type { CreateCourtPayload } from '../types'

export const COURTS_QUERY_KEY = ['courts'] as const
export const SPORTS_QUERY_KEY = ['courts', 'sports'] as const

export const useSports = () => {
  return useQuery({
    queryKey: SPORTS_QUERY_KEY,
    queryFn: courtsApi.getSports,
    staleTime: 1000 * 60 * 30, // 30 minutos de vigencia para catalogo maestro
  })
}

export const useCourts = () => {
  return useQuery({
    queryKey: COURTS_QUERY_KEY,
    queryFn: courtsApi.getCourts,
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateCourt = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCourtPayload) => courtsApi.createCourt(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: COURTS_QUERY_KEY })
    },
  })
}
