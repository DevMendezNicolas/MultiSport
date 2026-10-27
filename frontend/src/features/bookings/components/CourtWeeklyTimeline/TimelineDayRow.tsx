import React from 'react'
import {
  TIMELINE_CONFIG,
  computeDayTimelineGaps,
  getMinSportDuration,
  slotIndexToTime,
  type DraggedBookingData,
  type WeeklyDayData,
} from '../../types/timeline.types'
import type { GridSportItem } from '../../types'
import { TimelineBookingCard } from './TimelineBookingCard'

interface TimelineDayRowProps {
  dayData: WeeklyDayData
  dayIndex: number
  isHoveredRow: boolean
  hoverSlotIndex: number | null
  hoverTimeFormatted: string | null
  isDragging: boolean
  draggedDurationMinutes?: number
  sports?: GridSportItem[]
  onSelectBooking: (bookingId: string) => void
  onSlotClick?: (dateStr: string, timeStr: string, maxAvailableMinutes: number) => void
  onDragStart: (e: React.DragEvent, data: DraggedBookingData) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>, dayIndex: number, dateStr: string) => void
  onDrop: (e: React.DragEvent) => void
}

export const TimelineDayRow: React.FC<TimelineDayRowProps> = ({
  dayData,
  dayIndex,
  isHoveredRow,
  hoverSlotIndex,
  hoverTimeFormatted,
  isDragging,
  draggedDurationMinutes = 60,
  sports,
  onSelectBooking,
  onSlotClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const ghostSlotsCount = Math.ceil(draggedDurationMinutes / 15)
  const ghostWidthPx = ghostSlotsCount * TIMELINE_CONFIG.slotWidthPx

  // Calcular duración mínima de deportes y mapa de huecos
  const minSportDuration = React.useMemo(() => {
    return getMinSportDuration(sports)
  }, [sports])

  const { occupiedSlots, gaps, insufficientGaps } = React.useMemo(() => {
    return computeDayTimelineGaps(dayData.bookings, minSportDuration)
  }, [dayData.bookings, minSportDuration])

  return (
    <div
      className={`flex h-28 relative group border-b border-[#31343E]/40 transition-colors ${
        dayData.isToday
          ? 'bg-[#17181C]/90'
          : dayIndex % 2 === 0
          ? 'bg-[#17181C]/60 hover:bg-[#22242B]/40'
          : 'bg-[#141518]/60 hover:bg-[#22242B]/40'
      }`}
    >
      {/* Columna Lateral Fija del Día (180px) */}
      <div
        style={{ width: `${TIMELINE_CONFIG.dayColWidthPx}px` }}
        className={`shrink-0 sticky left-0 z-20 p-3.5 flex flex-col justify-between border-r border-[#31343E] shadow-md transition-colors ${
          dayData.isToday
            ? 'bg-[#17181C] border-l-4 border-l-[#D46211]'
            : 'bg-[#17181C] group-hover:bg-[#22242B]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-headline text-sm font-bold text-[#F2F3F5]">
              {dayData.dayName} {dayData.dayNumber}
            </span>
            {dayData.isToday && (
              <span className="text-[10px] font-black uppercase bg-[#D46211] text-white px-1.5 py-0.2 rounded shadow-sm">
                HOY
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#9497A1]">
          <span>{dayData.bookingsCount} {dayData.bookingsCount === 1 ? 'Turno' : 'Turnos'}</span>
          <span className="text-[#327357] font-bold">
            ${dayData.totalIncome.toLocaleString('es-AR')}
          </span>
        </div>
      </div>

      {/* Área Interactiva de 64 Slots de 15 Minutos */}
      <div
        className="relative flex-1 h-full"
        onDragOver={(e) => onDragOver(e, dayIndex, dayData.dateStr)}
        onDrop={onDrop}
      >
        {/* Guías de fondo para las 64 columnas */}
        <div className="absolute inset-0 grid grid-cols-[repeat(64,36px)] pointer-events-none divide-x divide-[#31343E]/20">
          {Array.from({ length: TIMELINE_CONFIG.totalSlots }, (_, i) => (
            <div
              key={i}
              className={`h-full ${i % 4 === 0 ? 'bg-[#31343E]/10' : ''}`}
            />
          ))}
        </div>

        {/* Franjas Insuficientes Bloqueadas (Menores a cualquier duración mínima de deporte) */}
        {!isDragging &&
          insufficientGaps.map((gap, i) => (
            <div
              key={`insufficient-gap-${gap.startSlot}-${i}`}
              style={{
                left: `${gap.leftPx}px`,
                width: `${gap.widthPx}px`,
                backgroundImage:
                  'repeating-linear-gradient(45deg, #17181C, #17181C 5px, #22242B 5px, #22242B 10px)',
              }}
              className="absolute top-1 bottom-1 z-10 rounded-lg border border-[#31343E]/60 flex items-center justify-center cursor-not-allowed select-none text-[10px] font-bold text-[#9497A1] overflow-hidden shadow-inner"
              title={`Franja de ${gap.availableMinutes} min insuficiente. No admite turnos (mínimo ${minSportDuration} min).`}
              onClick={(e) => e.stopPropagation()}
            >
              {gap.widthPx >= 72 && (
                <span className="truncate px-1.5 bg-[#17181C]/90 py-0.5 rounded border border-[#31343E]/50 text-[10px] text-[#9497A1] font-mono">
                  Sin cupo ({gap.availableMinutes}m)
                </span>
              )}
            </div>
          ))}

        {/* Grilla Interactiva de 64 Slots (Hover y Click para Nuevo Turno) */}
        {!isDragging && (
          <div className="absolute inset-0 grid grid-cols-[repeat(64,36px)] z-0">
            {Array.from({ length: TIMELINE_CONFIG.totalSlots }, (_, s) => {
              const isOccupied = occupiedSlots[s]
              const parentGap = gaps.find(
                (g) => s >= g.startSlot && s < g.startSlot + g.slotsCount
              )
              const availableMinutesFromS = parentGap
                ? (parentGap.startSlot + parentGap.slotsCount - s) * 15
                : 0
              const isInsufficientGap = parentGap?.isInsufficient || false
              const canBook = !isOccupied && !isInsufficientGap && availableMinutesFromS >= minSportDuration
              const timeStr = slotIndexToTime(s)

              if (isOccupied || isInsufficientGap) {
                return (
                  <div
                    key={`slot-${s}`}
                    className="h-full select-none pointer-events-none"
                  />
                )
              }

              if (!canBook) {
                // Cola insuficiente al final de un hueco disponible
                return (
                  <div
                    key={`slot-${s}`}
                    className="h-full cursor-not-allowed select-none"
                    title={`Tiempo restante (${availableMinutesFromS} min) menor al mínimo requerido (${minSportDuration} min)`}
                  />
                )
              }

              return (
                <div
                  key={`slot-${s}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSlotClick?.(dayData.dateStr, timeStr, availableMinutesFromS)
                  }}
                  className="h-full transition-colors hover:bg-[#D46211]/20 cursor-pointer group/slot relative select-none"
                  title={`Crear turno: ${dayData.dayName} ${timeStr} hs (${availableMinutesFromS} min disponibles)`}
                >
                  {/* Tooltip / Indicador sutil de horario al pasar el mouse */}
                  <div className="hidden group-hover/slot:flex absolute -top-7 left-1/2 -translate-x-1/2 z-30 bg-[#D46211] text-white text-[10px] font-mono font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap items-center gap-1 pointer-events-none">
                    <span>{timeStr} +</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Ghost de predicción al arrastrar */}
        {isDragging && isHoveredRow && hoverSlotIndex !== null && (
          <div
            style={{
              left: `${hoverSlotIndex * TIMELINE_CONFIG.slotWidthPx}px`,
              width: `${ghostWidthPx}px`,
            }}
            className="absolute top-2 bottom-2 z-20 rounded-lg border-2 border-dashed border-[#D46211] bg-[#D46211]/20 pointer-events-none flex items-center justify-center text-xs font-mono font-bold text-white shadow-lg animate-pulse"
          >
            <span>{hoverTimeFormatted}</span>
          </div>
        )}

        {/* Tarjetas de Turnos */}
        {dayData.bookings.map((booking) => (
          <TimelineBookingCard
            key={booking.id}
            booking={booking}
            dateStr={dayData.dateStr}
            onSelectBooking={onSelectBooking}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  )
}
