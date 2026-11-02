import React from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  DollarSign,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Wrench,
} from 'lucide-react'
import {
  Sheet,
  SheetHeader,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet'
import type { GridBookingItem } from '@/features/bookings/types'
import { utcToLocalParts } from '@/features/bookings/types/timeline.types'

export interface DemoBookingPreviewSheetProps {
  isOpen: boolean
  onClose: () => void
  booking: GridBookingItem | null
  newSlotParams: {
    courtName: string
    dateStr: string
    timeStr: string
    maxAvailableMinutes?: number
  } | null
}

export const DemoBookingPreviewSheet: React.FC<DemoBookingPreviewSheetProps> = ({
  isOpen,
  onClose,
  booking,
  newSlotParams,
}) => {
  if (!isOpen) return null

  // Calcular datos temporales de la reserva seleccionada si existe
  const bookingTimeInfo = React.useMemo(() => {
    if (!booking) return null
    const startParts = utcToLocalParts(booking.startTimeUtc)
    const endParts = utcToLocalParts(booking.endTimeUtc)
    return {
      dateStr: startParts.dateStr,
      startTimeStr: startParts.timeStr,
      endTimeStr: endParts.timeStr,
    }
  }, [booking])

  const isBlocked = booking?.status === 'blocked'
  const totalPrice = booking?.totalPrice || 0
  const deposit = booking?.depositAmount || 0
  const balance = Math.max(0, totalPrice - deposit)
  const isPaidInFull = !isBlocked && deposit >= totalPrice && totalPrice > 0
  const isPartiallyPaid = !isBlocked && deposit > 0 && balance > 0

  return (
    <Sheet isOpen={isOpen} onClose={onClose} side="right">
      <SheetHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D46211] animate-pulse" />
          <span className="text-xs font-mono text-[#D46211] uppercase tracking-wider font-semibold">
            Demostración en Vivo
          </span>
        </div>
        <h2 className="text-lg font-headline font-bold text-[#F2F3F5] mt-1">
          {booking
            ? isBlocked
              ? 'Bloqueo Operativo'
              : 'Detalle del Turno'
            : 'Reserva Rápida de Turno'}
        </h2>
        <p className="text-xs text-[#9497A1]">
          {booking
            ? 'Vista de gestión operativa y control de saldo'
            : 'Previsualización del flujo de alta sin popups'}
        </p>
      </SheetHeader>

      <SheetBody className="space-y-5">
        {/* Banner informativo de Modo Demo */}
        <div className="rounded-xl bg-[#22242B] border border-[#31343E] p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D46211]/15 text-[#D46211] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#F2F3F5]">Modo Demostración Interactivo</p>
            <p className="text-[11px] text-[#9497A1] mt-0.5 leading-relaxed">
              Estás visualizando la interfaz real con datos simulados. Crea tu cuenta gratuita para
              operar tu club, habilitar señas y enviar confirmaciones automáticas.
            </p>
          </div>
        </div>

        {/* Vista A: Detalle de Turno Existente */}
        {booking && (
          <>
            {/* Estado del Turno */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#111215] border border-[#31343E]">
              <span className="text-xs text-[#9497A1] font-medium">Estado del Turno</span>
              {isBlocked ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22242B] border border-[#31343E] text-xs font-semibold text-[#9497A1]">
                  <Wrench className="w-3.5 h-3.5 text-[#9497A1]" strokeWidth={2} />
                  Mantenimiento
                </span>
              ) : isPaidInFull ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#327357]/20 border border-[#327357]/40 text-xs font-semibold text-[#327357]">
                  <span className="w-2 h-2 rounded-full bg-[#327357]" />
                  Confirmado (100% Pagado)
                </span>
              ) : isPartiallyPaid ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D46211]/20 border border-[#D46211]/40 text-xs font-semibold text-[#D46211]">
                  <span className="w-2 h-2 rounded-full bg-[#D46211]" />
                  Seña Abonada (Saldo en Club)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22242B] border border-[#31343E] text-xs font-semibold text-[#9497A1]">
                  <span className="w-2 h-2 rounded-full bg-[#9497A1]" />
                  Sin Seña Registrada
                </span>
              )}
            </div>

            {/* Datos del Cliente */}
            {!isBlocked && (
              <div className="rounded-xl bg-[#111215] border border-[#31343E] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#9497A1] uppercase tracking-wider font-mono">
                  <User className="w-3.5 h-3.5 text-[#258653]" strokeWidth={2} />
                  <span>Datos del Titular</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#F2F3F5]">{booking.customerName}</p>
                    <p className="text-xs text-[#9497A1] font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" strokeWidth={1.75} />
                      {booking.customerPhone || '+54 9 11 4567-8901'}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#22242B] text-[#9497A1] border border-[#31343E]">
                    Cliente Frecuente
                  </span>
                </div>
              </div>
            )}

            {/* Horario y Cancha */}
            <div className="rounded-xl bg-[#111215] border border-[#31343E] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#9497A1] uppercase tracking-wider font-mono">
                <Clock className="w-3.5 h-3.5 text-[#D46211]" strokeWidth={2} />
                <span>Horario & Pista</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#9497A1] block text-[11px]">Fecha del Turno</span>
                  <span className="font-semibold text-[#F2F3F5] font-mono mt-0.5 block">
                    {bookingTimeInfo?.dateStr}
                  </span>
                </div>
                <div>
                  <span className="text-[#9497A1] block text-[11px]">Franja Horaria</span>
                  <span className="font-semibold text-[#F2F3F5] font-mono mt-0.5 block">
                    {bookingTimeInfo?.startTimeStr} - {bookingTimeInfo?.endTimeStr}
                  </span>
                </div>
                <div>
                  <span className="text-[#9497A1] block text-[11px]">Deporte</span>
                  <span className="font-semibold text-[#F2F3F5] mt-0.5 block">
                    {booking.sportName}
                  </span>
                </div>
                <div>
                  <span className="text-[#9497A1] block text-[11px]">Control GiST</span>
                  <span className="font-semibold text-[#327357] mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                    Sin Solapamiento
                  </span>
                </div>
              </div>
            </div>

            {/* Desglose Financiero */}
            {!isBlocked && (
              <div className="rounded-xl bg-[#111215] border border-[#31343E] p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#9497A1] uppercase tracking-wider font-mono">
                  <DollarSign className="w-3.5 h-3.5 text-[#258653]" strokeWidth={2} />
                  <span>Desglose de Caja</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[#9497A1]">
                    <span>Tarifa Base del Turno</span>
                    <span className="font-mono text-[#F2F3F5] font-semibold">
                      ${totalPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#9497A1]">
                    <span>Seña Cobrada</span>
                    <span className="font-mono text-[#258653] font-semibold">
                      ${deposit.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="border-t border-[#31343E] pt-2 flex justify-between items-center font-bold">
                    <span className="text-[#F2F3F5]">Saldo Pendiente en Sede</span>
                    <span
                      className={`font-mono text-sm ${
                        balance > 0 ? 'text-[#D46211]' : 'text-[#327357]'
                      }`}
                    >
                      ${balance.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Vista B: Nuevo Turno en Slot Libre */}
        {newSlotParams && (
          <div className="rounded-xl bg-[#111215] border border-[#31343E] p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9497A1] uppercase tracking-wider font-mono">
              <Layers className="w-3.5 h-3.5 text-[#D46211]" strokeWidth={2} />
              <span>Slot Libre Seleccionado</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#9497A1] block text-[11px]">Cancha</span>
                <span className="font-semibold text-[#F2F3F5] mt-0.5 block">
                  {newSlotParams.courtName}
                </span>
              </div>
              <div>
                <span className="text-[#9497A1] block text-[11px]">Fecha</span>
                <span className="font-semibold text-[#F2F3F5] font-mono mt-0.5 block">
                  {newSlotParams.dateStr}
                </span>
              </div>
              <div>
                <span className="text-[#9497A1] block text-[11px]">Hora de Inicio</span>
                <span className="font-semibold text-[#F2F3F5] font-mono mt-0.5 block">
                  {newSlotParams.timeStr}
                </span>
              </div>
              <div>
                <span className="text-[#9497A1] block text-[11px]">Disponibilidad</span>
                <span className="font-semibold text-[#327357] mt-0.5 block">
                  {newSlotParams.maxAvailableMinutes
                    ? `${newSlotParams.maxAvailableMinutes} min libres`
                    : 'Franja completa libre'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#9497A1] leading-relaxed pt-2 border-t border-[#31343E]">
              En el sistema de producción, hacer clic en un slot libre despliega el formulario
              Slide-over de alta instantánea, preseleccionando tarifas dinámicas y evitando cualquier
              ventana modal flotante.
            </p>
          </div>
        )}
      </SheetBody>

      <SheetFooter>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-4 rounded-lg bg-[#22242B] hover:bg-[#2d303a] border border-[#31343E] text-xs font-semibold text-[#F2F3F5] transition-colors cursor-pointer"
        >
          Cerrar
        </button>

        <Link
          to="/register"
          className="min-h-[44px] px-6 rounded-lg bg-[#258653] hover:bg-[#1E6E44] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <span>Probar Gratis</span>
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </Link>
      </SheetFooter>
    </Sheet>
  )
}
