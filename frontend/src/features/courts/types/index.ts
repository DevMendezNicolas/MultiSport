export interface CreateCourtPayload {
  name: string
  surfaceType: string
  isCovered: boolean
  hasLighting: boolean
  bufferMinutes: number
  basePrice: number
  durationMinutes: number
  sportIds: string[]
}

export interface CourtSportResponse {
  sportId: string
  sportName: string
  iconUrl: string | null
  basePrice: number
  durationMinutes: number
}

export interface CourtResponse {
  id: string
  complexId: string
  name: string
  surfaceType: string
  isCovered: boolean
  hasLighting: boolean
  bufferMinutes: number
  basePrice: number
  durationMinutes: number
  isActive: boolean
  sports: CourtSportResponse[]
  createdAt: string
}

export interface SportResponse {
  id: string
  name: string
  iconUrl: string | null
  maxPlayers: number
}
