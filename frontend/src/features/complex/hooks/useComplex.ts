import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complexApi } from '../api/complexApi'
import type {
  UpdateComplexProfilePayload,
  UpdateComplexSchedulesPayload,
} from '../types'

export const COMPLEX_QUERY_KEY = ['complex', 'profile'] as const

export const useComplexProfile = () => {
  return useQuery({
    queryKey: COMPLEX_QUERY_KEY,
    queryFn: complexApi.getProfile,
  })
}

export const useUpdateComplexProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateComplexProfilePayload) => complexApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLEX_QUERY_KEY })
    },
  })
}

export const useUpdateComplexSchedules = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateComplexSchedulesPayload) => complexApi.updateSchedules(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLEX_QUERY_KEY })
    },
  })
}
