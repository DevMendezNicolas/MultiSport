import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { CourtSelectorBar } from '../components/CourtSelectorBar'
import { TimelineCommandBar } from '../components/TimelineCommandBar'
import { CourtWeeklyTimeline } from '../components/CourtWeeklyTimeline/CourtWeeklyTimeline'
import { BookingDetailSheet } from '../components/BookingDetailSheet'
import { NewBookingSheet } from '../components/NewBookingSheet'
import { useCourtWeeklyGrid } from '../hooks/useCourtWeeklyGrid'
import { useBookingDragAndDrop } from '../hooks/useBookingDragAndDrop'
import { useRescheduleBooking, useCancelBooking } from '../hooks/useBookings'
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
    isLoading,
  } = useCourtWeeklyGrid(selectedCourtId, startDateStr)

  // Hook de Drag & Drop y Snapping
  const dragHook = useBookingDragAndDrop()

  // Mutaciones de Turnos
  const rescheduleBookingMutation = useRescheduleBooking()
  const cancelBookingMutation = useCancelBooking()

  // Estado para el Slide-Over Sheet de detalle
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleSelectBooking = (bookingId: string) => {
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

  // Estado para el modal de confirmación al soltar en el tacho de basura
  const [bookingToCancel, setBookingToCancel] = useState<DraggedBookingData | null>(null)
  const [showTrashCancelDialog, setShowTrashCancelDialog] = useState(false)
  const [trashCancelReason, setTrashCancelReason] = useState('')
  const [trashRefundDeposit, setTrashRefundDeposit] = useState(false)
  const [trashRefundMethod, setTrashRefundMethod] = useState<'cash' | 'transfer' | 'cash'>('cash')

  // Reprogramación por arrastre en la grilla
  const handleReschedule = (
    bookingId: string,
    newStartTimeUtc: string,
    newEndTimeUtc: string
  ) => {
    if (!activeCourt) return
    rescheduleBookingMutation.mutate({
      id: bookingId,
      payload: {
        courtId: activeCourt.courtId,
        newStartTimeUtc,
        newEndTimeUtc,
      },
    })
  }

  // Disparar anulación tras soltar en la papelera flotante
  const handleTriggerCancel = (dragged: DraggedBookingData) => {
    setBookingToCancel(dragged)
    setTrashCancelReason('Cancelado por arrastre a papelera')
    setTrashRefundDeposit(false)
    setShowTrashCancelDialog(true)
  }

  const handleConfirmTrashCancel = async () => {
    if (!bookingToCancel) return

    await cancelBookingMutation.mutateAsync({
      id: bookingToCancel.bookingId,
      payload: {
        reason: trashCancelReason.trim() || 'Cancelado desde la papelera de turnos',
        refundDeposit: trashRefundDeposit,
        refundMethod: trashRefundDeposit ? trashRefundMethod : null,
      },
    })

    setShowTrashCancelDialog(false)
    setBookingToCancel(null)
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
          dragHook={dragHook}
          onSelectBooking={handleSelectBooking}
          onSlotClick={handleOpenNewBookingFromSlot}
          onReschedule={handleReschedule}
          onTriggerCancel={handleTriggerCancel}
        />
      )}

      {/* 4. Slide-over Sheet Lateral de Operaciones y Caja */}
      <BookingDetailSheet
        bookingId={selectedBookingId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedBookingId(null)
        }}
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

      {/* 6. Diálogo Centrado para Confirmar Cancelación por Papelera */}
      <AlertDialog
        isOpen={showTrashCancelDialog}
        onClose={() => {
          setShowTrashCancelDialog(false)
          setBookingToCancel(null)
        }}
        onConfirm={handleConfirmTrashCancel}
        isLoading={cancelBookingMutation.isPending}
        title="Cancelar Reserva (Papelera)"
        confirmText="Confirmar Anulación"
        isDestructive={true}
        description={
          <div className="space-y-3">
            <p className="text-sm text-[#F2F3F5]">
              Ha arrastrado a la papelera el turno de{' '}
              <strong className="text-white">
                {bookingToCancel?.customerName}
              </strong>
              . ¿Desea liberar y anular este horario?
            </p>

            <div className="p-3 rounded-xl bg-[#22242B] border border-[#31343E] text-xs text-[#F2F3F5] space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trashRefundDeposit"
                  checked={trashRefundDeposit}
                  onChange={(e) => setTrashRefundDeposit(e.target.checked)}
                  className="h-4 w-4 text-[#D46211] rounded border-[#31343E] cursor-pointer"
                />
                <label htmlFor="trashRefundDeposit" className="font-semibold cursor-pointer">
                  Devolver / Registrar reembolso de seña
                </label>
              </div>

              {trashRefundDeposit && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-[#9497A1]">Método de devolución:</span>
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer text-[#F2F3F5]">
                    <input
                      type="radio"
                      name="trashRefundMethod"
                      checked={trashRefundMethod === 'cash'}
                      onChange={() => setTrashRefundMethod('cash')}
                    />
                    Efectivo
                  </label>
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer text-[#F2F3F5]">
                    <input
                      type="radio"
                      name="trashRefundMethod"
                      checked={trashRefundMethod === 'transfer'}
                      onChange={() => setTrashRefundMethod('transfer')}
                    />
                    Transferencia
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9497A1] mb-1">
                Motivo de la cancelación:
              </label>
              <input
                type="text"
                value={trashCancelReason}
                onChange={(e) => setTrashCancelReason(e.target.value)}
                placeholder="Ej: Desistimiento del cliente, lluvia, etc."
                className="w-full text-base sm:text-sm rounded-lg border border-[#31343E] bg-[#17181C] px-3 py-2 text-[#F2F3F5] focus:border-red-600 outline-none"
              />
            </div>
          </div>
        }
      />
    </div>
  )
}
