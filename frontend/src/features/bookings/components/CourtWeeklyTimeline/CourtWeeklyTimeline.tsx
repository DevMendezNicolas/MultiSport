import React from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { TIMELINE_CONFIG, type DraggedBookingData, type WeeklyDayData } from '../../types/timeline.types'
import type { GridSportItem } from '../../types'
import { TimelineHeaderAxis } from './TimelineHeaderAxis'
import { TimelineDayRow } from './TimelineDayRow'
import { FloatingTrashZone } from './FloatingTrashZone'
import type { useBookingDragAndDrop } from '../../hooks/useBookingDragAndDrop'

interface CourtWeeklyTimelineProps {
  daysData: WeeklyDayData[]
  courtName: string
  surfaceName?: string
  sports?: GridSportItem[]
  dragHook: ReturnType<typeof useBookingDragAndDrop>
  onSelectBooking: (bookingId: string) => void
  onSlotClick?: (dateStr: string, timeStr: string, maxAvailableMinutes: number) => void
  onReschedule: (bookingId: string, newStartTimeUtc: string, newEndTimeUtc: string) => void
  onTriggerCancel: (booking: DraggedBookingData) => void
}

export const CourtWeeklyTimeline: React.FC<CourtWeeklyTimelineProps> = ({
  daysData,
  courtName,
  surfaceName,
  sports,
  dragHook,
  onSelectBooking,
  onSlotClick,
  onReschedule,
  onTriggerCancel,
}) => {
  const {
    isDragging,
    draggedBooking,
    isOverTrash,
    hoverSlot,
    handleDragStart,
    handleDragEnd,
    handleTimelineDragOver,
    handleTimelineDrop,
    handleTrashDragEnter,
    handleTrashDragLeave,
    handleTrashDragOver,
    handleTrashDrop,
  } = dragHook

  return (
    <div className="bg-[#22242B] rounded-2xl border border-[#31343E] shadow-xl overflow-hidden flex flex-col relative">
      {/* Tira Informativa y Guía Operativa Superior */}
      <div className="px-4 py-2.5 bg-[#17181C] border-b border-[#31343E] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#9497A1]">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-[#D46211] shrink-0" strokeWidth={1.75} />
          <span>
            Arrastre turnos horizontalmente (cambio de hora en 15m) o verticalmente (cambio de día). Haga click en cualquier turno para abrir operaciones de caja.
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-[#327357] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#327357] animate-pulse" />
            <span>Tiempo Real</span>
          </div>
          <span className="text-[#F2F3F5] font-medium">
            {courtName} {surfaceName ? `• ${surfaceName}` : ''}
          </span>
        </div>
      </div>

      {/* Contenedor de Scroll Horizontal Contenido (no-scrollbar) */}
      <div
        id="timeline-matrix-scroll"
        className="overflow-x-auto no-scrollbar relative w-full"
      >
        <div
          style={{ minWidth: `${TIMELINE_CONFIG.minWidthPx}px` }}
          className="flex flex-col bg-[#17181C]"
        >
          {/* Eje Horario Superior Fijo */}
          <TimelineHeaderAxis />

          {/* Cuerpo Matricial: 7 Filas de Días */}
          <div className="flex flex-col relative divide-y divide-[#31343E]/40">
            {daysData.map((day, idx) => (
              <TimelineDayRow
                key={day.dateStr}
                dayData={day}
                dayIndex={idx}
                isHoveredRow={hoverSlot?.dayIndex === idx}
                hoverSlotIndex={hoverSlot?.dayIndex === idx ? hoverSlot.slotIndex : null}
                hoverTimeFormatted={hoverSlot?.dayIndex === idx ? hoverSlot.timeFormatted : null}
                isDragging={isDragging}
                draggedDurationMinutes={draggedBooking?.durationMinutes}
                sports={sports}
                onSelectBooking={onSelectBooking}
                onSlotClick={onSlotClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleTimelineDragOver}
                onDrop={(e) => handleTimelineDrop(e, onReschedule)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Zona de Papelera Flotante al arrastrar */}
      <FloatingTrashZone
        isDragging={isDragging}
        isOverTrash={isOverTrash}
        onDragEnter={handleTrashDragEnter}
        onDragLeave={handleTrashDragLeave}
        onDragOver={handleTrashDragOver}
        onDrop={(e) => handleTrashDrop(e, onTriggerCancel)}
      />
    </div>
  )
}
