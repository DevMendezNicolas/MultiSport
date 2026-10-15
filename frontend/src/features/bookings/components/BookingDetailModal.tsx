import React from 'react'
import {
  X,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Trash2,
  DollarSign,
} from 'lucide-react'
import type { OperationalBooking } from '../mock/mockBookingsData'

interface BookingDetailModalProps {
  booking: OperationalBooking | null
  isOpen: boolean
  onClose: () => void
  onUpdateBooking: (updated: OperationalBooking) => void
  onCancelBooking: (bookingId: string) => void
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  isOpen,
  onClose,
  onUpdateBooking,
  onCancelBooking,
}) => {
  const [showConfirmCancel, setShowConfirmCancel] = React.useState(false)

  if (!isOpen || !booking) return null

  const pendingBalance = Math.max(0, booking.totalPrice - booking.depositAmount)
  const isFullyPaid = booking.status === 'confirmed' || pendingBalance === 0
  const isBlocked = booking.status === 'blocked'

  const handlePayBalance = () => {
    onUpdateBooking({
      ...booking,
      depositAmount: booking.totalPrice,
      status: 'confirmed',
    })
    onClose()
  }

  const handleConfirmCancel = () => {
    onCancelBooking(booking.id)
    setShowConfirmCancel(false)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border-t sm:border border-neutral-300 shadow-2xl flex flex-col max-h-[90vh] rounded-t-2xl sm:rounded-none overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tirador para vista Bottom Sheet en móvil */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-neutral-50">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black uppercase tracking-tight text-neutral-950">
                {isBlocked ? 'Bloqueo Operativo' : 'Detalle del Turno'}
              </h2>
              {booking.isRecurring && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                  Fijo Semanal
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              {booking.courtName} · {booking.sport}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-200/50 transition-colors"
            aria-label="Cerrar detalle"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Horario y Fecha */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-neutral-600 shrink-0" strokeWidth={2} />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Fecha</span>
                <span className="text-sm font-semibold text-neutral-900">{booking.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-neutral-600 shrink-0" strokeWidth={2} />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Horario</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {booking.startTime} - {booking.endTime} hs
                </span>
              </div>
            </div>
          </div>

          {/* Cliente o Motivo de Bloqueo */}
          {isBlocked ? (
            <div className="p-4 bg-neutral-100 border border-neutral-300 space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-700 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4" strokeWidth={2} />
                <span>Mantenimiento o Bloqueo Interno</span>
              </div>
              <p className="text-sm text-neutral-800 font-medium">{booking.customerName}</p>
              {booking.notes && (
                <p className="text-xs text-neutral-600 mt-2 italic">{booking.notes}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-neutral-200 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                  Titular de la Reserva
                </span>
                <div className="space-y-1">
                  <p className="text-base font-bold text-neutral-950">{booking.customerName}</p>
                  {booking.customerPhone && booking.customerPhone !== '-' && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Phone className="h-3.5 w-3.5 text-neutral-500" strokeWidth={2} />
                      <a
                        href={`tel:${booking.customerPhone}`}
                        className="hover:underline font-mono text-xs"
                      >
                        {booking.customerPhone}
                      </a>
                    </div>
                  )}
                </div>
                {booking.notes && (
                  <p className="text-xs text-neutral-600 border-t border-neutral-100 pt-2">
                    <span className="font-semibold text-neutral-700">Observaciones: </span>
                    {booking.notes}
                  </p>
                )}
              </div>

              {/* Estado Financiero */}
              <div className="border border-neutral-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Estado de Cobro
                  </span>
                  {isFullyPaid ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-sport bg-brand-soft/25 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Abonado Completo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                      <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                      Señado (Saldo Pendiente)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-center">
                  <div className="p-2 bg-neutral-50">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Total</span>
                    <span className="text-sm font-mono font-bold text-neutral-900">
                      ${booking.totalPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="p-2 bg-neutral-50">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Seña</span>
                    <span className="text-sm font-mono font-bold text-neutral-900">
                      ${booking.depositAmount.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div
                    className={`p-2 ${
                      pendingBalance > 0 ? 'bg-amber-50 text-amber-900' : 'bg-neutral-50 text-neutral-500'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold block">Resta Cobrar</span>
                    <span className="text-sm font-mono font-bold">
                      ${pendingBalance.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {pendingBalance > 0 && (
                  <button
                    type="button"
                    onClick={handlePayBalance}
                    className="w-full min-h-[44px] mt-2 px-4 py-2 bg-brand-sport text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-sport-hover transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" strokeWidth={2} />
                    <span>Cobrar Saldo Restante (${pendingBalance.toLocaleString('es-AR')})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Confirmación de Cancelación Destructiva */}
          {showConfirmCancel ? (
            <div className="p-4 bg-red-50 border border-red-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <Trash2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <h4 className="text-xs font-bold uppercase text-red-900 tracking-wider">
                    ¿Confirmar Cancelación del Turno?
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    Esta acción liberará el espacio en la grilla operativa.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmCancel(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 min-h-[36px]"
                >
                  Mantener Turno
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 text-xs font-bold uppercase text-white bg-red-600 hover:bg-red-700 min-h-[44px]"
                >
                  Sí, Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmCancel(true)}
                className="min-h-[44px] px-4 py-2 text-xs font-bold uppercase text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                <span>{isBlocked ? 'Liberar Bloqueo' : 'Cancelar Turno'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-6 py-2.5 text-xs font-bold uppercase text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
