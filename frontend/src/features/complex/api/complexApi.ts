import api from '@/lib/axios'
import type {
  ComplexProfile,
  UpdateComplexProfilePayload,
  UpdateComplexSchedulesPayload,
} from '../types'

export const complexApi = {
  getProfile: async (): Promise<ComplexProfile> => {
    const { data } = await api.get<ComplexProfile>('/complexes/profile')
    return data
  },

  updateProfile: async (payload: UpdateComplexProfilePayload): Promise<void> => {
    await api.put('/complexes/profile', payload)
  },

  updateSchedules: async (payload: UpdateComplexSchedulesPayload): Promise<void> => {
    await api.put('/complexes/schedules', payload)
  },
}
