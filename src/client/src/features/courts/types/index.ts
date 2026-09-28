export interface CourtResponse {
  id: string
  name: string
  sportType: string
  hasLighting: boolean
  hourlyRate: number
  isActive: boolean
  createdAt: string
  createdBy: string | null
  updatedAt: string
  updatedBy: string | null
}

export interface CreateCourtPayload {
  name: string
  sportType: string
  hasLighting: boolean
  hourlyRate: number
}
