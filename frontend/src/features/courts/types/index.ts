export interface CourtPricingTierPayload {
  dayOfWeek: number // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startTime: string // "HH:mm" ej: "08:00"
  endTime: string // "HH:mm" ej: "14:00" o "00:00"
  price: number
  durationMinutes?: number
  sportId?: string
  /**
   * Metadato de UI (SCRUM-50): indica si el usuario personalizó manualmente el precio de esta franja.
   * Si es false o undefined, la franja hereda reactivamente los cambios del precio base general o por deporte.
   */
  isPriceCustom?: boolean
  /**
   * Metadato de UI (SCRUM-50): indica si el usuario personalizó manualmente la duración de esta franja.
   * Si es false o undefined, la franja hereda reactivamente los cambios de la duración base general o por deporte.
   */
  isDurationCustom?: boolean
}

export interface CustomTierIntentionEntry {
  isPriceCustom: boolean
  isDurationCustom: boolean
}

const CUSTOM_TIER_STORAGE_PREFIX = 'multisport:court-custom-tiers:'

export function buildTierIntentionKey(tier: {
  dayOfWeek: number
  startTime: string
  endTime: string
  sportId?: string
}): string {
  const normStart = (tier.startTime || '00:00').substring(0, 5)
  const normEnd = (tier.endTime || '00:00').substring(0, 5)
  return `${tier.dayOfWeek}_${normStart}_${normEnd}_${tier.sportId || 'general'}`
}

/**
 * Persiste en localStorage qué franjas fueron personalizadas manualmente para una cancha específica.
 * NOTA TÉCNICA (SCRUM-50): La tabla `court_pricing_rules` almacena valores finales (`price`, `duration_minutes`)
 * sin columnas dedicadas (`is_price_custom`, `is_duration_custom`). Esta persistencia local preserva la intención
 * exacta del usuario en el navegador actual incluso cuando personaliza una franja con un valor idéntico al base.
 * En otros dispositivos o sesiones limpias se aplica la heurística de comparación contra el valor base (`rule.price !== basePrice`).
 */
export function saveCourtCustomTierIntentions(
  courtId: string,
  tiers: CourtPricingTierPayload[]
): void {
  try {
    const map: Record<string, CustomTierIntentionEntry> = {}
    for (const t of tiers) {
      if (t.isPriceCustom || t.isDurationCustom) {
        map[buildTierIntentionKey(t)] = {
          isPriceCustom: Boolean(t.isPriceCustom),
          isDurationCustom: Boolean(t.isDurationCustom),
        }
      }
    }
    localStorage.setItem(`${CUSTOM_TIER_STORAGE_PREFIX}${courtId}`, JSON.stringify(map))
  } catch {
    // Ignorar errores de cuota o modo privado de localStorage
  }
}

export function loadCourtCustomTierIntentions(
  courtId: string
): Record<string, CustomTierIntentionEntry> {
  try {
    const raw = localStorage.getItem(`${CUSTOM_TIER_STORAGE_PREFIX}${courtId}`)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CustomTierIntentionEntry>
  } catch {
    return {}
  }
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
  basePrice: number
  durationMinutes: number
  sportIds: string[]
  pricingTiers: CourtPricingTierPayload[]
  customSportPrices?: CourtSportConfigPayload[]
}

export interface UpdateCourtPayload {
  name: string
  surfaceType: string
  isCovered: boolean
  hasLighting: boolean
  basePrice: number
  durationMinutes: number
  sportIds: string[]
  pricingTiers: CourtPricingTierPayload[]
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
