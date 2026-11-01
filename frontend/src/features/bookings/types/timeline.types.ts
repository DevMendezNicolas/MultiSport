import type {
  DailyGridCourtItem,
  GridBookingItem,
  GridOperatingWindowItem,
  GridSportItem,
} from './index'

export const COMPLEX_UTC_OFFSET_HOURS = -3
const COMPLEX_OFFSET_MS = COMPLEX_UTC_OFFSET_HOURS * 60 * 60 * 1000

export const TIMELINE_CONFIG = {
  startHour: 8,
  endHour: 24, // 08:00 a 00:00 (16 horas operativas por defecto)
  slotsPerHour: 4, // 15 minutos por slot
  totalSlots: 64, // 16 * 4
  slotWidthPx: 36,
  dayColWidthPx: 180,
  minWidthPx: 2484, // 180 + (64 * 36)
  rowHeightPx: 112,
} as const

export interface DynamicTimelineBounds {
  startHour: number
  endHour: number
  totalSlots: number
  minWidthPx: number
}

export interface MinuteInterval {
  startMin: number
  endMin: number
}

export interface ClosedTimelineWindow {
  startMin: number
  endMin: number
  startSlot: number
  slotsCount: number
  leftPx: number
  widthPx: number
  label: string
}

export const QUARTER_HOUR_TIME_SLOTS: string[] = Array.from({ length: 24 * 4 }, (_, idx) => {
  const hours = Math.floor(idx / 4)
    .toString()
    .padStart(2, '0')
  const minutes = ((idx % 4) * 15).toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

export const QUARTER_HOUR_END_TIME_SLOTS: string[] = [...QUARTER_HOUR_TIME_SLOTS, '24:00']

export interface TimelineSlotCoord {
  dayIndex: number // 0 = Hoy, 1 a 6 = días posteriores
  dateStr: string // YYYY-MM-DD
  slotIndex: number // 0 a totalSlots - 1
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
  isBlocked?: boolean
  notes?: string | null
}

export interface WeeklyDayData {
  dateStr: string
  dayOfWeek: number
  dayName: string
  dayNumber: string
  monthShort: string
  isToday: boolean
  courtData: DailyGridCourtItem | null
  bookings: GridBookingItem[]
  totalIncome: number
  bookingsCount: number
}

export const parseTimeToMinutes = (timeStr: string): number => {
  const trimmed = timeStr.trim()
  if (trimmed === '24:00') return 1440
  const [h, m] = trimmed.split(':').map(Number)
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
}

export const parseEndTimeToMinutes = (timeStr: string): number => {
  const trimmed = timeStr.trim()
  if (trimmed === '24:00' || trimmed === '00:00') return 1440
  return parseTimeToMinutes(trimmed)
}

export const formatMinutesToHHmm = (minutes: number): string => {
  if (minutes >= 1440) return '24:00'
  const clamped = Math.max(0, minutes)
  const h = Math.floor(clamped / 60) % 24
  const m = clamped % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export const mergeContinuousIntervals = (intervals: MinuteInterval[]): MinuteInterval[] => {
  const valid = intervals
    .filter((i) => i.endMin > i.startMin)
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  if (valid.length === 0) return []

  const merged: MinuteInterval[] = [{ ...valid[0] }]
  for (let i = 1; i < valid.length; i++) {
    const current = merged[merged.length - 1]
    const next = valid[i]
    if (next.startMin <= current.endMin) {
      current.endMin = Math.max(current.endMin, next.endMin)
    } else {
      merged.push({ ...next })
    }
  }
  return merged
}

export const getCourtDayOperatingIntervals = (
  operatingWindows: GridOperatingWindowItem[] | undefined,
  dayOfWeek: number,
  sportId?: string
): MinuteInterval[] => {
  if (!operatingWindows || operatingWindows.length === 0) {
    return [{ startMin: TIMELINE_CONFIG.startHour * 60, endMin: TIMELINE_CONFIG.endHour * 60 }]
  }

  const dayRules = operatingWindows.filter(
    (w) => w.dayOfWeek === dayOfWeek && (!sportId || w.sportId === sportId)
  )

  if (dayRules.length === 0) {
    return []
  }

  return mergeContinuousIntervals(
    dayRules.map((r) => ({
      startMin: parseTimeToMinutes(r.startTime),
      endMin: parseEndTimeToMinutes(r.endTime),
    }))
  )
}

export const isIntervalCoveredByOperatingWindows = (
  startMin: number,
  endMin: number,
  intervals: MinuteInterval[]
): boolean => {
  if (endMin <= startMin) return false
  const merged = mergeContinuousIntervals(intervals)
  return merged.some((w) => w.startMin <= startMin && w.endMin >= endMin)
}

export const computeCourtDynamicHourBounds = (
  operatingWindows: GridOperatingWindowItem[] | undefined,
  bookings?: GridBookingItem[]
): DynamicTimelineBounds => {
  let minStartMin = TIMELINE_CONFIG.startHour * 60
  let maxEndMin = TIMELINE_CONFIG.endHour * 60

  if (operatingWindows && operatingWindows.length > 0) {
    minStartMin = Math.min(...operatingWindows.map((w) => parseTimeToMinutes(w.startTime)))
    maxEndMin = Math.max(...operatingWindows.map((w) => parseEndTimeToMinutes(w.endTime)))
  }

  if (bookings && bookings.length > 0) {
    bookings.forEach((b) => {
      const startParts = utcToLocalParts(b.startTimeUtc)
      const endParts = utcToLocalParts(b.endTimeUtc)
      const bStartMin = startParts.hours * 60 + startParts.minutes
      const bEndMin =
        endParts.dateStr !== startParts.dateStr
          ? 1440
          : endParts.hours === 0 && endParts.minutes === 0
          ? 1440
          : endParts.hours * 60 + endParts.minutes
      minStartMin = Math.min(minStartMin, bStartMin)
      maxEndMin = Math.max(maxEndMin, bEndMin)
    })
  }

  const startHour = Math.max(0, Math.min(23, Math.floor(minStartMin / 60)))
  const endHour = Math.max(startHour + 1, Math.min(24, Math.ceil(maxEndMin / 60)))
  const totalSlots = (endHour - startHour) * 4
  const minWidthPx = TIMELINE_CONFIG.dayColWidthPx + totalSlots * TIMELINE_CONFIG.slotWidthPx

  return { startHour, endHour, totalSlots, minWidthPx }
}

export const computeDayClosedWindows = (
  operatingWindows: GridOperatingWindowItem[] | undefined,
  dayOfWeek: number,
  startHour: number = TIMELINE_CONFIG.startHour,
  endHour: number = TIMELINE_CONFIG.endHour
): ClosedTimelineWindow[] => {
  if (!operatingWindows || operatingWindows.length === 0) return []

  const axisStartMin = startHour * 60
  const axisEndMin = endHour * 60
  if (axisEndMin <= axisStartMin) return []

  const openIntervals = getCourtDayOperatingIntervals(operatingWindows, dayOfWeek)
    .map((i) => ({
      startMin: Math.max(axisStartMin, i.startMin),
      endMin: Math.min(axisEndMin, i.endMin),
    }))
    .filter((i) => i.endMin > i.startMin)

  const closedRaw: Array<{ startMin: number; endMin: number; label: string }> = []

  if (openIntervals.length === 0) {
    closedRaw.push({
      startMin: axisStartMin,
      endMin: axisEndMin,
      label: 'Cerrado todo el día',
    })
  } else {
    let cursor = axisStartMin
    openIntervals.forEach((open, idx) => {
      if (open.startMin > cursor) {
        const label =
          cursor === axisStartMin
            ? `Abre ${formatMinutesToHHmm(open.startMin)} hs`
            : `Cerrado ${formatMinutesToHHmm(cursor)} - ${formatMinutesToHHmm(open.startMin)}`
        closedRaw.push({ startMin: cursor, endMin: open.startMin, label })
      }
      cursor = Math.max(cursor, open.endMin)
      if (idx === openIntervals.length - 1 && cursor < axisEndMin) {
        closedRaw.push({
          startMin: cursor,
          endMin: axisEndMin,
          label: `Cierra ${formatMinutesToHHmm(cursor)} hs`,
        })
      }
    })
  }

  return closedRaw.map((c) => {
    const startSlot = Math.max(0, Math.floor((c.startMin - axisStartMin) / 15))
    const endSlot = Math.ceil((c.endMin - axisStartMin) / 15)
    const slotsCount = Math.max(1, endSlot - startSlot)
    return {
      startMin: c.startMin,
      endMin: c.endMin,
      startSlot,
      slotsCount,
      leftPx: startSlot * TIMELINE_CONFIG.slotWidthPx,
      widthPx: slotsCount * TIMELINE_CONFIG.slotWidthPx,
      label: c.label,
    }
  })
}

/**
 * Convierte una hora HH:mm en el índice de slot
 */
export const timeToSlotIndex = (
  timeStr: string,
  startHour: number = TIMELINE_CONFIG.startHour,
  totalSlots: number = TIMELINE_CONFIG.totalSlots
): number => {
  const [hoursStr, minsStr] = timeStr.split(':')
  const hours = parseInt(hoursStr, 10)
  const mins = parseInt(minsStr, 10)

  if (isNaN(hours) || isNaN(mins)) return 0

  const totalMinutes = (hours - startHour) * 60 + mins
  const slotIndex = Math.floor(totalMinutes / 15)
  return Math.max(0, Math.min(totalSlots - 1, slotIndex))
}

/**
 * Convierte un índice de slot a formato HH:mm
 */
export const slotIndexToTime = (
  slotIndex: number,
  startHour: number = TIMELINE_CONFIG.startHour,
  totalSlots: number = TIMELINE_CONFIG.totalSlots
): string => {
  const clampedIndex = Math.max(0, Math.min(totalSlots - 1, slotIndex))
  const totalMinutes = clampedIndex * 15
  const hours = startHour + Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Formatea un objeto Date (calendario local) a formato YYYY-MM-DD
 */
export const formatLocalDate = (dateObj: Date): string => {
  const year = dateObj.getFullYear()
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const day = dateObj.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Descompone una fecha/hora UTC en partes locales del complejo (UTC-3: YYYY-MM-DD, HH:mm, horas, minutos)
 */
export const utcToLocalParts = (
  utcIsoString: string
): { dateStr: string; timeStr: string; hours: number; minutes: number } => {
  const utcMs = new Date(utcIsoString).getTime()
  const complexDate = new Date(utcMs + COMPLEX_OFFSET_MS)

  const hours = complexDate.getUTCHours()
  const minutes = complexDate.getUTCMinutes()
  const year = complexDate.getUTCFullYear()
  const month = (complexDate.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = complexDate.getUTCDate().toString().padStart(2, '0')

  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  const dateStr = `${year}-${month}-${day}`
  return { dateStr, timeStr, hours, minutes }
}

/**
 * Retorna la fecha local actual del complejo (UTC-3) en formato YYYY-MM-DD
 */
export const getTodayLocalDateStr = (): string => {
  return utcToLocalParts(new Date().toISOString()).dateStr
}

/**
 * Convierte fecha local del complejo (YYYY-MM-DD) y hora local (HH:mm) en string ISO UTC real.
 * Normaliza explícitamente "24:00" como "00:00" del día calendario siguiente antes de construir el ISO.
 */
export const localToUtcIso = (dateStr: string, timeStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const normalizedTime = timeStr.trim()

  let dayDelta = 0
  let hours = 0
  let minutes = 0

  if (normalizedTime === '24:00') {
    dayDelta = 1
    hours = 0
    minutes = 0
  } else {
    const [h, min] = normalizedTime.split(':').map(Number)
    hours = isNaN(h) ? 0 : h
    minutes = isNaN(min) ? 0 : min
  }

  const utcMs = Date.UTC(y, m - 1, d + dayDelta, hours - COMPLEX_UTC_OFFSET_HOURS, minutes, 0, 0)
  return new Date(utcMs).toISOString()
}

const formatMinutesAsTime = (totalMinutes: number): string => {
  if (totalMinutes >= 1440) return '00:00'
  const clamped = Math.max(0, totalMinutes)
  const h = Math.floor(clamped / 60) % 24
  const m = clamped % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Calcula posición left (px) y width (px) para un turno en la grilla de 15 minutos,
 * recortando visualmente al día local del complejo (rowDateStr) cuando cruza medianoche o abarca varios días.
 */
export const calculateSlotLayout = (
  startTimeUtc: string,
  endTimeUtc: string,
  rowDateStr?: string,
  startHour: number = TIMELINE_CONFIG.startHour,
  endHour: number = TIMELINE_CONFIG.endHour
): {
  leftPx: number
  widthPx: number
  durationMinutes: number
  timeRange: string
  clippedStart: boolean
  clippedEnd: boolean
} => {
  const startParts = utcToLocalParts(startTimeUtc)
  const targetDateStr = rowDateStr || startParts.dateStr

  const dayStartMs = new Date(localToUtcIso(targetDateStr, '00:00')).getTime()
  const dayEndMs = new Date(localToUtcIso(targetDateStr, '24:00')).getTime()

  const rawStartMs = new Date(startTimeUtc).getTime()
  const rawEndMs = new Date(endTimeUtc).getTime()

  const clippedStart = rawStartMs < dayStartMs
  const clippedEnd = rawEndMs > dayEndMs

  const clampedStartMs = Math.max(dayStartMs, Math.min(dayEndMs, rawStartMs))
  const clampedEndMs = Math.max(clampedStartMs, Math.min(dayEndMs, rawEndMs))

  const sliceStartMinutes = Math.round((clampedStartMs - dayStartMs) / 60000)
  const sliceEndMinutes = Math.round((clampedEndMs - dayStartMs) / 60000)

  const timelineStartMin = startHour * 60
  const timelineEndMin = endHour * 60

  const visibleStartMin = Math.max(timelineStartMin, Math.min(timelineEndMin, sliceStartMinutes))
  const visibleEndMin = Math.max(visibleStartMin, Math.min(timelineEndMin, sliceEndMinutes))

  const durationMinutes = Math.max(15, visibleEndMin - visibleStartMin)
  const slotIndex = (visibleStartMin - timelineStartMin) / 15
  const leftPx = Math.max(0, slotIndex * TIMELINE_CONFIG.slotWidthPx)
  const slotsCount = Math.ceil(durationMinutes / 15)
  const widthPx = slotsCount * TIMELINE_CONFIG.slotWidthPx

  const timeRange = `${formatMinutesAsTime(sliceStartMinutes)} - ${formatMinutesAsTime(sliceEndMinutes)}`

  return { leftPx, widthPx, durationMinutes, timeRange, clippedStart, clippedEnd }
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
 * Calcula el mapa de ocupación de slots, ventanas cerradas y franjas libres/insuficientes
 */
export const computeDayTimelineGaps = (
  bookings: GridBookingItem[],
  minDurationMinutes: number,
  rowDateStr?: string,
  startHour: number = TIMELINE_CONFIG.startHour,
  endHour: number = TIMELINE_CONFIG.endHour,
  operatingWindows?: GridOperatingWindowItem[],
  dayOfWeek?: number
): {
  occupiedSlots: boolean[]
  closedSlots: boolean[]
  closedWindows: ClosedTimelineWindow[]
  gaps: TimelineGap[]
  insufficientGaps: TimelineGap[]
} => {
  const totalSlots = Math.max(4, (endHour - startHour) * 4)
  const occupiedSlots = new Array<boolean>(totalSlots).fill(false)
  const closedSlots = new Array<boolean>(totalSlots).fill(false)

  const resolvedDayOfWeek =
    dayOfWeek !== undefined
      ? dayOfWeek
      : rowDateStr
      ? new Date(
          Number(rowDateStr.split('-')[0]),
          Number(rowDateStr.split('-')[1]) - 1,
          Number(rowDateStr.split('-')[2])
        ).getDay()
      : 0

  const closedWindows = computeDayClosedWindows(
    operatingWindows,
    resolvedDayOfWeek,
    startHour,
    endHour
  )

  closedWindows.forEach((cw) => {
    for (
      let s = cw.startSlot;
      s < Math.min(totalSlots, cw.startSlot + cw.slotsCount);
      s++
    ) {
      closedSlots[s] = true
      occupiedSlots[s] = true
    }
  })

  bookings.forEach((booking) => {
    const { leftPx, widthPx } = calculateSlotLayout(
      booking.startTimeUtc,
      booking.endTimeUtc,
      rowDateStr,
      startHour,
      endHour
    )
    const startSlot = Math.max(0, Math.floor(leftPx / TIMELINE_CONFIG.slotWidthPx))
    const slotsCount = Math.ceil(widthPx / TIMELINE_CONFIG.slotWidthPx)
    for (let s = startSlot; s < Math.min(totalSlots, startSlot + slotsCount); s++) {
      occupiedSlots[s] = true
    }
  })

  const gaps: TimelineGap[] = []
  let currentStart: number | null = null

  for (let s = 0; s < totalSlots; s++) {
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
    const count = totalSlots - currentStart
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
  return { occupiedSlots, closedSlots, closedWindows, gaps, insufficientGaps }
}
