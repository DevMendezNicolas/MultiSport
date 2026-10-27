import { useState, useCallback } from 'react'
import {
  TIMELINE_CONFIG,
  slotIndexToTime,
  localToUtcIso,
  type DraggedBookingData,
} from '../types/timeline.types'

export interface HoverSlotState {
  dayIndex: number
  slotIndex: number
  dateStr: string
  timeFormatted: string
}

export const useBookingDragAndDrop = () => {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedBooking, setDraggedBooking] = useState<DraggedBookingData | null>(null)
  const [isOverTrash, setIsOverTrash] = useState(false)
  const [hoverSlot, setHoverSlot] = useState<HoverSlotState | null>(null)

  // Iniciar arrastre de un turno
  const handleDragStart = useCallback(
    (e: React.DragEvent, bookingData: DraggedBookingData) => {
      setIsDragging(true)
      setDraggedBooking(bookingData)
      e.dataTransfer.setData('application/json', JSON.stringify(bookingData))
      e.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  // Finalizar arrastre
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setDraggedBooking(null)
    setIsOverTrash(false)
    setHoverSlot(null)
  }, [])

  // Movimiento sobre la grilla (cálculo de snapping en X e Y)
  const handleTimelineDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dayIndex: number, dateStr: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'

      // Coordenadas relativas a la fila de slots (excluyendo la columna de día de 180px)
      const rect = e.currentTarget.getBoundingClientRect()
      const relativeX = Math.max(0, e.clientX - rect.left)

      // Snap a bloques de 36px (15 minutos)
      const rawSlotIndex = Math.floor(relativeX / TIMELINE_CONFIG.slotWidthPx)
      const slotIndex = Math.max(0, Math.min(TIMELINE_CONFIG.totalSlots - 1, rawSlotIndex))
      const timeFormatted = slotIndexToTime(slotIndex)

      setHoverSlot({
        dayIndex,
        slotIndex,
        dateStr,
        timeFormatted,
      })
    },
    []
  )

  // Soltar en la grilla para reprogramar
  const handleTimelineDrop = useCallback(
    (
      e: React.DragEvent,
      onReschedule: (
        bookingId: string,
        newStartTimeUtc: string,
        newEndTimeUtc: string
      ) => void
    ) => {
      e.preventDefault()

      if (!draggedBooking || !hoverSlot) {
        handleDragEnd()
        return
      }

      const { dateStr, timeFormatted } = hoverSlot
      const startIso = localToUtcIso(dateStr, timeFormatted)
      const endIso = new Date(
        new Date(startIso).getTime() + draggedBooking.durationMinutes * 60 * 1000
      ).toISOString()

      onReschedule(draggedBooking.bookingId, startIso, endIso)
      handleDragEnd()
    },
    [draggedBooking, hoverSlot, handleDragEnd]
  )

  // Interacción sobre la zona de papelera
  const handleTrashDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsOverTrash(true)
  }, [])

  const handleTrashDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsOverTrash(false)
  }, [])

  const handleTrashDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsOverTrash(true)
  }, [])

  const handleTrashDrop = useCallback(
    (e: React.DragEvent, onTriggerCancel: (booking: DraggedBookingData) => void) => {
      e.preventDefault()
      if (draggedBooking) {
        onTriggerCancel(draggedBooking)
      }
      handleDragEnd()
    },
    [draggedBooking, handleDragEnd]
  )

  return {
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
  }
}
