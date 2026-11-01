import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { CourtSelectorBar } from '../components/CourtSelectorBar'
import { TimelineCommandBar } from '../components/TimelineCommandBar'
import { CourtWeeklyTimeline } from '../components/CourtWeeklyTimeline/CourtWeeklyTimeline'
import { BookingDetailSheet } from '../components/BookingDetailSheet'
import { NewBookingSheet } from '../components/NewBookingSheet'
import { useCourtWeeklyGrid } from '../hooks/useCourtWeeklyGrid'
import { useBookingDragAndDrop } from '../hooks/useBookingDragAndDrop'
import { useRescheduleBooking, useUpdateBlock } from '../hooks/useBookings'
import {
  formatLocalDate,
  getTodayLocalDateStr,
  type DraggedBookingData,
} from '../types/timeline.types'

export const BookingsManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const courtIdParam = searchParams.get('courtId')

  // Fecha base para la vista de 7 días (por defecto hoy en YYYY-MM-DD local)
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    return getTodayLocalDateStr()
  })

  // Cancha activa seleccionada
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(courtIdParam)

  useEffect(() => {
    if (courtIdParam) {
      setSelectedCourtId(courtIdParam)
    }
  }, [courtIdParam])

  const handleSelectCourt = (courtId: string) => {
    setSelectedCourtId(courtId)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('courtId', courtId)
    setSearchParams(nextParams)
  }

  // Navegación de Semanas (saltos de 7 días)
  const handlePrevWeek = () => {
    const [y, m, d] = startDateStr.split('-').map(Number)
    const current = new Date(y, m - 1, d)
    current.setDate(current.getDate() - 7)
    setStartDateStr(formatLocalDate(current))
  }

  const handleNextWeek = () => {
    const [y, m, d] = startDateStr.split('-').map(Number)
    const current = new Date(y, m - 1, d)
    current.setDate(current.getDate() + 7)
    setStartDateStr(formatLocalDate(current))
  }

  const handleGoToToday = () => {
    setStartDateStr(getTodayLocalDateStr())
  }

  // Consultar matriz semanal para la cancha activa
  const {
    daysData,
    activeCourt,
    allCourts,
    weeklyMetrics,
    timelineBounds,
    isLoading,
  } = useCourtWeeklyGrid(selectedCourtId, startDateStr)

  // Hook de Drag & Drop y Snapping parametrizado al eje dinámico de la cancha
  const dragHook = useBookingDragAndDrop(timelineBounds.startHour, timelineBounds.totalSlots)

  // Mutaciones de Turnos y Bloqueos
  const rescheduleBookingMutation = useRescheduleBooking()
  const updateBlockMutation = useUpdateBlock()

  // Estado para el Slide-Over Sheet de detalle (y apertura en modo confirmación inline al arrastrar a papelera)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [initialConfirmCancel, setInitialConfirmCancel] = useState(false)

  const handleSelectBooking = (bookingId: string) => {
    setInitialConfirmCancel(false)
    setSelectedBookingId(bookingId)
    setIsDetailOpen(true)
  }

  // Estado para el Sheet de Nuevo Turno y parámetros preseleccionados
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [newBookingParams, setNewBookingParams] = useState<{
    date: string
    timeSlot: string
    maxAvailableMinutes?: number
  } | null>(null)

  const handleOpenNewBookingFromSlot = (
    dateStr: string,
    timeStr: string,
    maxAvailableMinutes: number
  ) => {
    setNewBookingParams({
      date: dateStr,
      timeSlot: timeStr,
      maxAvailableMinutes,
    })
    setIsNewBookingOpen(true)
  }

  const handleOpenNewBookingDefault = () => {
    setNewBookingParams(null)
    setIsNewBookingOpen(true)
  }

  // Reprogramación por arrastre en la grilla (soporta tanto turnos como bloqueos operativos)
  const handleReschedule = (
    dragged: DraggedBookingData,
    newStartTimeUtc: string,
    newEndTimeUtc: string
  ) => {
    if (!activeCourt) return

    if (dragged.isBlocked) {
      updateBlockMutation.mutate({
        id: dragged.bookingId,
        payload: {
          courtId: activeCourt.courtId,
          startTimeUtc: newStartTimeUtc,
          endTimeUtc: newEndTimeUtc,
          reason: (dragged.notes && dragged.notes.trim()) || 'Bloqueo Operativo',
        },
      })
      return
    }

    rescheduleBookingMutation.mutate({
      id: dragged.bookingId,
      payload: {
        courtId: activeCourt.courtId,
        newStartTimeUtc,
        newEndTimeUtc,
      },
    })
  }

  // Disparar confirmación inline en el panel lateral tras soltar en la papelera flotante (Zero-Popup Policy)
  const handleTriggerCancel = (dragged: DraggedBookingData) => {
    setInitialConfirmCancel(true)
    setSelectedBookingId(dragged.bookingId)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex flex-col min-h-full bg-[#17181C] text-[#F2F3F5] p-4 sm:p-6 lg:p-8 space-y-6 select-none pb-24">
      {/* 1. Barra de Selección de Canchas & KPIs */}
      <CourtSelectorBar
        courts={allCourts}
        activeCourtId={activeCourt?.courtId || null}
        weeklyOccupancy={weeklyMetrics.occupancyPercentage}
        weeklyProjectedIncome={weeklyMetrics.totalIncome}
        onSelectCourt={handleSelectCourt}
      />

      {/* 2. Barra de Comandos: Semanas, Hoy, Leyenda y Botón Nuevo */}
      <TimelineCommandBar
        startDateStr={startDateStr}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onGoToToday={handleGoToToday}
        onOpenNewBooking={handleOpenNewBookingDefault}
      />

      {/* 3. Matriz Timeline 2D de 15 Minutos */}
      {isLoading && !daysData.length ? (
        <div className="bg-[#22242B] rounded-2xl p-6 border border-[#31343E] space-y-4">
          <Skeleton className="h-10 w-full bg-[#17181C]" />
          <Skeleton className="h-24 w-full bg-[#17181C]" />
          <Skeleton className="h-24 w-full bg-[#17181C]" />
          <Skeleton className="h-24 w-full bg-[#17181C]" />
        </div>
      ) : (
        <CourtWeeklyTimeline
          daysData={daysData}
          courtName={activeCourt?.courtName || 'Cancha'}
          surfaceName={activeCourt?.surface}
          sports={activeCourt?.sports}
          operatingWindows={activeCourt?.operatingWindows}
          timelineBounds={timelineBounds}
          dragHook={dragHook}
          onSelectBooking={handleSelectBooking}
          onSlotClick={handleOpenNewBookingFromSlot}
          onReschedule={handleReschedule}
          onTriggerCancel={handleTriggerCancel}
        />
      )}

      {/* 4. Slide-over Sheet Lateral de Operaciones y Caja (con Confirmación Inline de Baja) */}
      <BookingDetailSheet
        bookingId={selectedBookingId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedBookingId(null)
          setInitialConfirmCancel(false)
        }}
        courts={allCourts}
        initialConfirmCancel={initialConfirmCancel}
      />

      {/* 5. Sheet para Alta de Nuevo Turno */}
      <NewBookingSheet
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false)
          setNewBookingParams(null)
        }}
        courts={allCourts}
        defaultCourtId={activeCourt?.courtId}
        defaultDate={newBookingParams?.date || startDateStr}
        defaultTimeSlot={newBookingParams?.timeSlot || '18:00'}
        maxAvailableMinutes={newBookingParams?.maxAvailableMinutes}
      />
    </div>
  )
}
