import React from 'react'
import { Calendar, Clock, DollarSign, User, Phone, Check } from 'lucide-react'
import {
  Sheet,
  SheetHeader,
  SheetBody,
} from '@/components/ui/sheet'
import type { OperationalBooking, OperationalCourt } from '../mock/mockBookingsData'

interface NewBookingSheetProps {
  court: OperationalCourt | null
  date: string
  timeSlot: string
  isOpen: boolean
  onClose: () => void
  onCreateBooking: (newBooking: OperationalBooking) => void
}

export const NewBookingSheet: React.FC<NewBookingSheetProps> = ({
  court,
  date,
  timeSlot,
  isOpen,
  onClose,
  onCreateBooking,
}) => {
  const [customerName, setCustomerName] = React.useState('')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [totalPrice, setTotalPrice] = React.useState<number>(18000)
  const [depositAmount, setDepositAmount] = React.useState<number>(18000)
  const [notes, setNotes] = React.useState('')
  const [isRecurring, setIsRecurring] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  // Calibrar precio sugerido por deporte cuando cambia la cancha
  React.useEffect(() => {
    if (!court) return
    const sportLower = court.sport.toLowerCase()
    let defaultPrice = 18000
    if (sportLower.includes('futbol') || sportLower.includes('fútbol')) {
      defaultPrice = court.name.includes('7') ? 42000 : 32000
    } else if (sportLower.includes('tenis')) {
      defaultPrice = 16000
    } else if (sportLower.includes('padel') || sportLower.includes('pádel')) {
      defaultPrice = 20000
    }
    setTotalPrice(defaultPrice)
    setDepositAmount(defaultPrice)
    setValidationError(null)
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
    setIsRecurring(false)
  }, [court, timeSlot, date])

  if (!isOpen || !court) return null

  // Calcular hora fin (+1 hora)
  const startHour = parseInt(timeSlot.split(':')[0], 10)
  const endHour = (startHour + 1).toString().padStart(2, '0')
  const endTime = `${endHour}:00`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      setValidationError('Por favor ingresá el nombre del titular de la reserva.')
      return
    }

    const isFull = depositAmount >= totalPrice
    const newBooking: OperationalBooking = {
      id: `booking-${Date.now()}`,
      courtId: court.id,
      courtName: court.name,
      date,
      startTime: timeSlot,
      endTime,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '-',
      sport: court.sport,
      totalPrice: Number(totalPrice),
      depositAmount: Number(depositAmount),
      status: isFull ? 'confirmed' : 'partial_deposit',
      notes: notes.trim() || undefined,
      isRecurring,
    }

    onCreateBooking(newBooking)
    onClose()
  }

  const handleQuickDeposit = (ratio: number) => {
    setDepositAmount(Math.round(totalPrice * ratio))
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} side="right">
      {/* Tirador visual para viewport móvil */}
      <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white border-b border-neutral-100">
        <div className="w-10 h-1 rounded-full bg-neutral-300" />
      </div>

      {/* Encabezado del Sheet */}
      <SheetHeader onClose={onClose}>
        <h2 className="text-lg font-black uppercase tracking-tight text-neutral-950">
          Nuevo Turno Operativo
        </h2>
        <p className="text-xs text-neutral-500 font-medium">
          {court.name} · {court.sport}
        </p>
      </SheetHeader>

      {/* Formulario */}
      <SheetBody className="p-0">
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Resumen Horario */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 border border-neutral-200 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-500 shrink-0" strokeWidth={2} />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Fecha</span>
                <span className="font-semibold text-neutral-900">{date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500 shrink-0" strokeWidth={2} />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Horario</span>
                <span className="font-semibold text-neutral-900">
                  {timeSlot} - {endTime} hs
                </span>
              </div>
            </div>
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-300 text-xs text-red-700 font-medium">
              {validationError}
            </div>
          )}

          {/* Datos del Cliente */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="bookingCustomerName"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1"
              >
                Titular del Turno *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" strokeWidth={2} />
                <input
                  id="bookingCustomerName"
                  type="text"
                  required
                  placeholder="Ej: Marcos Maidana"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value)
                    if (validationError) setValidationError(null)
                  }}
                  className="w-full pl-9 pr-3 py-2 text-base border border-neutral-300 bg-white focus:outline-none focus:border-brand-sport"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bookingCustomerPhone"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1"
              >
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-400" strokeWidth={2} />
                <input
                  id="bookingCustomerPhone"
                  type="tel"
                  placeholder="Ej: +54 9 11 4455-6677"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-base border border-neutral-300 bg-white focus:outline-none focus:border-brand-sport"
                />
              </div>
            </div>
          </div>

          {/* Esquema de Cobro y Seña */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
              Esquema de Cobro
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="bookingTotalPrice"
                  className="block text-[11px] font-bold uppercase text-neutral-600 mb-1"
                >
                  Valor Total ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" strokeWidth={2} />
                  <input
                    id="bookingTotalPrice"
                    type="number"
                    min="0"
                    step="500"
                    value={totalPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setTotalPrice(val)
                      if (depositAmount > val) setDepositAmount(val)
                    }}
                    className="w-full pl-8 pr-3 py-2 text-base border border-neutral-300 bg-white focus:outline-none focus:border-brand-sport font-mono"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="bookingDepositAmount"
                  className="block text-[11px] font-bold uppercase text-neutral-600 mb-1"
                >
                  Monto Cobrado / Seña ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" strokeWidth={2} />
                  <input
                    id="bookingDepositAmount"
                    type="number"
                    min="0"
                    max={totalPrice}
                    step="500"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-base border border-neutral-300 bg-white focus:outline-none focus:border-brand-sport font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Accesos rápidos de seña */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase text-neutral-500">Atajos:</span>
              <button
                type="button"
                onClick={() => handleQuickDeposit(1)}
                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                100% Total
              </button>
              <button
                type="button"
                onClick={() => handleQuickDeposit(0.5)}
                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                50% Seña
              </button>
              <button
                type="button"
                onClick={() => handleQuickDeposit(0)}
                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Sin Pago
              </button>
            </div>
          </div>

          {/* Fijo Semanal y Observaciones */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded-none border-neutral-300 text-brand-sport focus:ring-brand-sport"
              />
              <span className="text-xs font-semibold text-neutral-800">
                Turno fijo recurrente (todas las semanas en este horario)
              </span>
            </label>

            <div>
              <label
                htmlFor="bookingNotes"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1"
              >
                Observaciones
              </label>
              <textarea
                id="bookingNotes"
                rows={2}
                placeholder="Ej: Requieren pelotas o pecheras, o avisar en recepción..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-base border border-neutral-300 bg-white focus:outline-none focus:border-brand-sport"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 text-xs font-bold uppercase text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 bg-brand-sport text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-sport-hover transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Check className="h-4 w-4" strokeWidth={2} />
              <span>Confirmar y Guardar</span>
            </button>
          </div>
        </form>
      </SheetBody>
    </Sheet>
  )
}
