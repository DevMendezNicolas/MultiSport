import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  ShieldAlert,
  Repeat,
  Search,
  Check,
  CreditCard,
  Banknote,
  Building,
} from 'lucide-react'
import {
  Sheet,
  SheetHeader,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet'
import { NumericInput } from '@/components/ui/numeric-input'
import {
  useCreateBooking,
  useCreateBlock,
  useCustomerSearch,
  usePriceQuote,
} from '../hooks/useBookings'
import type { DailyGridCourtItem, CustomerLookupDto, GridSportItem } from '../types'
import {
  getCourtDayOperatingIntervals,
  isIntervalCoveredByOperatingWindows,
  localToUtcIso,
  parseEndTimeToMinutes,
  parseTimeToMinutes,
  QUARTER_HOUR_TIME_SLOTS,
  QUARTER_HOUR_END_TIME_SLOTS,
} from '../types/timeline.types'

interface NewBookingSheetProps {
  isOpen: boolean
  onClose: () => void
  courts: DailyGridCourtItem[]
  defaultCourtId?: string
  defaultDate: string
  defaultTimeSlot?: string
  maxAvailableMinutes?: number
}

const computeDefaultBlockEnd = (dateStr: string, startTime: string): { endDate: string; endTime: string } => {
  const [h, m] = startTime.split(':').map(Number)
  const totalMin = (isNaN(h) ? 18 : h) * 60 + (isNaN(m) ? 0 : m) + 60
  if (totalMin >= 1440) {
    return { endDate: dateStr, endTime: '24:00' }
  }
  const endH = Math.floor(totalMin / 60)
    .toString()
    .padStart(2, '0')
  const endM = (totalMin % 60).toString().padStart(2, '0')
  return { endDate: dateStr, endTime: `${endH}:${endM}` }
}

export const NewBookingSheet: React.FC<NewBookingSheetProps> = ({
  isOpen,
  onClose,
  courts,
  defaultCourtId,
  defaultDate,
  defaultTimeSlot = '18:00',
  maxAvailableMinutes,
}) => {
  const [mode, setMode] = useState<'booking' | 'block'>('booking')
  const [courtId, setCourtId] = useState<string>(defaultCourtId || '')
  const [sportId, setSportId] = useState<string>('')
  const [startTime, setStartTime] = useState<string>(defaultTimeSlot)
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(60)

  // Datos del cliente
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  // Precios y señas
  const [quotedPrice, setQuotedPrice] = useState<number>(0)
  const [overridePrice, setOverridePrice] = useState<boolean>(false)
  const [customPrice, setCustomPrice] = useState<number>(0)
  const [depositType, setDepositType] = useState<'100' | '50' | '0' | 'custom'>('100')
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'mercadopago'>('cash')

  // Bloqueo operativo (fechas y horarios independientes de disciplinas)
  const [blockStartDate, setBlockStartDate] = useState<string>(defaultDate)
  const [blockStartTime, setBlockStartTime] = useState<string>(defaultTimeSlot)
  const [blockEndDate, setBlockEndDate] = useState<string>(defaultDate)
  const [blockEndTime, setBlockEndTime] = useState<string>('19:00')
  const [blockReason, setBlockReason] = useState('Mantenimiento')

  // Queries y Mutaciones
  const { data: customerSearchResults } = useCustomerSearch(customerSearchQuery)
  const createBookingMutation = useCreateBooking()
  const createBlockMutation = useCreateBlock()
  const priceQuoteMutation = usePriceQuote()

  // Helper para recalcular el monto de seña según el tipo activo y el nuevo precio
  const calculateDepositForPrice = (
    price: number,
    type: '100' | '50' | '0' | 'custom',
    currentDeposit: number
  ): number => {
    if (type === '100') return price
    if (type === '50') return Math.round(price * 0.5)
    if (type === '0') return 0
    return Math.min(price, currentDeposit)
  }

  // Sincronizar estado inicial al abrir
  useEffect(() => {
    if (isOpen) {
      const initialCourt = courts.find((c) => c.courtId === defaultCourtId) || courts[0]
      if (initialCourt) {
        setCourtId(initialCourt.courtId)
        const fittingSports = maxAvailableMinutes
          ? initialCourt.sports.filter((s) => s.durationMinutes <= maxAvailableMinutes)
          : initialCourt.sports
        const initialSport = fittingSports[0] || initialCourt.sports[0]
        if (initialSport) {
          setSportId(initialSport.sportId)
          setCustomDurationMinutes(initialSport.durationMinutes)
          setQuotedPrice(initialSport.basePrice)
          setCustomPrice(initialSport.basePrice)
          setDepositAmount(initialSport.basePrice)
        }
      }
      setDepositType('100')
      setStartTime(defaultTimeSlot)
      setBlockStartDate(defaultDate)
      setBlockStartTime(defaultTimeSlot)
      const defaultBlockEnd = computeDefaultBlockEnd(defaultDate, defaultTimeSlot)
      setBlockEndDate(defaultBlockEnd.endDate)
      setBlockEndTime(defaultBlockEnd.endTime)
      setCustomerSearchQuery('')
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setNotes('')
      setIsRecurring(false)
      setOverridePrice(false)
      setMode('booking')
      setBlockReason('Mantenimiento')
    }
  }, [isOpen, defaultCourtId, defaultTimeSlot, defaultDate, maxAvailableMinutes, courts])

  const selectedCourt = useMemo(
    () => courts.find((c) => c.courtId === courtId),
    [courts, courtId]
  )

  const selectedDayOfWeek = useMemo(() => {
    const [y, m, d] = defaultDate.split('-').map(Number)
    return new Date(y, m - 1, d).getDay()
  }, [defaultDate])

  // Filtrar disciplinas según el tiempo libre disponible si existe
  const availableSports = useMemo(() => {
    if (!selectedCourt) return []
    if (!maxAvailableMinutes) return selectedCourt.sports
    return selectedCourt.sports.filter((s) => s.durationMinutes <= maxAvailableMinutes)
  }, [selectedCourt, maxAvailableMinutes])

  // Resolver duración aplicable según la franja horaria de inicio de la disciplina seleccionada
  const getDurationForSportAndStartTime = (
    targetCourt: DailyGridCourtItem | undefined,
    targetSportId: string,
    dayOfWeek: number,
    slotTime: string,
    fallbackDuration: number
  ): number => {
    if (!targetCourt?.operatingWindows || targetCourt.operatingWindows.length === 0) {
      return fallbackDuration
    }
    const startMin = parseTimeToMinutes(slotTime)
    const matchingRule = targetCourt.operatingWindows.find(
      (w) =>
        w.dayOfWeek === dayOfWeek &&
        w.sportId === targetSportId &&
        parseTimeToMinutes(w.startTime) <= startMin &&
        parseEndTimeToMinutes(w.endTime) > startMin
    )
    return matchingRule?.durationMinutes || fallbackDuration
  }

  // Contexto Reserva Comercial: horarios de inicio válidos según ventanas operativas del deporte y disponibilidad
  const availableBookingStartTimes = useMemo(() => {
    if (!selectedCourt) return QUARTER_HOUR_TIME_SLOTS

    const activeSport = selectedCourt.sports.find((s) => s.sportId === sportId)
    const baseSportDuration = activeSport?.durationMinutes || customDurationMinutes || 60

    const hasOperatingRules =
      selectedCourt.operatingWindows && selectedCourt.operatingWindows.length > 0
    const sportDayIntervals = getCourtDayOperatingIntervals(
      selectedCourt.operatingWindows,
      selectedDayOfWeek,
      sportId || undefined
    )
    const nextDayIntervals = getCourtDayOperatingIntervals(
      selectedCourt.operatingWindows,
      (selectedDayOfWeek + 1) % 7,
      sportId || undefined
    )

    const activeDayBookings = (selectedCourt.bookings || []).filter(
      (b) => b.status !== 'cancelled' && b.status !== 'expired'
    )

    return QUARTER_HOUR_TIME_SLOTS.filter((t) => {
      const slotDuration = getDurationForSportAndStartTime(
        selectedCourt,
        sportId,
        selectedDayOfWeek,
        t,
        baseSportDuration
      )
      const startMin = parseTimeToMinutes(t)
      const endMin = startMin + slotDuration

      if (hasOperatingRules) {
        if (endMin <= 1440) {
          if (!isIntervalCoveredByOperatingWindows(startMin, endMin, sportDayIntervals)) {
            return false
          }
        } else {
          // Cruce de medianoche: exige continuidad en 24:00 del día actual y desde 00:00 del día siguiente
          const coveredDay1 = isIntervalCoveredByOperatingWindows(startMin, 1440, sportDayIntervals)
          const coveredDay2 = isIntervalCoveredByOperatingWindows(
            0,
            endMin - 1440,
            nextDayIntervals
          )
          if (!coveredDay1 || !coveredDay2) {
            return false
          }
        }
      }

      const candidateStartMs = new Date(localToUtcIso(defaultDate, t)).getTime()
      const candidateEndMs = candidateStartMs + slotDuration * 60 * 1000

      const hasConflict = activeDayBookings.some((b) => {
        const bStart = new Date(b.startTimeUtc).getTime()
        const bEnd = new Date(b.endTimeUtc).getTime()
        return bStart < candidateEndMs && bEnd > candidateStartMs
      })

      return !hasConflict
    })
  }, [selectedCourt, sportId, selectedDayOfWeek, defaultDate, customDurationMinutes])

  // Sincronizar startTime si el horario por defecto está fuera de las opciones disponibles
  useEffect(() => {
    if (!isOpen || mode !== 'booking') return
    if (
      availableBookingStartTimes.length > 0 &&
      !availableBookingStartTimes.includes(startTime)
    ) {
      setStartTime(availableBookingStartTimes[0])
    }
  }, [isOpen, mode, availableBookingStartTimes, startTime])

  // Sincronizar duración cuando cambia startTime o sportId según la franja tarifaria de inicio
  useEffect(() => {
    if (!selectedCourt || !sportId || !startTime) return
    const activeSport = selectedCourt.sports.find((s) => s.sportId === sportId)
    const fallbackDuration = activeSport?.durationMinutes || 60
    const nextDuration = getDurationForSportAndStartTime(
      selectedCourt,
      sportId,
      selectedDayOfWeek,
      startTime,
      fallbackDuration
    )
    if (nextDuration !== customDurationMinutes) {
      setCustomDurationMinutes(nextDuration)
    }
  }, [selectedCourt, sportId, selectedDayOfWeek, startTime, customDurationMinutes])

  // Contexto Bloqueo Operativo: horarios válidos según la unión de ventanas operativas de la cancha
  const blockStartDayOfWeek = useMemo(() => {
    const [y, m, d] = blockStartDate.split('-').map(Number)
    return new Date(y, m - 1, d).getDay()
  }, [blockStartDate])

  const availableBlockStartTimes = useMemo(() => {
    if (!selectedCourt) return QUARTER_HOUR_TIME_SLOTS
    const hasOperatingRules =
      selectedCourt.operatingWindows && selectedCourt.operatingWindows.length > 0
    const courtIntervals = getCourtDayOperatingIntervals(
      selectedCourt.operatingWindows,
      blockStartDayOfWeek
    )
    const activeDayBookings =
      blockStartDate === defaultDate
        ? (selectedCourt.bookings || []).filter(
            (b) => b.status !== 'cancelled' && b.status !== 'expired'
          )
        : []

    return QUARTER_HOUR_TIME_SLOTS.filter((t) => {
      const startMin = parseTimeToMinutes(t)
      if (
        hasOperatingRules &&
        !isIntervalCoveredByOperatingWindows(startMin, startMin + 15, courtIntervals)
      ) {
        return false
      }

      if (activeDayBookings.length > 0) {
        const candidateStartMs = new Date(localToUtcIso(blockStartDate, t)).getTime()
        const candidateEndMs = candidateStartMs + 15 * 60 * 1000
        const hasConflict = activeDayBookings.some((b) => {
          const bStart = new Date(b.startTimeUtc).getTime()
          const bEnd = new Date(b.endTimeUtc).getTime()
          return bStart < candidateEndMs && bEnd > candidateStartMs
        })
        if (hasConflict) return false
      }

      return true
    })
  }, [selectedCourt, blockStartDayOfWeek, blockStartDate, defaultDate])

  const availableBlockEndTimes = useMemo(() => {
    if (!selectedCourt) return QUARTER_HOUR_END_TIME_SLOTS
    const hasOperatingRules =
      selectedCourt.operatingWindows && selectedCourt.operatingWindows.length > 0
    const courtStartDayIntervals = getCourtDayOperatingIntervals(
      selectedCourt.operatingWindows,
      blockStartDayOfWeek
    )
    const startMin = parseTimeToMinutes(blockStartTime)

    const activeDayBookings =
      blockStartDate === defaultDate
        ? (selectedCourt.bookings || []).filter(
            (b) => b.status !== 'cancelled' && b.status !== 'expired'
          )
        : []

    return QUARTER_HOUR_END_TIME_SLOTS.filter((t) => {
      const endMin = parseEndTimeToMinutes(t)
      if (blockEndDate === blockStartDate) {
        if (endMin <= startMin) return false
        if (
          hasOperatingRules &&
          !isIntervalCoveredByOperatingWindows(startMin, endMin, courtStartDayIntervals)
        ) {
          return false
        }
      } else {
        // Bloqueo que cruza al día siguiente: requiere que el día de inicio cubra hasta 24:00 y el siguiente desde 00:00
        const [ey, em, ed] = blockEndDate.split('-').map(Number)
        const endDayOfWeek = new Date(ey, em - 1, ed).getDay()
        const courtEndDayIntervals = getCourtDayOperatingIntervals(
          selectedCourt.operatingWindows,
          endDayOfWeek
        )
        if (hasOperatingRules) {
          const coveredStartDay = isIntervalCoveredByOperatingWindows(
            startMin,
            1440,
            courtStartDayIntervals
          )
          const coveredEndDay = isIntervalCoveredByOperatingWindows(
            0,
            endMin,
            courtEndDayIntervals
          )
          if (!coveredStartDay || !coveredEndDay) return false
        }
      }

      if (activeDayBookings.length > 0) {
        const candidateStartMs = new Date(localToUtcIso(blockStartDate, blockStartTime)).getTime()
        const candidateEndMs = new Date(localToUtcIso(blockEndDate, t)).getTime()
        const hasConflict = activeDayBookings.some((b) => {
          const bStart = new Date(b.startTimeUtc).getTime()
          const bEnd = new Date(b.endTimeUtc).getTime()
          return bStart < candidateEndMs && bEnd > candidateStartMs
        })
        if (hasConflict) return false
      }

      return true
    })
  }, [selectedCourt, blockStartDayOfWeek, blockStartDate, blockEndDate, blockStartTime, defaultDate])

  useEffect(() => {
    if (!isOpen || mode !== 'block') return
    if (
      availableBlockStartTimes.length > 0 &&
      !availableBlockStartTimes.includes(blockStartTime)
    ) {
      setBlockStartTime(availableBlockStartTimes[0])
    }
  }, [isOpen, mode, availableBlockStartTimes, blockStartTime])

  useEffect(() => {
    if (!isOpen || mode !== 'block') return
    if (availableBlockEndTimes.length > 0 && !availableBlockEndTimes.includes(blockEndTime)) {
      setBlockEndTime(availableBlockEndTimes[0])
    }
  }, [isOpen, mode, availableBlockEndTimes, blockEndTime])

  // Calcular hora fin a partir de startTime y duración (modo reserva comercial)
  const endTime = useMemo(() => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + customDurationMinutes
    const endH = Math.floor(totalMinutes / 60) % 24
    const endM = totalMinutes % 60
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
  }, [startTime, customDurationMinutes])

  // Obtener cotización de precio dinámica (solo en modo reserva comercial)
  useEffect(() => {
    if (mode !== 'booking' || !courtId || !sportId || !defaultDate || !startTime || !endTime) return

    const startDateTimeUtc = localToUtcIso(defaultDate, startTime)
    const endDateTimeUtc = new Date(
      new Date(startDateTimeUtc).getTime() + customDurationMinutes * 60 * 1000
    ).toISOString()

    priceQuoteMutation.mutate(
      {
        courtId,
        sportId,
        startTimeUtc: startDateTimeUtc,
        endTimeUtc: endDateTimeUtc,
      },
      {
        onSuccess: (data) => {
          setQuotedPrice(data.price)
          if (!overridePrice) {
            setCustomPrice(data.price)
            setDepositAmount((prev) => calculateDepositForPrice(data.price, depositType, prev))
          }
        },
      }
    )
  }, [mode, courtId, sportId, defaultDate, startTime, endTime, customDurationMinutes])

  const effectivePrice = overridePrice ? customPrice : quotedPrice
  const isDepositExceedingTotal = mode === 'booking' && depositAmount > effectivePrice

  // Selección de disciplina con inmediatez y desmarcado de tarifa manual
  const handleSelectSport = (sport: GridSportItem) => {
    setSportId(sport.sportId)
    setCustomDurationMinutes(sport.durationMinutes)

    setOverridePrice(false)
    setQuotedPrice(sport.basePrice)
    setCustomPrice(sport.basePrice)
    setDepositAmount(calculateDepositForPrice(sport.basePrice, depositType, depositAmount))
  }

  // Cambio de cancha en selector
  const handleCourtChange = (newCourtId: string) => {
    setCourtId(newCourtId)
    const targetCourt = courts.find((c) => c.courtId === newCourtId)
    if (targetCourt) {
      const fittingSports = maxAvailableMinutes
        ? targetCourt.sports.filter((s) => s.durationMinutes <= maxAvailableMinutes)
        : targetCourt.sports
      const newSport = fittingSports[0] || targetCourt.sports[0]
      if (newSport) {
        handleSelectSport(newSport)
      }
    }
  }

  // Toggle de modificación manual de tarifa
  const handleToggleOverridePrice = (checked: boolean) => {
    setOverridePrice(checked)
    const targetPrice = checked ? customPrice : quotedPrice
    setDepositAmount(calculateDepositForPrice(targetPrice, depositType, depositAmount))
  }

  // Cambio de precio personalizado
  const handleCustomPriceChange = (val: number) => {
    const validVal = Math.max(0, val)
    setCustomPrice(validVal)
    setDepositAmount(calculateDepositForPrice(validVal, depositType, depositAmount))
  }

  // Cambio de modo de seña (100%, 50%, 0%, custom)
  const handleSetDepositMode = (type: '100' | '50' | '0' | 'custom') => {
    setDepositType(type)
    if (type === '100') {
      setDepositAmount(effectivePrice)
    } else if (type === '50') {
      setDepositAmount(Math.round(effectivePrice * 0.5))
    } else if (type === '0') {
      setDepositAmount(0)
    }
  }

  const handleSelectCustomer = (customer: CustomerLookupDto) => {
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone)
    setCustomerEmail(customer.email || '')
    setCustomerSearchQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'block') {
      const blockStartUtc = localToUtcIso(blockStartDate, blockStartTime)
      const blockEndUtc = localToUtcIso(blockEndDate, blockEndTime)

      if (new Date(blockEndUtc).getTime() <= new Date(blockStartUtc).getTime()) {
        toast.error('La fecha y hora de finalización del bloqueo deben ser posteriores al inicio.')
        return
      }

      if (!blockReason.trim()) {
        toast.error('Ingrese el motivo del bloqueo operativo.')
        return
      }

      await createBlockMutation.mutateAsync({
        courtId,
        startTimeUtc: blockStartUtc,
        endTimeUtc: blockEndUtc,
        reason: blockReason.trim(),
      })
      onClose()
      return
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      return
    }

    if (depositAmount > effectivePrice) {
      toast.error('El monto de la seña o pago inicial no puede superar el valor total del turno.')
      return
    }

    if (availableBookingStartTimes.length === 0) {
      toast.error('No hay horarios disponibles para esta disciplina en la fecha seleccionada.')
      return
    }

    const startDateTimeUtc = localToUtcIso(defaultDate, startTime)
    const endDateTimeUtc = new Date(
      new Date(startDateTimeUtc).getTime() + customDurationMinutes * 60 * 1000
    ).toISOString()

    await createBookingMutation.mutateAsync({
      courtId,
      sportId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || null,
      startTimeUtc: startDateTimeUtc,
      endTimeUtc: endDateTimeUtc,
      customPrice: overridePrice ? customPrice : null,
      depositAmount,
      paymentMethod: depositAmount > 0 ? paymentMethod : null,
      isRecurring,
      notes: notes.trim() || null,
    })

    onClose()
  }

  const isSubmitting = createBookingMutation.isPending || createBlockMutation.isPending

  return (
    <Sheet isOpen={isOpen} onClose={onClose} side="right">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <SheetHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#22242B] border border-[#31343E] flex items-center justify-center text-[#D46211]">
              <Calendar className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-[#F2F3F5] leading-tight">
                {mode === 'booking' ? 'Nueva Reserva de Cancha' : 'Nuevo Bloqueo Operativo'}
              </h2>
              <p className="text-xs font-mono font-medium text-[#9497A1] mt-0.5">
                {mode === 'booking'
                  ? `${defaultDate} · ${startTime} a ${endTime} hs`
                  : `${blockStartDate} ${blockStartTime} a ${blockEndDate} ${blockEndTime} hs`}
              </p>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-6 bg-[#17181C] text-[#F2F3F5]">
          {/* Selector de Modo (Turno vs Bloqueo) */}
          <div className="flex rounded-xl bg-[#111215] p-1 border border-[#31343E]">
            <button
              type="button"
              onClick={() => setMode('booking')}
              className={cn(
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer',
                mode === 'booking'
                  ? 'bg-[#22242B] text-[#F2F3F5] shadow-sm border border-[#31343E]'
                  : 'text-[#9497A1] hover:text-[#F2F3F5]'
              )}
            >
              Turno Regular
            </button>
            <button
              type="button"
              onClick={() => setMode('block')}
              className={cn(
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer',
                mode === 'block'
                  ? 'bg-[#22242B] text-[#D46211] shadow-sm border border-[#31343E]'
                  : 'text-[#9497A1] hover:text-[#F2F3F5]'
              )}
            >
              Bloqueo Operativo
            </button>
          </div>

          {/* Configuración de Cancha y Disciplina */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                Cancha Seleccionada
              </label>
              <select
                value={courtId}
                onChange={(e) => handleCourtChange(e.target.value)}
                className="w-full text-base sm:text-sm font-medium rounded-xl border border-[#31343E] bg-[#22242B] px-3.5 py-2.5 text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden cursor-pointer"
              >
                {courts.map((c) => (
                  <option key={c.courtId} value={c.courtId} className="bg-[#22242B] text-[#F2F3F5]">
                    {c.courtName} ({c.surface} {c.isIndoor ? '· Techada' : ''})
                  </option>
                ))}
              </select>
            </div>

            {mode === 'booking' && selectedCourt && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider">
                    Disciplina Deportiva
                  </label>
                  {maxAvailableMinutes && (
                    <span className="text-[11px] font-mono text-[#D46211] font-bold bg-[#D46211]/10 border border-[#D46211]/30 px-2 py-0.5 rounded-md">
                      Máx. {maxAvailableMinutes}m libres
                    </span>
                  )}
                </div>
                {availableSports.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300 font-medium">
                    No hay disciplinas configuradas en esta cancha que entren en el tiempo disponible ({maxAvailableMinutes} min).
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSports.map((s) => (
                      <button
                        key={s.sportId}
                        type="button"
                        onClick={() => handleSelectSport(s)}
                        className={cn(
                          'flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer',
                          sportId === s.sportId
                            ? 'border-[#327357] bg-[#327357]/20 ring-1 ring-[#327357]'
                            : 'border-[#31343E] hover:border-[#9497A1] bg-[#22242B]'
                        )}
                      >
                        <span className="text-sm font-bold text-[#F2F3F5]">{s.name}</span>
                        <span
                          className={cn(
                            'text-xs font-mono font-bold mt-0.5',
                            sportId === s.sportId ? 'text-[#4ADE80]' : 'text-[#9497A1]'
                          )}
                        >
                          {s.durationMinutes} min · Base ${s.basePrice.toLocaleString('es-AR')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Si es Bloqueo Operativo */}
          {mode === 'block' ? (
            <div className="space-y-4 pt-2 border-t border-[#31343E]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={blockStartDate}
                    onChange={(e) => {
                      const nextDate = e.target.value
                      setBlockStartDate(nextDate)
                      if (blockEndDate < nextDate) {
                        setBlockEndDate(nextDate)
                      }
                    }}
                    className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-[#31343E] bg-[#22242B] px-3 py-2.5 text-[#F2F3F5] focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Hora de Inicio
                  </label>
                  <select
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    disabled={availableBlockStartTimes.length === 0}
                    className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-[#31343E] bg-[#22242B] px-3 py-2.5 text-[#F2F3F5] focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211] outline-hidden cursor-pointer disabled:opacity-50"
                  >
                    {availableBlockStartTimes.length === 0 ? (
                      <option value="">Sin horarios disponibles</option>
                    ) : (
                      availableBlockStartTimes.map((t) => (
                        <option key={`block-start-${t}`} value={t} className="bg-[#22242B] text-[#F2F3F5]">
                          {t} hs
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Fecha de Finalización
                  </label>
                  <input
                    type="date"
                    required
                    min={blockStartDate}
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-[#31343E] bg-[#22242B] px-3 py-2.5 text-[#F2F3F5] focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Hora de Finalización
                  </label>
                  <select
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    disabled={availableBlockEndTimes.length === 0}
                    className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-[#31343E] bg-[#22242B] px-3 py-2.5 text-[#F2F3F5] focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211] outline-hidden cursor-pointer disabled:opacity-50"
                  >
                    {availableBlockEndTimes.length === 0 ? (
                      <option value="">Sin horarios continuos</option>
                    ) : (
                      availableBlockEndTimes.map((t) => (
                        <option key={`block-end-${t}`} value={t} className="bg-[#22242B] text-[#F2F3F5]">
                          {t === '24:00' ? '24:00 (Cierre medianoche)' : `${t} hs`}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                  Motivo del Bloqueo
                </label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ej: Mantenimiento de red, Iluminación, Torneo"
                  className="w-full text-base sm:text-sm font-medium rounded-xl border border-[#31343E] bg-[#22242B] px-3.5 py-2.5 text-[#F2F3F5] focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211] outline-hidden placeholder:text-[#6C707E]"
                />
              </div>
            </div>
          ) : (
            /* Modo Reserva Regular */
            <>
              {/* Horario de Inicio y Finalización */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Hora de Inicio
                  </label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={availableBookingStartTimes.length === 0}
                    className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-[#31343E] bg-[#22242B] px-3 py-2.5 text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden cursor-pointer disabled:opacity-50"
                  >
                    {availableBookingStartTimes.length === 0 ? (
                      <option value="">Sin horarios disponibles</option>
                    ) : (
                      availableBookingStartTimes.map((t) => (
                        <option key={`booking-start-${t}`} value={t} className="bg-[#22242B] text-[#F2F3F5]">
                          {t} hs
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Hora de Finalización
                  </label>
                  <div className="flex items-center h-[42px] px-3.5 rounded-xl border border-[#31343E] bg-[#111215] text-[#9497A1] text-sm font-mono font-bold">
                    {endTime} hs
                  </div>
                </div>
              </div>

              {/* Autocompletado de Cliente */}
              <div className="space-y-3 pt-3 border-t border-[#31343E]">
                <div className="relative">
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Buscar Cliente Frecuente (por Teléfono o Nombre)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#9497A1]" />
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Escriba 2 o más caracteres..."
                      className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2 rounded-xl border border-[#31343E] bg-[#22242B] text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden placeholder:text-[#6C707E]"
                    />
                  </div>

                  {/* Dropdown de resultados de autocompletado */}
                  {customerSearchResults && customerSearchResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl bg-[#22242B] shadow-2xl border border-[#31343E] py-1.5 max-h-48 overflow-y-auto">
                      {customerSearchResults.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleSelectCustomer(cust)}
                          className="w-full px-4 py-2.5 text-left hover:bg-[#111215] flex items-center justify-between transition-colors cursor-pointer border-b border-[#31343E]/40 last:border-b-0"
                        >
                          <div>
                            <span className="text-sm font-bold text-[#F2F3F5] block">
                              {cust.name}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#9497A1]">{cust.phone}</span>
                          </div>
                          {cust.email && (
                            <span className="text-xs font-mono text-[#6C707E]">{cust.email}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-[#9497A1]" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Juan Pérez"
                        className="w-full text-base sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-[#31343E] bg-[#22242B] text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden placeholder:text-[#6C707E]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                      Teléfono WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-[#9497A1]" />
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="11 3456-7890"
                        className="w-full text-base sm:text-sm font-mono pl-9 pr-3 py-2 rounded-xl border border-[#31343E] bg-[#22242B] text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden placeholder:text-[#6C707E]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#9497A1]" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="juan@ejemplo.com"
                      className="w-full text-base sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-[#31343E] bg-[#22242B] text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden placeholder:text-[#6C707E]"
                    />
                  </div>
                </div>
              </div>

              {/* Liquidación de Precios y Pagos */}
              <div className="space-y-4 pt-3 border-t border-[#31343E]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#F2F3F5]">
                      Precio del Turno
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#9497A1] block mt-0.5">
                      Tarifa sugerida: ${quotedPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-[#327357]">
                      ${effectivePrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overridePrice"
                    checked={overridePrice}
                    onChange={(e) => handleToggleOverridePrice(e.target.checked)}
                    className="h-4 w-4 text-[#327357] rounded border-[#31343E] bg-[#22242B] focus:ring-[#327357] cursor-pointer"
                  />
                  <label htmlFor="overridePrice" className="text-xs font-semibold text-[#9497A1] hover:text-[#F2F3F5] cursor-pointer">
                    Modificar tarifa manualmente para este turno
                  </label>
                </div>

                {overridePrice && (
                  <div className="animate-in fade-in duration-200">
                    <NumericInput
                      min="0"
                      step="500"
                      value={customPrice}
                      onChange={(val) => handleCustomPriceChange(val)}
                      className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-[#31343E] bg-[#22242B] px-3.5 py-2 text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden"
                    />
                  </div>
                )}

                {/* Seña / Anticipo Inicial */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider">
                      Seña o Pago Registrado al Reservar
                    </label>
                    <span className="text-sm font-mono font-black text-[#F2F3F5]">
                      ${depositAmount.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => handleSetDepositMode('100')}
                      className={cn(
                        'py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center',
                        depositType === '100'
                          ? 'border-[#327357] bg-[#327357]/20 text-[#4ADE80]'
                          : 'border-[#31343E] bg-[#22242B] hover:bg-[#111215] text-[#9497A1] hover:text-[#F2F3F5]'
                      )}
                    >
                      Total (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDepositMode('50')}
                      className={cn(
                        'py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center',
                        depositType === '50'
                          ? 'border-[#327357] bg-[#327357]/20 text-[#4ADE80]'
                          : 'border-[#31343E] bg-[#22242B] hover:bg-[#111215] text-[#9497A1] hover:text-[#F2F3F5]'
                      )}
                    >
                      Seña 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDepositMode('0')}
                      className={cn(
                        'py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center',
                        depositType === '0'
                          ? 'border-[#327357] bg-[#327357]/20 text-[#4ADE80]'
                          : 'border-[#31343E] bg-[#22242B] hover:bg-[#111215] text-[#9497A1] hover:text-[#F2F3F5]'
                      )}
                    >
                      Sin Seña ($0)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDepositMode('custom')}
                      className={cn(
                        'py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center',
                        depositType === 'custom'
                          ? 'border-[#D46211] bg-[#D46211]/20 text-[#FFB786]'
                          : 'border-[#31343E] bg-[#22242B] hover:bg-[#111215] text-[#9497A1] hover:text-[#F2F3F5]'
                      )}
                    >
                      Monto Fijo
                    </button>
                  </div>

                  {depositType === 'custom' && (
                    <div className="mb-3 animate-in fade-in duration-200">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-[#D46211]" />
                        <NumericInput
                          min="0"
                          step="500"
                          value={depositAmount}
                          onChange={(val) => {
                            setDepositAmount(Math.max(0, val))
                          }}
                          placeholder="Ingrese monto exacto de seña..."
                          className={cn(
                            'w-full text-base sm:text-sm font-mono font-bold pl-9 pr-3.5 py-2 rounded-xl border bg-[#22242B] text-[#F2F3F5] outline-hidden placeholder:text-[#6C707E]',
                            isDepositExceedingTotal
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-[#31343E] focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]'
                          )}
                        />
                      </div>
                      {isDepositExceedingTotal ? (
                        <span className="text-[11px] font-mono text-red-400 font-semibold mt-1 block">
                          El valor de la seña (${depositAmount.toLocaleString('es-AR')}) no puede superar el valor total del turno (${effectivePrice.toLocaleString('es-AR')}).
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-[#9497A1] mt-1 block">
                          Saldo a liquidar en cancha: ${(Math.max(0, effectivePrice - depositAmount)).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                  )}

                  {depositAmount > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { id: 'cash', label: 'Efectivo', icon: Banknote },
                        { id: 'transfer', label: 'Transfer.', icon: Building },
                        { id: 'card', label: 'Tarjeta', icon: CreditCard },
                        { id: 'mercadopago', label: 'Mercado Pago', icon: DollarSign },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPaymentMethod(item.id as typeof paymentMethod)}
                            className={cn(
                              'flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                              paymentMethod === item.id
                                ? 'border-[#D46211] bg-[#D46211]/20 text-[#FFB786]'
                                : 'border-[#31343E] bg-[#22242B] hover:bg-[#111215] text-[#9497A1] hover:text-[#F2F3F5]'
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Turno Fijo Semanal */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#22242B] border border-[#31343E]">
                  <div className="flex items-center gap-2.5">
                    <Repeat className="h-4 w-4 text-[#D46211]" strokeWidth={1.75} />
                    <div>
                      <span className="text-sm font-bold text-[#F2F3F5] block">
                        Turno Fijo Semanal
                      </span>
                      <span className="text-xs font-medium text-[#9497A1]">
                        Reservar automáticamente todas las semanas en este horario
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 text-[#327357] rounded border-[#31343E] bg-[#17181C] focus:ring-[#327357] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                    Notas u Observaciones
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Trae pelotas propias, abonó mitad por anticipado"
                    className="w-full text-base sm:text-sm rounded-xl border border-[#31343E] bg-[#22242B] p-3 text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden placeholder:text-[#6C707E]"
                  />
                </div>
              </div>
            </>
          )}
        </SheetBody>

        <SheetFooter>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-[#31343E] text-xs font-bold uppercase tracking-wider text-[#9497A1] bg-[#22242B] hover:bg-[#282A32] hover:text-[#F2F3F5] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (mode === 'booking' &&
                (isDepositExceedingTotal || availableBookingStartTimes.length === 0)) ||
              (mode === 'block' &&
                (availableBlockStartTimes.length === 0 || availableBlockEndTimes.length === 0))
            }
            className={cn(
              'w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2',
              mode === 'booking'
                ? 'bg-[#327357] hover:bg-[#285E46] active:bg-[#1E4B37]'
                : 'bg-[#D46211] hover:bg-[#B8530C] active:bg-[#9B4408]'
            )}
          >
            {isSubmitting ? (
              'Guardando...'
            ) : mode === 'booking' ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2} />
                <span>Confirmar Reserva</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" strokeWidth={2} />
                <span>Aplicar Bloqueo</span>
              </>
            )}
          </button>
        </SheetFooter>
      </form>
    </Sheet>
  )
}
