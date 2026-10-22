import React, { useState, useEffect, useMemo } from 'react'
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
import type { DailyGridCourtItem, CustomerLookupDto } from '../types'

interface NewBookingSheetProps {
  isOpen: boolean
  onClose: () => void
  courts: DailyGridCourtItem[]
  defaultCourtId?: string
  defaultDate: string
  defaultTimeSlot?: string
}

export const NewBookingSheet: React.FC<NewBookingSheetProps> = ({
  isOpen,
  onClose,
  courts,
  defaultCourtId,
  defaultDate,
  defaultTimeSlot = '18:00',
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
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'mercadopago'>('cash')

  // Bloqueo operativo
  const [blockReason, setBlockReason] = useState('Mantenimiento')

  // Queries y Mutaciones
  const { data: customerSearchResults } = useCustomerSearch(customerSearchQuery)
  const createBookingMutation = useCreateBooking()
  const createBlockMutation = useCreateBlock()
  const priceQuoteMutation = usePriceQuote()

  // Sincronizar estado inicial al abrir
  useEffect(() => {
    if (isOpen) {
      const initialCourt = courts.find((c) => c.courtId === defaultCourtId) || courts[0]
      if (initialCourt) {
        setCourtId(initialCourt.courtId)
        const initialSport = initialCourt.sports[0]
        if (initialSport) {
          setSportId(initialSport.sportId)
          setCustomDurationMinutes(initialSport.durationMinutes)
        }
      }
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
  }, [isOpen, defaultCourtId, defaultTimeSlot, courts])

  const selectedCourt = useMemo(
    () => courts.find((c) => c.courtId === courtId),
    [courts, courtId]
  )

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

    const startDateTimeUtc = new Date(`${defaultDate}T${startTime}:00Z`).toISOString()
    const endDateTimeUtc = new Date(`${defaultDate}T${endTime}:00Z`).toISOString()

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
            setDepositAmount(data.price) // Por defecto sugerir pago total o seña completa
          }
        },
      }
    )
  }, [courtId, sportId, defaultDate, startTime, endTime])

  const effectivePrice = overridePrice ? customPrice : quotedPrice

  const handleSelectCustomer = (customer: CustomerLookupDto) => {
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone)
    setCustomerEmail(customer.email || '')
    setCustomerSearchQuery('')
  }

  const handleSetDepositPercentage = (pct: number) => {
    const amount = Math.round((effectivePrice * pct) / 100)
    setDepositAmount(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const startDateTimeUtc = new Date(`${defaultDate}T${startTime}:00Z`).toISOString()
    const endDateTimeUtc = new Date(`${defaultDate}T${endTime}:00Z`).toISOString()

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
            <div className="h-10 w-10 rounded-xl bg-[#258653]/10 flex items-center justify-center text-[#258653]">
              <Calendar className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-950 leading-tight">
                {mode === 'booking' ? 'Nueva Reserva de Cancha' : 'Nuevo Bloqueo Operativo'}
              </h2>
              <p className="text-xs font-mono font-bold text-neutral-700">
                {defaultDate} · {startTime} a {endTime} hs
              </p>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-6">
          {/* Selector de Modo (Turno vs Bloqueo) */}
          <div className="flex rounded-xl bg-neutral-100 p-1 border border-neutral-300">
            <button
              type="button"
              onClick={() => setMode('booking')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'booking'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-700 hover:text-neutral-950'
              }`}
            >
              Turno Regular
            </button>
            <button
              type="button"
              onClick={() => setMode('block')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'block'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-700 hover:text-neutral-950'
              }`}
            >
              Bloqueo Operativo
            </button>
          </div>

          {/* Configuración de Cancha y Disciplina */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Cancha Seleccionada
              </label>
              <select
                value={courtId}
                onChange={(e) => {
                  setCourtId(e.target.value)
                  const targetCourt = courts.find((c) => c.courtId === e.target.value)
                  if (targetCourt && targetCourt.sports[0]) {
                    setSportId(targetCourt.sports[0].sportId)
                    setCustomDurationMinutes(targetCourt.sports[0].durationMinutes)
                  }
                }}
                className="w-full text-base sm:text-sm font-medium rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden cursor-pointer"
              >
                {courts.map((c) => (
                  <option key={c.courtId} value={c.courtId}>
                    {c.courtName} ({c.surface} {c.isIndoor ? '· Techada' : ''})
                  </option>
                ))}
              </select>
            </div>

            {mode === 'booking' && selectedCourt && (
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Disciplina Deportiva
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCourt.sports.map((s) => (
                    <button
                      key={s.sportId}
                      type="button"
                      onClick={() => {
                        setSportId(s.sportId)
                        setCustomDurationMinutes(s.durationMinutes)
                      }}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        sportId === s.sportId
                          ? 'border-[#258653] bg-[#258653]/10 ring-1 ring-[#258653]'
                          : 'border-neutral-300 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      <span className="text-sm font-bold text-neutral-950">{s.name}</span>
                      <span className="text-xs font-mono font-bold text-neutral-700 mt-0.5">
                        {s.durationMinutes} min · Base ${s.basePrice.toLocaleString('es-AR')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Horario de Inicio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Hora de Inicio
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-neutral-300 bg-white px-3 py-2 text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Hora de Finalización
              </label>
              <div className="flex items-center h-[42px] px-3.5 rounded-xl border border-neutral-300 bg-neutral-100 text-neutral-950 text-sm font-mono font-bold">
                {endTime} hs
              </div>
            </div>
          </div>

          {/* Si es Bloqueo Operativo */}
          {mode === 'block' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Motivo del Bloqueo
                </label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ej: Mantenimiento de red, Iluminación, Torneo"
                  className="w-full text-base sm:text-sm font-medium rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden placeholder:text-neutral-500"
                />
              </div>
            </div>
          ) : (
            /* Modo Reserva Regular */
            <>
              {/* Autocompletado de Cliente */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <div className="relative">
                  <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                    Buscar Cliente Frecuente (por Teléfono o Nombre)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Escriba 2 o más caracteres..."
                      className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden placeholder:text-neutral-500"
                    />
                  </div>

                  {/* Dropdown de resultados de autocompletado */}
                  {customerSearchResults && customerSearchResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl bg-white shadow-xl border border-neutral-300 py-1.5 max-h-48 overflow-y-auto">
                      {customerSearchResults.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleSelectCustomer(cust)}
                          className="w-full px-4 py-2 text-left hover:bg-neutral-100 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="text-sm font-bold text-neutral-950 block">
                              {cust.name}
                            </span>
                            <span className="text-xs font-mono font-bold text-neutral-700">{cust.phone}</span>
                          </div>
                          {cust.email && (
                            <span className="text-xs font-mono text-neutral-600">{cust.email}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Juan Pérez"
                        className="w-full text-base sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden placeholder:text-neutral-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                      Teléfono WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="11 3456-7890"
                        className="w-full text-base sm:text-sm font-mono pl-9 pr-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden placeholder:text-neutral-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="juan@ejemplo.com"
                      className="w-full text-base sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden placeholder:text-neutral-500"
                    />
                  </div>
                </div>
              </div>

              {/* Liquidación de Precios y Pagos */}
              <div className="space-y-4 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-neutral-950">
                      Precio del Turno
                    </span>
                    <span className="text-xs font-mono font-semibold text-neutral-700 block">
                      Tarifa sugerida: ${quotedPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-[#164734]">
                      ${effectivePrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overridePrice"
                    checked={overridePrice}
                    onChange={(e) => {
                      setOverridePrice(e.target.checked)
                      if (!e.target.checked) setCustomPrice(quotedPrice)
                    }}
                    className="h-4 w-4 text-[#258653] rounded border-neutral-300 focus:ring-[#258653] cursor-pointer"
                  />
                  <label htmlFor="overridePrice" className="text-xs font-semibold text-neutral-800 cursor-pointer">
                    Modificar tarifa manualmente para este turno
                  </label>
                </div>

                {overridePrice && (
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={customPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setCustomPrice(val)
                        setDepositAmount(val)
                      }}
                      className="w-full text-base sm:text-sm font-mono font-bold rounded-xl border border-neutral-300 px-3.5 py-2 text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden"
                    />
                  </div>
                )}

                {/* Seña / Anticipo Inicial */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider">
                      Seña o Pago Registrado al Reservar
                    </label>
                    <span className="text-sm font-mono font-black text-neutral-950">
                      ${depositAmount.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => handleSetDepositPercentage(100)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        depositAmount === effectivePrice
                          ? 'border-[#258653] bg-[#258653]/15 text-[#164734]'
                          : 'border-neutral-300 hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      Total (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDepositPercentage(50)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        depositAmount === Math.round(effectivePrice * 0.5)
                          ? 'border-[#258653] bg-[#258653]/15 text-[#164734]'
                          : 'border-neutral-300 hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      Seña 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositAmount(0)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        depositAmount === 0
                          ? 'border-[#258653] bg-[#258653]/15 text-[#164734]'
                          : 'border-neutral-300 hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      Sin Seña ($0)
                    </button>
                  </div>

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
                            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              paymentMethod === item.id
                                ? 'border-[#258653] bg-[#258653]/15 text-[#164734]'
                                : 'border-neutral-300 hover:bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Turno Fijo Semanal */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100 border border-neutral-300">
                  <div className="flex items-center gap-2.5">
                    <Repeat className="h-4 w-4 text-[#164734]" strokeWidth={2} />
                    <div>
                      <span className="text-sm font-bold text-neutral-950 block">
                        Turno Fijo Semanal
                      </span>
                      <span className="text-xs font-medium text-neutral-700">
                        Reservar automáticamente todas las semanas en este horario
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 text-[#258653] rounded border-neutral-300 focus:ring-[#258653] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                    Notas u Observaciones
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Trae pelotas propias, abonó mitad por anticipado"
                    className="w-full text-base sm:text-sm rounded-xl border border-neutral-300 bg-white p-3 text-neutral-950 focus:border-[#258653] focus:ring-1 focus:ring-[#258653] outline-hidden placeholder:text-neutral-500"
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
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#258653] hover:bg-[#1E6E44] active:bg-[#164734] transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
