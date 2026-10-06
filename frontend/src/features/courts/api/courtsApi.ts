import { api } from '@/lib/axios'
import type { CourtResponse, CreateCourtPayload, SportResponse } from '../types'

export const courtsApi = {
  createCourt: async (payload: CreateCourtPayload): Promise<CourtResponse> => {
    const { data } = await api.post<CourtResponse>('/courts', payload)
    return data
  },

  getSports: async (): Promise<SportResponse[]> => {
    const { data } = await api.get<SportResponse[]>('/courts/sports')
    return data
  },

  getCourts: async (): Promise<CourtResponse[]> => {
    const { data } = await api.get<CourtResponse[]>('/courts')
    return data
  },
}
