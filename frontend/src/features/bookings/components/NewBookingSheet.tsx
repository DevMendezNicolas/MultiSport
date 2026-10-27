import React, { useState, useEffect, useMemo } from 'react'
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
import {
  useCreateBooking,
  useCreateBlock,
  useCustomerSearch,
  usePriceQuote,
} from '../hooks/useBookings'
import type { DailyGridCourtItem, CustomerLookupDto, GridSportItem } from '../types'
import { localToUtcIso } from '../types/timeline.types'

interface NewBookingSheetProps {
  isOpen: boolean
  onClose: () => void
  courts: DailyGridCourtItem[]
  defaultCourtId?: string
  defaultDate: string
  defaultTimeSlot?: string
  maxAvailableMinutes?: number
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

  // Bloqueo operativo
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

  // Filtrar disciplinas según el tiempo libre disponible si existe
  const availableSports = useMemo(() => {
    if (!selectedCourt) return []
    if (!maxAvailableMinutes) return selectedCourt.sports
    return selectedCourt.sports.filter((s) => s.durationMinutes <= maxAvailableMinutes)
  }, [selectedCourt, maxAvailableMinutes])

  // Calcular hora fin a partir de startTime y duración
  const endTime = useMemo(() => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + customDurationMinutes
    const endH = Math.floor(totalMinutes / 60) % 24
    const endM = totalMinutes % 60
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
  }, [startTime, customDurationMinutes])

  // Obtener cotización de precio dinámica
  useEffect(() => {
    if (!courtId || !sportId || !defaultDate || !startTime || !endTime) return

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
  }, [courtId, sportId, defaultDate, startTime, endTime])

  const effectivePrice = overridePrice ? customPrice : quotedPrice

  // Selección de disciplina con inmediatez y desmarcado de tarifa manual (Q1, Q2, Q3)
  const handleSelectSport = (sport: GridSportItem) => {
    setSportId(sport.sportId)
    setCustomDurationMinutes(sport.durationMinutes)

    // 1. Inmediatamente actualizar precio base y desmarcar modificación manual
    setOverridePrice(false)
    setQuotedPrice(sport.basePrice)
    setCustomPrice(sport.basePrice)

    // 2. Recalcular seña según la preferencia activa (100%, 50%, 0% o personalizada)
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

    const startDateTimeUtc = localToUtcIso(defaultDate, startTime)
    const endDateTimeUtc = new Date(
      new Date(startDateTimeUtc).getTime() + customDurationMinutes * 60 * 1000
    ).toISOString()

    if (mode === 'block') {
      await createBlockMutation.mutateAsync({
        courtId,
        startTimeUtc: startDateTimeUtc,
        endTimeUtc: endDateTimeUtc,
        reason: blockReason,
      })
      onClose()
      return
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      return
    }

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
                {defaultDate} · {startTime} a {endTime} hs
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

          {/* Horario de Inicio y Finalización */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mb-1.5">
                Hora de Inicio
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-[#31343E] bg-[#22242B] px-3 py-2 text-[#F2F3F5] focus:border-[#327357] focus:ring-1 focus:ring-[#327357] outline-hidden"
                />
              </div>
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

          {/* Si es Bloqueo Operativo */}
          {mode === 'block' ? (
            <div className="space-y-4">
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
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={customPrice}
                      onChange={(e) => handleCustomPriceChange(Number(e.target.value))}
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
                        <input
                          type="number"
                          min="0"
                          max={effectivePrice}
                          step="500"
                          value={depositAmount}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value))
                            setDepositAmount(val)
                          }}
                          placeholder="Ingrese monto exacto de seña..."
                          className="w-full text-base sm:text-sm font-mono font-bold pl-9 pr-3.5 py-2 rounded-xl border border-[#31343E] bg-[#22242B] text-[#F2F3F5] focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211] outline-hidden placeholder:text-[#6C707E]"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-[#9497A1] mt-1 block">
                        Saldo a liquidar en cancha: ${(Math.max(0, effectivePrice - depositAmount)).toLocaleString('es-AR')}
                      </span>
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
            disabled={isSubmitting}
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
