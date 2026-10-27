import type { DailyGridCourtItem, GridBookingItem, GridSportItem } from './index'

export const TIMELINE_CONFIG = {
  startHour: 8,
  endHour: 24, // 08:00 a 00:00 (16 horas operativas)
  slotsPerHour: 4, // 15 minutos por slot
  totalSlots: 64, // 16 * 4
  slotWidthPx: 36,
  dayColWidthPx: 180,
  minWidthPx: 2484, // 180 + (64 * 36)
  rowHeightPx: 112,
} as const

export interface TimelineSlotCoord {
  dayIndex: number // 0 = Hoy, 1 a 6 = días posteriores
  dateStr: string // YYYY-MM-DD
  slotIndex: number // 0 a 63
  timeFormatted: string // "08:15"
}

export interface DraggedBookingData {
  bookingId: string
  courtId: string
  customerName: string
  customerPhone?: string
  originalDateStr: string
  originalStartTime: string
  durationMinutes: number
  slotsCount: number
}

export interface WeeklyDayData {
  dateStr: string
  dayName: string
  dayNumber: string
  monthShort: string
  isToday: boolean
  courtData: DailyGridCourtItem | null
  bookings: GridBookingItem[]
  totalIncome: number
  bookingsCount: number
}

/**
 * Convierte una hora HH:mm en el índice de slot (0 a 63)
 */
export const timeToSlotIndex = (timeStr: string): number => {
  const [hoursStr, minsStr] = timeStr.split(':')
  const hours = parseInt(hoursStr, 10)
  const mins = parseInt(minsStr, 10)

  if (isNaN(hours) || isNaN(mins)) return 0

  const totalMinutes = (hours - TIMELINE_CONFIG.startHour) * 60 + mins
  const slotIndex = Math.floor(totalMinutes / 15)
  return Math.max(0, Math.min(TIMELINE_CONFIG.totalSlots - 1, slotIndex))
}

/**
 * Convierte un índice de slot (0 a 63) a formato HH:mm
 */
export const slotIndexToTime = (slotIndex: number): string => {
  const clampedIndex = Math.max(0, Math.min(TIMELINE_CONFIG.totalSlots - 1, slotIndex))
  const totalMinutes = clampedIndex * 15
  const hours = TIMELINE_CONFIG.startHour + Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Formatea un objeto Date a formato local YYYY-MM-DD
 */
export const formatLocalDate = (dateObj: Date): string => {
  const year = dateObj.getFullYear()
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const day = dateObj.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna la fecha local actual en formato YYYY-MM-DD
 */
export const getTodayLocalDateStr = (): string => {
  return formatLocalDate(new Date())
}

/**
 * Convierte fecha local (YYYY-MM-DD) y hora local (HH:mm) en string ISO UTC real
 */
export const localToUtcIso = (dateStr: string, timeStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)
  const localDate = new Date(y, m - 1, d, h, min, 0)
  return localDate.toISOString()
}

/**
 * Descompone una fecha/hora UTC en partes locales (YYYY-MM-DD, HH:mm, horas, minutos)
 */
export const utcToLocalParts = (
  utcIsoString: string
): { dateStr: string; timeStr: string; hours: number; minutes: number } => {
  const dateObj = new Date(utcIsoString)
  const hours = dateObj.getHours()
  const minutes = dateObj.getMinutes()
  const year = dateObj.getFullYear()
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const day = dateObj.getDate().toString().padStart(2, '0')

  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  const dateStr = `${year}-${month}-${day}`
  return { dateStr, timeStr, hours, minutes }
}

/**
 * Calcula posición left (px) y width (px) para un turno en la grilla de 15 minutos
 */
export const calculateSlotLayout = (
  startTimeUtc: string,
  endTimeUtc: string
): { leftPx: number; widthPx: number; durationMinutes: number; timeRange: string } => {
  const start = utcToLocalParts(startTimeUtc)
  const end = utcToLocalParts(endTimeUtc)

  const startDate = new Date(startTimeUtc)
  const endDate = new Date(endTimeUtc)

  const startTotalMinutes = (start.hours - TIMELINE_CONFIG.startHour) * 60 + start.minutes
  const durationMinutes = Math.max(
    15,
    (endDate.getTime() - startDate.getTime()) / (1000 * 60)
  )

  const slotIndex = startTotalMinutes / 15
  const leftPx = Math.max(0, slotIndex * TIMELINE_CONFIG.slotWidthPx)
  const slotsCount = Math.ceil(durationMinutes / 15)
  const widthPx = slotsCount * TIMELINE_CONFIG.slotWidthPx

  const timeRange = `${start.timeStr} - ${end.timeStr}`

  return { leftPx, widthPx, durationMinutes, timeRange }
}

/**
 * Obtiene la duración mínima entre todos los deportes de la cancha
 */
export const getMinSportDuration = (sports?: GridSportItem[]): number => {
  if (!sports || sports.length === 0) return 60
  const durations = sports.map((s) => s.durationMinutes).filter((d) => d > 0)
  return durations.length > 0 ? Math.min(...durations) : 60
}

export interface TimelineGap {
  startSlot: number
  slotsCount: number
  leftPx: number
  widthPx: number
  availableMinutes: number
  isInsufficient: boolean
}

/**
 * Calcula el mapa de ocupación de slots y detecta franjas libres e insuficientes
 */
export const computeDayTimelineGaps = (
  bookings: GridBookingItem[],
  minDurationMinutes: number
): {
  occupiedSlots: boolean[]
  gaps: TimelineGap[]
  insufficientGaps: TimelineGap[]
} => {
  const occupiedSlots = new Array<boolean>(TIMELINE_CONFIG.totalSlots).fill(false)

  bookings.forEach((booking) => {
    const { leftPx, widthPx } = calculateSlotLayout(booking.startTimeUtc, booking.endTimeUtc)
    const startSlot = Math.max(0, Math.floor(leftPx / TIMELINE_CONFIG.slotWidthPx))
    const slotsCount = Math.ceil(widthPx / TIMELINE_CONFIG.slotWidthPx)
    for (let s = startSlot; s < Math.min(TIMELINE_CONFIG.totalSlots, startSlot + slotsCount); s++) {
      occupiedSlots[s] = true
    }
  })

  const gaps: TimelineGap[] = []
  let currentStart: number | null = null

  for (let s = 0; s < TIMELINE_CONFIG.totalSlots; s++) {
    if (!occupiedSlots[s]) {
      if (currentStart === null) currentStart = s
    } else {
      if (currentStart !== null) {
        const count = s - currentStart
        const availableMinutes = count * 15
        const isInsufficient = availableMinutes < minDurationMinutes
        gaps.push({
          startSlot: currentStart,
          slotsCount: count,
          leftPx: currentStart * TIMELINE_CONFIG.slotWidthPx,
          widthPx: count * TIMELINE_CONFIG.slotWidthPx,
          availableMinutes,
          isInsufficient,
        })
        currentStart = null
      }
    }
  }

  if (currentStart !== null) {
    const count = TIMELINE_CONFIG.totalSlots - currentStart
    const availableMinutes = count * 15
    const isInsufficient = availableMinutes < minDurationMinutes
    gaps.push({
      startSlot: currentStart,
      slotsCount: count,
      leftPx: currentStart * TIMELINE_CONFIG.slotWidthPx,
      widthPx: count * TIMELINE_CONFIG.slotWidthPx,
      availableMinutes,
      isInsufficient,
    })
  }

  const insufficientGaps = gaps.filter((g) => g.isInsufficient)
  return { occupiedSlots, gaps, insufficientGaps }
}

