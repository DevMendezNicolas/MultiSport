import type {
  DailyGridCourtItem,
  GridBookingItem,
  GridOperatingWindowItem,
  WeeklyDayData,
} from '@/features/bookings/types'
import {
  formatLocalDate,
  getTodayLocalDateStr,
  localToUtcIso,
} from '@/features/bookings/types/timeline.types'

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTH_NAMES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

const DEMO_OPERATING_WINDOWS_PADEL: GridOperatingWindowItem[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  sportId: 'sport-padel',
  dayOfWeek,
  startTime: '08:00',
  endTime: '24:00',
  price: 18000,
  durationMinutes: 90,
}))

const DEMO_OPERATING_WINDOWS_TENIS: GridOperatingWindowItem[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  sportId: 'sport-tenis',
  dayOfWeek,
  startTime: '08:00',
  endTime: '24:00',
  price: 15000,
  durationMinutes: 60,
}))

const DEMO_OPERATING_WINDOWS_FUTBOL: GridOperatingWindowItem[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  sportId: 'sport-futbol',
  dayOfWeek,
  startTime: '08:00',
  endTime: '24:00',
  price: 30000,
  durationMinutes: 60,
}))

export const DEMO_COURTS: DailyGridCourtItem[] = [
  {
    courtId: 'court-padel-1',
    courtName: 'Pádel 1 Cristal',
    surface: 'Césped Texturado · Cubierta',
    isIndoor: true,
    sports: [
      {
        sportId: 'sport-padel',
        name: 'Pádel',
        durationMinutes: 90,
        basePrice: 18000,
      },
    ],
    bookings: [],
    operatingWindows: DEMO_OPERATING_WINDOWS_PADEL,
  },
  {
    courtId: 'court-padel-2',
    courtName: 'Pádel 2 Panorámica',
    surface: 'Cristal 12mm · Descubierta',
    isIndoor: false,
    sports: [
      {
        sportId: 'sport-padel',
        name: 'Pádel',
        durationMinutes: 90,
        basePrice: 18000,
      },
    ],
    bookings: [],
    operatingWindows: DEMO_OPERATING_WINDOWS_PADEL,
  },
  {
    courtId: 'court-tenis-1',
    courtName: 'Tenis Central Polvo',
    surface: 'Polvo de Ladrillo · LED 800 lux',
    isIndoor: false,
    sports: [
      {
        sportId: 'sport-tenis',
        name: 'Tenis',
        durationMinutes: 60,
        basePrice: 15000,
      },
    ],
    bookings: [],
    operatingWindows: DEMO_OPERATING_WINDOWS_TENIS,
  },
  {
    courtId: 'court-futbol-1',
    courtName: 'Fútbol 5 Sintético',
    surface: 'Monofilamento 55mm · Rejas',
    isIndoor: false,
    sports: [
      {
        sportId: 'sport-futbol',
        name: 'Fútbol 5',
        durationMinutes: 60,
        basePrice: 30000,
      },
    ],
    bookings: [],
    operatingWindows: DEMO_OPERATING_WINDOWS_FUTBOL,
  },
]

interface BookingSeed {
  dayOffset: number // 0 = start date, 1 = +1 day, etc.
  startTime: string
  endTime: string
  customerName: string
  totalPrice: number
  depositAmount: number
  status: 'confirmed' | 'pending' | 'blocked'
  notes?: string
}

const SEEDS_PADEL_1: BookingSeed[] = [
  // Día 0 (Hoy en la semana base)
  { dayOffset: 0, startTime: '09:30', endTime: '11:00', customerName: 'G. Valdez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 0, startTime: '11:00', endTime: '12:30', customerName: 'L. Gómez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 0, startTime: '15:30', endTime: '17:00', customerName: 'M. Soria', totalPrice: 18000, depositAmount: 9000, status: 'pending', notes: 'Seña 50% pendiente de verificación' },
  { dayOffset: 0, startTime: '17:00', endTime: '18:30', customerName: 'Academia Jr', totalPrice: 22000, depositAmount: 22000, status: 'confirmed' },
  { dayOffset: 0, startTime: '18:30', endTime: '20:00', customerName: 'Clase Torneo', totalPrice: 24000, depositAmount: 24000, status: 'confirmed' },
  { dayOffset: 0, startTime: '20:00', endTime: '21:30', customerName: 'P. Rossi', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 0, startTime: '21:30', endTime: '23:00', customerName: 'R. Álvarez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },

  // Día 1
  { dayOffset: 1, startTime: '08:00', endTime: '09:30', customerName: 'Academia Menores', totalPrice: 22000, depositAmount: 22000, status: 'confirmed' },
  { dayOffset: 1, startTime: '14:00', endTime: '15:30', customerName: 'D. Ruiz', totalPrice: 18000, depositAmount: 9000, status: 'pending' },
  { dayOffset: 1, startTime: '17:00', endTime: '18:30', customerName: 'J. Morales', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 1, startTime: '18:30', endTime: '20:00', customerName: 'Torneo Interno', totalPrice: 24000, depositAmount: 24000, status: 'confirmed' },
  { dayOffset: 1, startTime: '20:00', endTime: '21:30', customerName: 'H. Castro', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },

  // Día 2
  { dayOffset: 2, startTime: '10:00', endTime: '11:30', customerName: 'C. Bianchi', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 2, startTime: '16:00', endTime: '17:30', customerName: 'M. Benítez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 2, startTime: '18:00', endTime: '19:30', customerName: 'T. Ramos', totalPrice: 18000, depositAmount: 9000, status: 'pending' },
  { dayOffset: 2, startTime: '20:00', endTime: '21:30', customerName: 'E. Silva', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },

  // Día 3
  { dayOffset: 3, startTime: '08:30', endTime: '10:00', customerName: 'Clase Principiantes', totalPrice: 20000, depositAmount: 20000, status: 'confirmed' },
  { dayOffset: 3, startTime: '12:00', endTime: '13:30', customerName: 'Mantenimiento Vidrio', totalPrice: 0, depositAmount: 0, status: 'blocked', notes: 'Ajuste de perfilería y tensores' },
  { dayOffset: 3, startTime: '18:30', endTime: '20:00', customerName: 'L. Ferrero', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 3, startTime: '21:30', endTime: '23:00', customerName: 'Desafío Dobles', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },

  // Día 4
  { dayOffset: 4, startTime: '14:00', endTime: '15:30', customerName: 'M. Soria', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 4, startTime: '17:30', endTime: '19:00', customerName: 'Academia Pro', totalPrice: 24000, depositAmount: 24000, status: 'confirmed' },
  { dayOffset: 4, startTime: '19:30', endTime: '21:00', customerName: 'P. Rossi', totalPrice: 18000, depositAmount: 9000, status: 'pending' },
  { dayOffset: 4, startTime: '21:00', endTime: '22:30', customerName: 'Torneo Nocturno', totalPrice: 24000, depositAmount: 24000, status: 'confirmed' },

  // Día 5
  { dayOffset: 5, startTime: '09:00', endTime: '10:30', customerName: 'Copa Sábado', totalPrice: 24000, depositAmount: 24000, status: 'confirmed' },
  { dayOffset: 5, startTime: '10:30', endTime: '12:00', customerName: 'Copa Sábado', totalPrice: 24000, depositAmount: 24000, status: 'confirmed' },
  { dayOffset: 5, startTime: '16:00', endTime: '17:30', customerName: 'J. Morales', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 5, startTime: '18:00', endTime: '19:30', customerName: 'G. Valdez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 5, startTime: '19:30', endTime: '21:00', customerName: 'R. Álvarez', totalPrice: 18000, depositAmount: 9000, status: 'pending' },

  // Día 6
  { dayOffset: 6, startTime: '10:00', endTime: '11:30', customerName: 'Amistoso Domingo', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 6, startTime: '16:30', endTime: '18:00', customerName: 'L. Gómez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 6, startTime: '18:00', endTime: '19:30', customerName: 'T. Ramos', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
]

const SEEDS_PADEL_2: BookingSeed[] = [
  { dayOffset: 0, startTime: '09:30', endTime: '11:00', customerName: 'C. Bianchi', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 0, startTime: '11:00', endTime: '12:30', customerName: 'D. Ruiz', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 0, startTime: '15:30', endTime: '17:00', customerName: 'T. Ramos', totalPrice: 18000, depositAmount: 9000, status: 'pending' },
  { dayOffset: 0, startTime: '17:00', endTime: '18:30', customerName: 'S. Miller', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 0, startTime: '18:30', endTime: '20:00', customerName: 'M. Benítez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 0, startTime: '20:00', endTime: '21:30', customerName: 'H. Castro', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 0, startTime: '21:30', endTime: '23:00', customerName: 'E. Silva', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },

  { dayOffset: 1, startTime: '10:00', endTime: '11:30', customerName: 'L. Ferrero', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 1, startTime: '18:00', endTime: '19:30', customerName: 'G. Valdez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 1, startTime: '19:30', endTime: '21:00', customerName: 'P. Rossi', totalPrice: 18000, depositAmount: 9000, status: 'pending' },

  { dayOffset: 2, startTime: '16:00', endTime: '17:30', customerName: 'Clase Menores', totalPrice: 20000, depositAmount: 20000, status: 'confirmed' },
  { dayOffset: 2, startTime: '19:00', endTime: '20:30', customerName: 'R. Álvarez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },

  { dayOffset: 3, startTime: '17:00', endTime: '18:30', customerName: 'M. Soria', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 3, startTime: '18:30', endTime: '20:00', customerName: 'D. Ruiz', totalPrice: 18000, depositAmount: 9000, status: 'pending' },

  { dayOffset: 4, startTime: '15:30', endTime: '17:00', customerName: 'S. Miller', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 4, startTime: '20:00', endTime: '21:30', customerName: 'H. Castro', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },

  { dayOffset: 5, startTime: '10:00', endTime: '11:30', customerName: 'Torneo Panorámico', totalPrice: 24000, depositAmount: 24000, status: 'confirmed' },
  { dayOffset: 5, startTime: '17:00', endTime: '18:30', customerName: 'C. Bianchi', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },

  { dayOffset: 6, startTime: '11:00', endTime: '12:30', customerName: 'L. Ferrero', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
  { dayOffset: 6, startTime: '17:30', endTime: '19:00', customerName: 'M. Benítez', totalPrice: 18000, depositAmount: 18000, status: 'confirmed' },
]

const SEEDS_TENIS: BookingSeed[] = [
  { dayOffset: 0, startTime: '08:00', endTime: '09:00', customerName: 'C. Nalbandian', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },
  { dayOffset: 0, startTime: '09:00', endTime: '10:00', customerName: 'A. Agassi Jr', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },
  { dayOffset: 0, startTime: '15:00', endTime: '16:00', customerName: 'Escuela Tenis', totalPrice: 20000, depositAmount: 20000, status: 'confirmed' },
  { dayOffset: 0, startTime: '16:00', endTime: '17:00', customerName: 'Escuela Tenis', totalPrice: 20000, depositAmount: 20000, status: 'confirmed' },
  { dayOffset: 0, startTime: '17:00', endTime: '18:00', customerName: 'F. Gaudio', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },
  { dayOffset: 0, startTime: '18:00', endTime: '19:00', customerName: 'K. Novak', totalPrice: 15000, depositAmount: 7500, status: 'pending' },
  { dayOffset: 0, startTime: '19:00', endTime: '20:00', customerName: 'O. Prieto', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },

  { dayOffset: 1, startTime: '09:00', endTime: '10:00', customerName: 'Clase Particular', totalPrice: 20000, depositAmount: 20000, status: 'confirmed' },
  { dayOffset: 1, startTime: '16:00', endTime: '17:00', customerName: 'R. Federer Fan', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },
  { dayOffset: 1, startTime: '18:00', endTime: '19:00', customerName: 'F. Gaudio', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },

  { dayOffset: 2, startTime: '10:00', endTime: '11:00', customerName: 'A. Agassi Jr', totalPrice: 15000, depositAmount: 7500, status: 'pending' },
  { dayOffset: 2, startTime: '17:00', endTime: '18:00', customerName: 'Mantenimiento Riego', totalPrice: 0, depositAmount: 0, status: 'blocked', notes: 'Riego y cepillado de polvo' },
  { dayOffset: 2, startTime: '19:00', endTime: '20:00', customerName: 'K. Novak', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },

  { dayOffset: 3, startTime: '08:00', endTime: '09:00', customerName: 'C. Nalbandian', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },
  { dayOffset: 3, startTime: '18:00', endTime: '19:00', customerName: 'O. Prieto', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },

  { dayOffset: 4, startTime: '15:00', endTime: '16:00', customerName: 'Escuela Menores', totalPrice: 20000, depositAmount: 20000, status: 'confirmed' },
  { dayOffset: 4, startTime: '19:00', endTime: '20:00', customerName: 'Doble Veteranos', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },

  { dayOffset: 5, startTime: '09:00', endTime: '11:00', customerName: 'Torneo Singles Club', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 5, startTime: '16:00', endTime: '17:00', customerName: 'F. Gaudio', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },

  { dayOffset: 6, startTime: '10:00', endTime: '11:00', customerName: 'C. Nalbandian', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },
  { dayOffset: 6, startTime: '17:00', endTime: '18:00', customerName: 'A. Agassi Jr', totalPrice: 15000, depositAmount: 15000, status: 'confirmed' },
]

const SEEDS_FUTBOL: BookingSeed[] = [
  { dayOffset: 0, startTime: '14:00', endTime: '15:00', customerName: 'Torneo Senior', totalPrice: 28000, depositAmount: 28000, status: 'confirmed' },
  { dayOffset: 0, startTime: '15:00', endTime: '16:00', customerName: 'Torneo Senior', totalPrice: 28000, depositAmount: 28000, status: 'confirmed' },
  { dayOffset: 0, startTime: '16:00', endTime: '17:00', customerName: 'Torneo Senior', totalPrice: 28000, depositAmount: 28000, status: 'confirmed' },
  { dayOffset: 0, startTime: '17:00', endTime: '18:00', customerName: 'Los Amigos FC', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 0, startTime: '18:00', endTime: '19:00', customerName: 'Interbarrial', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 0, startTime: '19:00', endTime: '20:00', customerName: 'Sporting Club', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 0, startTime: '20:00', endTime: '21:00', customerName: 'Tercer Tiempo FC', totalPrice: 30000, depositAmount: 15000, status: 'pending' },

  { dayOffset: 1, startTime: '18:00', endTime: '19:00', customerName: 'Los Galácticos', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 1, startTime: '19:00', endTime: '20:00', customerName: 'Fútbol Mixto', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 1, startTime: '21:00', endTime: '22:00', customerName: 'La Redonda', totalPrice: 30000, depositAmount: 15000, status: 'pending' },

  { dayOffset: 2, startTime: '17:00', endTime: '18:00', customerName: 'Escuelita Fútbol', totalPrice: 25000, depositAmount: 25000, status: 'confirmed' },
  { dayOffset: 2, startTime: '20:00', endTime: '21:00', customerName: 'Interbarrial B', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },

  { dayOffset: 3, startTime: '18:00', endTime: '19:00', customerName: 'Sporting Club', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 3, startTime: '19:00', endTime: '20:00', customerName: 'Tercer Tiempo FC', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },

  { dayOffset: 4, startTime: '19:00', endTime: '20:00', customerName: 'Viernes de Fútbol', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 4, startTime: '20:00', endTime: '21:00', customerName: 'Torneo Relámpago', totalPrice: 32000, depositAmount: 32000, status: 'confirmed' },
  { dayOffset: 4, startTime: '21:00', endTime: '22:00', customerName: 'Torneo Relámpago', totalPrice: 32000, depositAmount: 32000, status: 'confirmed' },

  { dayOffset: 5, startTime: '16:00', endTime: '17:00', customerName: 'Los Amigos FC', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 5, startTime: '17:00', endTime: '18:00', customerName: 'Desafío Barrial', totalPrice: 30000, depositAmount: 15000, status: 'pending' },

  { dayOffset: 6, startTime: '18:00', endTime: '19:00', customerName: 'Fútbol Domingo', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
  { dayOffset: 6, startTime: '19:00', endTime: '20:00', customerName: 'Cierre de Semana', totalPrice: 30000, depositAmount: 30000, status: 'confirmed' },
]

export function computeDateForOffset(baseDateStr: string, offset: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + offset)
  return formatLocalDate(dt)
}

export function generateSeedBookingsForCourt(
  courtId: string,
  baseDateStr: string
): GridBookingItem[] {
  let seeds: BookingSeed[] = []
  let sportId = 'sport-padel'
  let sportName = 'Pádel'

  switch (courtId) {
    case 'court-padel-1':
      seeds = SEEDS_PADEL_1
      sportId = 'sport-padel'
      sportName = 'Pádel'
      break
    case 'court-padel-2':
      seeds = SEEDS_PADEL_2
      sportId = 'sport-padel'
      sportName = 'Pádel'
      break
    case 'court-tenis-1':
      seeds = SEEDS_TENIS
      sportId = 'sport-tenis'
      sportName = 'Tenis'
      break
    case 'court-futbol-1':
      seeds = SEEDS_FUTBOL
      sportId = 'sport-futbol'
      sportName = 'Fútbol 5'
      break
    default:
      seeds = SEEDS_PADEL_1
  }

  return seeds.map((s, idx) => {
    const dayDateStr = computeDateForOffset(baseDateStr, s.dayOffset)
    const startTimeUtc = localToUtcIso(dayDateStr, s.startTime)
    const endTimeUtc = localToUtcIso(dayDateStr, s.endTime)

    return {
      id: `demo-${courtId}-${idx}-${s.dayOffset}`,
      courtId,
      sportId,
      sportName,
      customerName: s.customerName,
      customerPhone: '+54 9 11 4567-8901',
      startTimeUtc,
      endTimeUtc,
      totalPrice: s.totalPrice,
      depositAmount: s.depositAmount,
      status: s.status,
      isRecurring: false,
      notes: s.notes,
    }
  })
}

export function generateAllDemoBookings(baseDateStr: string): Record<string, GridBookingItem[]> {
  const result: Record<string, GridBookingItem[]> = {}
  for (const court of DEMO_COURTS) {
    result[court.courtId] = generateSeedBookingsForCourt(court.courtId, baseDateStr)
  }
  return result
}

export function buildWeeklyDaysData(
  startDateStr: string,
  court: DailyGridCourtItem,
  courtBookings: GridBookingItem[]
): WeeklyDayData[] {
  const todayStr = getTodayLocalDateStr()

  return Array.from({ length: 7 }, (_, i) => {
    const dateStr = computeDateForOffset(startDateStr, i)
    const [y, m, d] = dateStr.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)

    const dayName = DAY_NAMES_ES[dateObj.getDay()]
    const dayNumber = dateObj.getDate().toString()
    const monthShort = MONTH_NAMES_ES[dateObj.getMonth()]
    const isToday = dateStr === todayStr

    // Filtrar turnos correspondientes a este día calendario
    const dayStartMs = new Date(localToUtcIso(dateStr, '00:00')).getTime()
    const dayEndMs = new Date(localToUtcIso(dateStr, '24:00')).getTime()

    const dayBookings = courtBookings.filter((b) => {
      const bStartMs = new Date(b.startTimeUtc).getTime()
      const bEndMs = new Date(b.endTimeUtc).getTime()
      return bEndMs > dayStartMs && bStartMs < dayEndMs
    })

    const totalIncome = dayBookings.reduce((sum, b) => {
      if (b.status === 'blocked') return sum
      return sum + (b.totalPrice || 0)
    }, 0)

    return {
      dateStr,
      dayOfWeek: dateObj.getDay(),
      dayName,
      dayNumber,
      monthShort,
      isToday,
      courtData: court,
      bookings: dayBookings,
      totalIncome,
      bookingsCount: dayBookings.filter((b) => b.status !== 'blocked').length,
    }
  })
}
