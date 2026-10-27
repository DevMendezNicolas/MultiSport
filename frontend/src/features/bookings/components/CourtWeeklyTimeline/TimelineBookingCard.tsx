import React from 'react'
import { AlertCircle, Banknote, CheckCircle2, Phone, Repeat, Wrench } from 'lucide-react'
import {
  calculateSlotLayout,
  type DraggedBookingData,
} from '../../types/timeline.types'
import type { GridBookingItem } from '../../types'

interface TimelineBookingCardProps {
  booking: GridBookingItem
  dateStr: string
  onSelectBooking: (bookingId: string) => void
  onDragStart: (e: React.DragEvent, data: DraggedBookingData) => void
  onDragEnd: () => void
}

export const TimelineBookingCard: React.FC<TimelineBookingCardProps> = ({
  booking,
  dateStr,
  onSelectBooking,
  onDragStart,
  onDragEnd,
}) => {
  const { leftPx, widthPx, durationMinutes, timeRange } = calculateSlotLayout(
    booking.startTimeUtc,
    booking.endTimeUtc
  )

  const isBlocked = booking.status === 'blocked'
  const totalPrice = booking.totalPrice || 0
  const deposit = booking.depositAmount || 0
  const balance = Math.max(0, totalPrice - deposit)
  const isPaidInFull = !isBlocked && deposit >= totalPrice && totalPrice > 0
  const isPartiallyPaid = !isBlocked && deposit > 0 && balance > 0

  // Separación física lateral para que turnos pegados tengan un gutter claro
  const gutterPx = 1.5
  const adjustedLeft = leftPx + gutterPx
  const adjustedWidth = Math.max(28, widthPx - gutterPx * 2)

  // Datos para el payload de arrastre
  const handleDragStartInternal = (e: React.DragEvent) => {
    if (isBlocked) return
    const dragData: DraggedBookingData = {
      bookingId: booking.id,
      courtId: booking.courtId,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      originalDateStr: dateStr,
      originalStartTime: booking.startTimeUtc,
      durationMinutes,
      slotsCount: Math.ceil(durationMinutes / 15),
    }
    onDragStart(e, dragData)
  }

  // Estilos y simbología según estado operativo
  let cardClasses = 'bg-[#22242B] border border-[#31343E] text-[#F2F3F5]'
  let badgeBg = 'bg-[#31343E]'
  let symbolIcon = <AlertCircle className="h-3.5 w-3.5 text-[#9497A1]" strokeWidth={2.5} />
  let statusTooltip = 'Sin Seña / Pendiente'

  if (isBlocked) {
    cardClasses = 'bg-[#17181C] text-[#9497A1] border border-[#31343E]/80 shadow-sm'
    badgeBg = 'bg-[#22242B]'
    symbolIcon = <Wrench className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={2.5} />
    statusTooltip = 'Mantenimiento / Bloqueo Operativo'
  } else if (isPaidInFull) {
    cardClasses = 'bg-[#327357] text-white border border-[#3E8967] shadow-md hover:border-white/40'
    badgeBg = 'bg-[#23583E]'
    symbolIcon = <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
    statusTooltip = 'Pagado Total'
  } else if (isPartiallyPaid) {
    cardClasses = 'bg-[#D46211] text-white border border-[#E57627] shadow-md hover:border-white/40'
    badgeBg = 'bg-[#A24808]'
    symbolIcon = <Banknote className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
    statusTooltip = 'Señado (Saldo pendiente)'
  } else {
    cardClasses = 'bg-[#22242B] text-[#F2F3F5] border-2 border-[#D46211] shadow-md hover:border-white/40'
    badgeBg = 'bg-[#D46211]/20'
    symbolIcon = <AlertCircle className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={2.5} />
    statusTooltip = 'Sin Seña'
  }

  return (
    <div
      style={{
        left: `${adjustedLeft}px`,
        width: `${adjustedWidth}px`,
        ...(isBlocked
          ? {
              backgroundImage:
                'repeating-linear-gradient(45deg, #17181C, #17181C 8px, #22242B 8px, #22242B 16px)',
            }
          : {}),
      }}
      draggable={!isBlocked}
      onDragStart={handleDragStartInternal}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation()
        if (!isBlocked) {
          onSelectBooking(booking.id)
        }
      }}
      className={`absolute top-1.5 bottom-1.5 z-10 rounded-xl p-2.5 flex flex-col justify-between transition-all select-none overflow-hidden ${
        isBlocked
          ? 'cursor-not-allowed'
          : 'cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:shadow-lg'
      } ${cardClasses}`}
      title={
        isBlocked
          ? `Bloqueo: ${booking.notes || 'Mantenimiento'} (${timeRange})`
          : `${booking.customerName} (${timeRange}) - ${statusTooltip}`
      }
    >
      {/* Línea Superior: Simbología de estado y Rango Horario Ampliado */}
      <div className="flex items-center justify-between gap-1.5 shrink-0">
        <div
          className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 shadow-xs ${badgeBg}`}
          title={statusTooltip}
        >
          {symbolIcon}
        </div>
        <span className="font-mono text-xs font-bold text-white tracking-tight shrink-0 drop-shadow-xs">
          {timeRange}
        </span>
      </div>

      {/* Centro: Nombre del Titular o Razón de Bloqueo */}
      <div className="py-1 min-w-0">
        <div className="font-headline text-xs sm:text-sm font-bold text-white truncate leading-tight">
          {isBlocked ? booking.notes || 'Bloqueo técnico' : booking.customerName}
        </div>
        {!isBlocked && booking.customerPhone && (
          <div className="flex items-center gap-1.5 text-xs text-white/85 font-mono truncate mt-0.5">
            <Phone className="h-3 w-3 shrink-0 opacity-80" strokeWidth={2} />
            <span className="truncate">{booking.customerPhone}</span>
          </div>
        )}
      </div>

      {/* Línea Inferior: Disciplina Deportiva y Saldo financiero */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-black/15 text-white shrink-0">
        <span className="truncate text-[11px] font-semibold opacity-90">
          {booking.sportName || 'Turno'}
        </span>
        {!isBlocked && (
          <div className="flex items-center gap-1 font-mono font-bold text-xs shrink-0 pl-1">
            <span>
              {isPaidInFull
                ? `$${totalPrice.toLocaleString('es-AR')}`
                : isPartiallyPaid
                ? `Resta $${balance.toLocaleString('es-AR')}`
                : `Debe $${totalPrice.toLocaleString('es-AR')}`}
            </span>
            {booking.isRecurring && (
              <span title="Turno fijo recurrente">
                <Repeat className="h-3 w-3 text-white/90 shrink-0 ml-0.5" strokeWidth={2} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
