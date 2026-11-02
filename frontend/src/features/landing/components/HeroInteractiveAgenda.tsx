import React, { useState, useMemo, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import { CourtSelectorBar } from '@/features/bookings/components/CourtSelectorBar'
import { TimelineCommandBar } from '@/features/bookings/components/TimelineCommandBar'
import { CourtWeeklyTimeline } from '@/features/bookings/components/CourtWeeklyTimeline/CourtWeeklyTimeline'
import { useBookingDragAndDrop } from '@/features/bookings/hooks/useBookingDragAndDrop'
import {
  computeCourtDynamicHourBounds,
  formatLocalDate,
  getTodayLocalDateStr,
  type DraggedBookingData,
} from '@/features/bookings/types/timeline.types'
import type { GridBookingItem } from '@/features/bookings/types'
import {
  DEMO_COURTS,
  generateAllDemoBookings,
  buildWeeklyDaysData,
} from '../utils/demoAgendaData'
import { DemoBookingPreviewSheet } from './DemoBookingPreviewSheet'

interface HeroInteractiveAgendaProps {
  onOpenDemo?: () => void
}

export const HeroInteractiveAgenda: React.FC<HeroInteractiveAgendaProps> = () => {
  // Fecha base para la vista de 7 días (por defecto hoy en YYYY-MM-DD local)
  const [startDateStr, setStartDateStr] = useState<string>(() => getTodayLocalDateStr())

  // Cancha activa seleccionada
  const [activeCourtId, setActiveCourtId] = useState<string>(DEMO_COURTS[0].courtId)

  // Estado local en memoria de reservas por cancha (Sandbox React)
  const [bookingsByCourt, setBookingsByCourt] = useState<Record<string, GridBookingItem[]>>(() =>
    generateAllDemoBookings(startDateStr)
  )

  // Indicador de interacción para el label sutil "Modo Demo: cambios no persistidos"
  const [hasInteracted, setHasInteracted] = useState(false)

  // Estados del Sheet de previsualización de marketing
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<GridBookingItem | null>(null)
  const [newSlotParams, setNewSlotParams] = useState<{
    courtName: string
    dateStr: string
    timeStr: string
    maxAvailableMinutes?: number
  } | null>(null)

  // Cancha actualmente seleccionada
  const activeCourt = useMemo(() => {
    return DEMO_COURTS.find((c) => c.courtId === activeCourtId) || DEMO_COURTS[0]
  }, [activeCourtId])

  // Turnos actuales de la cancha activa
  const activeCourtBookings = useMemo(() => {
    return bookingsByCourt[activeCourtId] || []
  }, [bookingsByCourt, activeCourtId])

  // Límite horario dinámico de la cancha activa
  const timelineBounds = useMemo(() => {
    return computeCourtDynamicHourBounds(activeCourt.operatingWindows, activeCourtBookings)
  }, [activeCourt, activeCourtBookings])

  // Hook de Drag & Drop para snapping continuo sobre los slots
  const dragHook = useBookingDragAndDrop(timelineBounds.startHour, timelineBounds.totalSlots)

  // Días de la semana calculados con los turnos de la cancha
  const weeklyDaysData = useMemo(() => {
    return buildWeeklyDaysData(startDateStr, activeCourt, activeCourtBookings)
  }, [startDateStr, activeCourt, activeCourtBookings])

  // Métricas calculadas en vivo para el selector y KPIs
  const { weeklyOccupancy, weeklyProjectedIncome, todayOccupancy, todayDeposits } = useMemo(() => {
    const totalWeeklyIncome = activeCourtBookings.reduce((sum, b) => {
      if (b.status === 'blocked') return sum
      return sum + (b.totalPrice || 0)
    }, 0)

    // Ocupación semanal aproximada (turnos vs capacidad de 16h * 7 días = 112h)
    const nonBlockedCount = activeCourtBookings.filter((b) => b.status !== 'blocked').length
    const calculatedOccupancy = Math.min(98, Math.max(45, Math.round((nonBlockedCount / 42) * 100)))

    // Métricas del día de hoy (índice 0)
    const todayData = weeklyDaysData[0]
    const todayBookings = todayData ? todayData.bookings : []
    const todayDep = todayBookings.reduce((sum, b) => sum + (b.depositAmount || 0), 0)
    const todayOcc = Math.min(95, Math.max(60, Math.round((todayBookings.length / 8) * 100)))

    return {
      weeklyOccupancy: calculatedOccupancy,
      weeklyProjectedIncome: totalWeeklyIncome,
      todayOccupancy: todayOcc,
      todayDeposits: todayDep,
    }
  }, [activeCourtBookings, weeklyDaysData])

  // Navegación de Semanas
  const handlePrevWeek = useCallback(() => {
    const [y, m, d] = startDateStr.split('-').map(Number)
    const current = new Date(y, m - 1, d)
    current.setDate(current.getDate() - 7)
    const nextDate = formatLocalDate(current)
    setStartDateStr(nextDate)
    setBookingsByCourt(generateAllDemoBookings(nextDate))
    setHasInteracted(false)
  }, [startDateStr])

  const handleNextWeek = useCallback(() => {
    const [y, m, d] = startDateStr.split('-').map(Number)
    const current = new Date(y, m - 1, d)
    current.setDate(current.getDate() + 7)
    const nextDate = formatLocalDate(current)
    setStartDateStr(nextDate)
    setBookingsByCourt(generateAllDemoBookings(nextDate))
    setHasInteracted(false)
  }, [startDateStr])

  const handleGoToToday = useCallback(() => {
    const today = getTodayLocalDateStr()
    setStartDateStr(today)
    setBookingsByCourt(generateAllDemoBookings(today))
    setHasInteracted(false)
  }, [])

  // Restablecer el estado inicial de la demo
  const handleResetDemo = useCallback(() => {
    setBookingsByCourt(generateAllDemoBookings(startDateStr))
    setHasInteracted(false)
  }, [startDateStr])

  // Drag & Drop: Reprogramación local en memoria
  const handleReschedule = useCallback(
    (dragged: DraggedBookingData, newStartTimeUtc: string, newEndTimeUtc: string) => {
      setBookingsByCourt((prev) => {
        const currentList = prev[activeCourtId] || []
        const updated = currentList.map((b) => {
          if (b.id === dragged.bookingId) {
            return {
              ...b,
              startTimeUtc: newStartTimeUtc,
              endTimeUtc: newEndTimeUtc,
            }
          }
          return b
        })
        return {
          ...prev,
          [activeCourtId]: updated,
        }
      })
      setHasInteracted(true)
    },
    [activeCourtId]
  )

  // Drag & Drop: Cancelación al soltar en papelera flotante
  const handleTriggerCancel = useCallback(
    (dragged: DraggedBookingData) => {
      setBookingsByCourt((prev) => {
        const currentList = prev[activeCourtId] || []
        return {
          ...prev,
          [activeCourtId]: currentList.filter((b) => b.id !== dragged.bookingId),
        }
      })
      setHasInteracted(true)
    },
    [activeCourtId]
  )

  // Clic en turno existente -> abrir previsualización
  const handleSelectBooking = useCallback(
    (bookingId: string) => {
      const found = activeCourtBookings.find((b) => b.id === bookingId)
      if (found) {
        setNewSlotParams(null)
        setSelectedBooking(found)
        setIsPreviewOpen(true)
      }
    },
    [activeCourtBookings]
  )

  // Clic en slot libre -> abrir nuevo turno demo
  const handleSlotClick = useCallback(
    (dateStr: string, timeStr: string, maxAvailableMinutes: number) => {
      setSelectedBooking(null)
      setNewSlotParams({
        courtName: activeCourt.courtName,
        dateStr,
        timeStr,
        maxAvailableMinutes,
      })
      setIsPreviewOpen(true)
    },
    [activeCourt.courtName]
  )

  // Botón "+ Nuevo Turno" desde la barra de comando
  const handleOpenNewBooking = useCallback(() => {
    setSelectedBooking(null)
    setNewSlotParams({
      courtName: activeCourt.courtName,
      dateStr: startDateStr,
      timeStr: '18:00',
      maxAvailableMinutes: 90,
    })
    setIsPreviewOpen(true)
  }, [activeCourt.courtName, startDateStr])

  return (
    <div className="mt-12 relative w-full" id="agenda-preview">
      {/* Barra de KPIs y Estado Superior */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Fecha y Estado en directo */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#22242B] border border-[#31343E] px-3.5 py-2 rounded-lg shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#327357] animate-ping" />
            <span className="text-sm font-semibold text-[#F2F3F5]">Semana en Vivo</span>
            <span className="text-xs text-[#9497A1]">| En directo</span>
          </div>

          {/* Label sutil en línea: Modo Demo (Anti-Popup / Anti-Toast) */}
          {hasInteracted && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#D46211]/15 border border-[#D46211]/30 text-[#D46211] text-xs font-mono font-medium animate-in fade-in duration-300">
              <Sparkles className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span>Modo Demo: cambios no persistidos</span>
              <button
                type="button"
                onClick={handleResetDemo}
                className="ml-1 inline-flex items-center gap-1 text-[11px] underline text-[#D46211] hover:text-[#E37A24] cursor-pointer"
                title="Restablecer datos originales de la demostración"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer
              </button>
            </div>
          )}

          {/* Leyenda de estados */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-[#9497A1] font-mono">
            <span className="w-2.5 h-2.5 rounded bg-[#327357] inline-block" /> Confirmado
            <span className="w-2.5 h-2.5 rounded bg-[#D46211] inline-block ml-2" /> Seña Pendiente
            <span className="w-2.5 h-2.5 rounded bg-[#111215] border border-[#31343E] inline-block ml-2" /> Libre
          </div>
        </div>

        {/* Tarjetas KPI Rápidas */}
        <div className="flex items-center gap-3">
          <div className="bg-[#22242B] border border-[#31343E] px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#17181C] border border-[#31343E] flex items-center justify-center text-[#327357]">
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#9497A1] uppercase">Ocupación Hoy</p>
              <p className="text-sm font-bold text-[#F2F3F5]">
                {todayOccupancy}% <span className="text-[#327357] text-xs font-normal">▲ Activa</span>
              </p>
            </div>
          </div>

          <div className="bg-[#22242B] border border-[#31343E] px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#17181C] border border-[#31343E] flex items-center justify-center text-[#D46211]">
              <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#9497A1] uppercase">Señas Recibidas</p>
              <p className="text-sm font-bold text-[#F2F3F5] font-mono">
                ${todayDeposits.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor Maestro Estilo Ventana OS */}
      <div className="bg-[#22242B] border border-[#31343E] rounded-xl shadow-2xl overflow-hidden p-4 sm:p-5 space-y-4">
        {/* Cabecera Estilo Ventana */}
        <div className="flex items-center justify-between pb-3 bg-[#17181C] border border-[#31343E] rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#D46211]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#327357]" />
            <span className="ml-2 text-xs sm:text-sm font-medium text-[#F2F3F5]">
              Control Maestro • Sede Principal Las Lomas (Demostración)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9497A1]">
            <span className="px-2 py-0.5 rounded bg-[#22242B] border border-[#31343E] text-[#F2F3F5]">
              Auto-Sync On
            </span>
            <span className="hidden sm:inline">UTC-3</span>
          </div>
        </div>

        {/* 1. Selector de Canchas */}
        <CourtSelectorBar
          courts={DEMO_COURTS}
          activeCourtId={activeCourtId}
          weeklyOccupancy={weeklyOccupancy}
          weeklyProjectedIncome={weeklyProjectedIncome}
          onSelectCourt={setActiveCourtId}
        />

        {/* 2. Barra de Comando Semanal */}
        <TimelineCommandBar
          startDateStr={startDateStr}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onGoToToday={handleGoToToday}
          onOpenNewBooking={handleOpenNewBooking}
        />

        {/* 3. Matriz Semanal de la Cancha Activa */}
        <div className="rounded-xl border border-[#31343E] overflow-hidden bg-[#17181C]">
          <CourtWeeklyTimeline
            daysData={weeklyDaysData}
            courtName={activeCourt.courtName}
            surfaceName={activeCourt.surface}
            sports={activeCourt.sports}
            operatingWindows={activeCourt.operatingWindows}
            timelineBounds={timelineBounds}
            dragHook={dragHook}
            onSelectBooking={handleSelectBooking}
            onSlotClick={handleSlotClick}
            onReschedule={handleReschedule}
            onTriggerCancel={handleTriggerCancel}
          />
        </div>

        {/* Pie Informativo de Interacción */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-[#9497A1] font-mono gap-2 border-t border-[#31343E]/50">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#327357]" strokeWidth={2} />
            <span>Haz clic en un turno o arrástralo para probar la reprogramación instantánea.</span>
          </div>
          <span className="text-[11px] text-[#D46211]">
            Demostración en memoria · No requiere tarjeta de crédito
          </span>
        </div>
      </div>

      {/* Slide-over Sheet de Previsualización para Marketing */}
      <DemoBookingPreviewSheet
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        booking={selectedBooking}
        newSlotParams={newSlotParams}
      />
    </div>
  )
}

