export interface CourtDaySchedulePayload {
  dayOfWeek: number // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  firstShiftStart: string // "HH:mm" ej: "08:00"
  lastShiftStart: string // "HH:mm" ej: "22:00"
  priceOverride?: number
  durationMinutesOverride?: number
}

export interface CourtSportConfigPayload {
  sportId: string
  basePrice?: number
  durationMinutes?: number
}

export interface CreateCourtPayload {
  name: string
  surfaceType: string
  isCovered: boolean
  hasLighting: boolean
  bufferMinutes: number
  basePrice: number
  durationMinutes: number
  sportIds: string[]
  schedules: CourtDaySchedulePayload[]
  customSportPrices?: CourtSportConfigPayload[]
}

export interface CourtPricingRuleResponse {
  id: string
  courtSportId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  price: number
  durationMinutes: number
}

export interface CourtSportResponse {
  courtSportId: string
  sportId: string
  sportName: string
  iconUrl: string | null
  basePrice: number
  durationMinutes: number
  pricingRules: CourtPricingRuleResponse[]
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
