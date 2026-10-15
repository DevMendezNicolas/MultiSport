import { api } from '@/lib/axios'
import type { CourtResponse, CreateCourtPayload, UpdateCourtPayload, SportResponse } from '../types'

export const courtsApi = {
  createCourt: async (payload: CreateCourtPayload): Promise<CourtResponse> => {
    const { data } = await api.post<CourtResponse>('/courts', payload)
    return data
  },

  getCourts: async (): Promise<CourtResponse[]> => {
    const { data } = await api.get<CourtResponse[]>('/courts')
    return data
  },

  getCourtById: async (id: string): Promise<CourtResponse> => {
    const { data } = await api.get<CourtResponse>(`/courts/${id}`)
    return data
  },

  updateCourt: async (id: string, payload: UpdateCourtPayload): Promise<CourtResponse> => {
    const { data } = await api.put<CourtResponse>(`/courts/${id}`, payload)
    return data
  },

  deleteCourt: async (id: string): Promise<void> => {
    await api.delete(`/courts/${id}`)
  },

  getSports: async (): Promise<SportResponse[]> => {
    const { data } = await api.get<SportResponse[]>('/courts/sports')
    return data
  },
}
