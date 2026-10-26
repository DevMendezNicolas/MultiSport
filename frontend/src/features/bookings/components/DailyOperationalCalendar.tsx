import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  ShieldAlert,
  Repeat,
  RefreshCw,
  LayoutGrid,
  User,
  ArrowLeft,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDailyGrid } from '../hooks/useBookings'
import { BookingDetailSheet } from './BookingDetailSheet'
import { NewBookingSheet } from './NewBookingSheet'
import type { GridBookingItem } from '../types'

// Generar slots de 30 minutos desde las 08:00 hasta las 23:30
const GENERATE_30_MIN_SLOTS = () => {
  const slots: string[] = []
  for (let hour = 8; hour <= 23; hour++) {
    const h = hour.toString().padStart(2, '0')
    slots.push(`${h}:00`)
    slots.push(`${h}:30`)
  }
  return slots
}

const TIME_SLOTS_30 = GENERATE_30_MIN_SLOTS()
const SLOT_HEIGHT_PX = 48 // Altura en píxeles de cada bloque de 30 minutos

export const DailyOperationalCalendar: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Manejo de fecha seleccionada (formato YYYY-MM-DD en hora local)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Cancha focalizada desde parámetro URL (?courtId=...)
  const courtIdParam = searchParams.get('courtId')

  // Vista adaptativa en móvil (cancha única vs grilla)
  const [selectedMobileCourtId, setSelectedMobileCourtId] = useState<string>(courtIdParam || '')

  // Sincronizar selección móvil si cambia courtIdParam
  useEffect(() => {
    if (courtIdParam) {
      setSelectedMobileCourtId(courtIdParam)
    }
  }, [courtIdParam])

  // Estados de Sheets
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [newBookingParams, setNewBookingParams] = useState<{
    courtId?: string
    timeSlot?: string
  }>({})

  // Consumo del Endpoint Real de Grilla Operativa
  const { data: gridData, isLoading, refetch, isFetching } = useDailyGrid(selectedDate)

  const courts = useMemo(() => gridData?.courts || [], [gridData])

  // Identificar si estamos en Modo Enfocado en una Cancha
  const focusedCourt = useMemo(() => {
    if (!courtIdParam) return null
    return courts.find((c) => c.courtId === courtIdParam) || null
  }, [courts, courtIdParam])

  // Filtrado de canchas (si hay cancha focalizada se muestra solo esa, sino todas las canchas)
  const displayedCourts = useMemo(() => {
    if (focusedCourt) {
      return [focusedCourt]
    }
    return courts
  }, [courts, focusedCourt])

  // Cancha activa para vista móvil
  const activeMobileCourt = useMemo(() => {
    if (focusedCourt) return focusedCourt
    if (!displayedCourts.length) return null
    return (
      displayedCourts.find((c) => c.courtId === selectedMobileCourtId) || displayedCourts[0]
    )
  }, [focusedCourt, displayedCourts, selectedMobileCourtId])

  // Acciones de Selección de Cancha en Pestañas
  const handleSelectCourt = (courtId: string | null) => {
    if (!courtId) {
      // Ver todas las canchas
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('courtId')
      setSearchParams(nextParams)
      setSelectedMobileCourtId('')
    } else {
      setSearchParams({ courtId })
      setSelectedMobileCourtId(courtId)
    }
  }

  // Navegación de Fechas
  const handleDateChange = (daysDelta: number) => {
    const current = new Date(`${selectedDate}T12:00:00Z`)
    current.setDate(current.getDate() + daysDelta)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today.toISOString().split('T')[0])
  }

  const formattedDateTitle = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00Z`)
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDate])

  const openNewBooking = (courtId?: string, timeSlot?: string) => {
    setNewBookingParams({ courtId: courtId || focusedCourt?.courtId, timeSlot })
    setIsNewBookingOpen(true)
  }

  const openBookingDetail = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setIsDetailOpen(true)
  }

  // Función auxiliar para calcular el posicionamiento vertical de un turno
  const computeBookingStyle = (booking: GridBookingItem) => {
    const start = new Date(booking.startTimeUtc)
    const end = new Date(booking.endTimeUtc)

    const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes()
    const endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes()

    const timelineStartMinutes = 8 * 60 // 08:00
    const offsetMinutes = Math.max(0, startMinutes - timelineStartMinutes)
    const durationMinutes = Math.max(30, endMinutes - startMinutes)

    const top = (offsetMinutes / 30) * SLOT_HEIGHT_PX
    const height = (durationMinutes / 30) * SLOT_HEIGHT_PX - 4 // -4px para margen visual

    return { top: `${top}px`, height: `${height}px` }
  }

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5]">
      {/* Barra de Control y Navegación de Agenda */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Navegador de Fecha y Retorno al Panel General */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 hover:text-neutral-950 hover:bg-neutral-50 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Volver al panel general"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              <span>Panel General</span>
            </button>

            <div className="flex items-center bg-neutral-100 rounded-xl p-1 border border-neutral-200">
              <button
                type="button"
                onClick={() => handleDateChange(-1)}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-white transition-all cursor-pointer"
                aria-label="Día anterior"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="px-3 h-9 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-white rounded-lg transition-all cursor-pointer"
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => handleDateChange(1)}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-white transition-all cursor-pointer"
                aria-label="Día siguiente"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-neutral-300 bg-white">
              <CalendarIcon className="h-4 w-4 text-brand-british shrink-0" strokeWidth={2.5} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-neutral-900 bg-transparent outline-hidden cursor-pointer capitalize"
              />
            </div>

            <span className="hidden lg:inline-block text-sm font-bold text-neutral-950 capitalize ml-1">
              {formattedDateTitle}
            </span>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-10 w-10 rounded-xl border border-neutral-300 bg-white text-neutral-700 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Refrescar agenda"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => openNewBooking()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-sport hover:bg-brand-sport-hover active:bg-brand-british transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>Nuevo Turno</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Selección de Canchas (Switcher rápido entre canchas) */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-200 overflow-x-auto no-scrollbar">
          <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider mr-1 shrink-0">
            Canchas:
          </span>
          <button
            type="button"
            onClick={() => handleSelectCourt(null)}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              !focusedCourt
                ? 'bg-neutral-950 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Todas las Canchas
          </button>
          {courts.map((c) => {
            const isSelected = focusedCourt?.courtId === c.courtId
            return (
              <button
                key={c.courtId}
                type="button"
                onClick={() => handleSelectCourt(c.courtId)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-brand-sport text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                }`}
              >
                {c.courtName}
              </button>
            )
          })}
        </div>

        {/* Resumen Contextual de la Cancha Focalizada */}
        {focusedCourt && (
          <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-black text-sm text-neutral-950 uppercase">{focusedCourt.courtName}</span>
              <span className="font-mono bg-white px-2 py-0.5 border border-neutral-300 font-bold text-neutral-800">
                {focusedCourt.surface} {focusedCourt.isIndoor ? '· Techada' : '· Al aire libre'}
              </span>
              <div className="hidden sm:flex items-center gap-2 text-neutral-700">
                {focusedCourt.sports.map((s) => (
                  <span key={s.sportId} className="font-medium">
                    {s.name}: ${s.basePrice.toLocaleString('es-AR')} ({s.durationMinutes} min)
                  </span>
                ))}
              </div>
            </div>
            <div className="font-mono font-bold text-neutral-900">
              {focusedCourt.bookings.filter((b) => b.status !== 'cancelled').length} turnos programados hoy
            </div>
          </div>
        )}
      </header>

      {/* Contenido Principal de la Grilla Operativa */}
      <main className="flex-1 overflow-auto p-3 sm:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
        ) : displayedCourts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#258653]/10 flex items-center justify-center text-[#258653] mb-4">
              <LayoutGrid className="h-7 w-7" strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              No hay canchas registradas en este complejo
            </h3>
            <p className="mt-1 text-sm text-neutral-500 max-w-sm">
              Para comenzar a gestionar turnos, cree sus canchas deportivas desde la sección de configuración.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            {/* Vista Desktop: Multi-Columna o Columna Ampliada si está focalizada */}
            <div className="hidden md:block overflow-x-auto">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: focusedCourt
                    ? '80px minmax(500px, 1fr)'
                    : `80px repeat(${displayedCourts.length}, minmax(220px, 1fr))`,
                  minWidth: focusedCourt ? '100%' : '750px',
                }}
              >
                {/* Cabecera: Eje de Tiempo */}
                <div className="p-3.5 border-b border-r border-neutral-300 bg-neutral-100/90 text-xs font-mono font-black uppercase text-neutral-800 flex items-center justify-center sticky left-0 z-10">
                  Horario
                </div>

                {/* Cabeceras de Canchas */}
                {displayedCourts.map((court) => (
                  <div
                    key={court.courtId}
                    className="p-3.5 border-b border-r border-neutral-200 bg-neutral-50/90 text-center"
                  >
                    <span className="text-sm sm:text-base font-black text-neutral-950 block truncate">
                      {court.courtName}
                    </span>
                    <span className="text-xs font-medium text-neutral-700 truncate block mt-0.5">
                      {court.surface} {court.isIndoor ? '· Techada' : ''}
                    </span>
                  </div>
                ))}

                {/* Cuerpo del Cronograma con Slots de 30 min */}
                <div className="contents">
                  {/* Columna Izquierda de Horas */}
                  <div className="relative border-r border-neutral-300 bg-neutral-50 sticky left-0 z-10">
                    {TIME_SLOTS_30.map((slot) => {
                      const isFullHour = slot.endsWith(':00')
                      return (
                        <div
                          key={slot}
                          style={{ height: `${SLOT_HEIGHT_PX}px` }}
                          className={`flex items-center justify-center text-xs font-mono border-b border-neutral-200 ${
                            isFullHour ? 'text-neutral-950 font-black bg-neutral-100/80' : 'text-neutral-800 font-bold'
                          }`}
                        >
                          {slot}
                        </div>
                      )
                    })}
                  </div>

                  {/* Columnas por cada Cancha */}
                  {displayedCourts.map((court) => (
                    <div
                      key={court.courtId}
                      className="relative border-r border-neutral-200 bg-white"
                      style={{ height: `${TIME_SLOTS_30.length * SLOT_HEIGHT_PX}px` }}
                    >
                      {/* Fondo de Celdas Interactivas (Slots de 30 min) */}
                      {TIME_SLOTS_30.map((slot) => (
                        <div
                          key={slot}
                          onClick={() => openNewBooking(court.courtId, slot)}
                          style={{ height: `${SLOT_HEIGHT_PX}px` }}
                          className="border-b border-neutral-100 hover:bg-brand-sport/10 transition-colors cursor-pointer group flex items-center justify-end px-2.5"
                        >
                          <span className="text-xs text-brand-british font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            + Reservar
                          </span>
                        </div>
                      ))}

                      {/* Tarjetas de Turnos Superpuestas */}
                      {court.bookings.map((booking) => {
                        const style = computeBookingStyle(booking)
                        const isConfirmed = booking.status === 'confirmed'
                        const isBlocked = booking.status === 'blocked'
                        const isPending = booking.status === 'pending'

                        return (
                          <div
                            key={booking.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              openBookingDetail(booking.id)
                            }}
                            style={style}
                            className={`absolute left-1 right-1 rounded-xl p-2.5 text-xs shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden border ${
                              isConfirmed
                                ? 'bg-emerald-50/95 border-emerald-400 text-neutral-950 hover:border-emerald-600'
                                : isBlocked
                                ? 'bg-neutral-900 text-white border-neutral-800'
                                : isPending
                                ? 'bg-amber-50 border-amber-300 text-neutral-950'
                                : 'bg-neutral-100 border-neutral-300 text-neutral-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isBlocked ? (
                                    <ShieldAlert className="h-4 w-4 shrink-0 text-neutral-300" />
                                  ) : (
                                    <User className="h-4 w-4 shrink-0 text-brand-british" />
                                  )}
                                  <span className="font-bold truncate text-sm text-neutral-950">
                                    {booking.customerName}
                                  </span>
                                </div>
                                {!isBlocked && (
                                  <span className="text-xs text-neutral-700 font-medium block truncate mt-0.5">
                                    {booking.sportName} · {booking.customerPhone}
                                  </span>
                                )}
                              </div>

                              {booking.isRecurring && (
                                <Repeat className="h-3.5 w-3.5 shrink-0 text-brand-british" />
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="font-mono font-black text-xs sm:text-sm text-neutral-950">
                                ${booking.totalPrice.toLocaleString('es-AR')}
                              </span>
                              {isPending && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-bold border border-amber-300">
                                  Seña Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vista Móvil: Cancha Única Adaptativa (Previene scroll horizontal desmedido) */}
            <div className="md:hidden">
              {activeMobileCourt && (
                <div>
                  <div className="p-3 bg-neutral-100/80 border-b border-neutral-200 text-center">
                    <span className="text-base font-black text-neutral-950 block">
                      {activeMobileCourt.courtName}
                    </span>
                    <span className="text-xs font-semibold text-neutral-700 mt-0.5 block">
                      {activeMobileCourt.surface} {activeMobileCourt.isIndoor ? '· Techada' : ''}
                    </span>
                  </div>

                  <div
                    className="grid"
                    style={{ gridTemplateColumns: '70px 1fr' }}
                  >
                    {/* Horarios */}
                    <div className="relative border-r border-neutral-300 bg-neutral-50">
                      {TIME_SLOTS_30.map((slot) => (
                        <div
                          key={slot}
                          style={{ height: `${SLOT_HEIGHT_PX}px` }}
                          className="flex items-center justify-center text-xs font-mono font-bold text-neutral-800 border-b border-neutral-200"
                        >
                          {slot}
                        </div>
                      ))}
                    </div>

                    {/* Contenido Cancha */}
                    <div
                      className="relative bg-white"
                      style={{ height: `${TIME_SLOTS_30.length * SLOT_HEIGHT_PX}px` }}
                    >
                      {TIME_SLOTS_30.map((slot) => (
                        <div
                          key={slot}
                          onClick={() => openNewBooking(activeMobileCourt.courtId, slot)}
                          style={{ height: `${SLOT_HEIGHT_PX}px` }}
                          className="border-b border-neutral-100 hover:bg-brand-sport/10 transition-colors cursor-pointer flex items-center justify-end px-3"
                        >
                          <span className="text-xs text-brand-british font-bold">
                            + Reservar
                          </span>
                        </div>
                      ))}

                      {activeMobileCourt.bookings.map((booking) => {
                        const style = computeBookingStyle(booking)
                        const isConfirmed = booking.status === 'confirmed'
                        const isBlocked = booking.status === 'blocked'

                        return (
                          <div
                            key={booking.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              openBookingDetail(booking.id)
                            }}
                            style={style}
                            className={`absolute left-1.5 right-1.5 rounded-xl p-2.5 text-xs shadow-xs transition-all cursor-pointer flex flex-col justify-between border ${
                              isConfirmed
                                ? 'bg-emerald-50/95 border-emerald-400 text-neutral-950'
                                : isBlocked
                                ? 'bg-neutral-900 text-white border-neutral-800'
                                : 'bg-amber-50 border-amber-300 text-neutral-950'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold block truncate text-sm text-neutral-950">
                                  {booking.customerName}
                                </span>
                                <span className="text-xs text-neutral-700 font-medium block truncate mt-0.5">
                                  {booking.sportName} · {booking.customerPhone}
                                </span>
                              </div>
                              {booking.isRecurring && (
                                <Repeat className="h-4 w-4 text-brand-british shrink-0" />
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="font-mono font-black text-sm text-neutral-950">
                                ${booking.totalPrice.toLocaleString('es-AR')}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Sheets */}
      <NewBookingSheet
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        courts={courts}
        defaultCourtId={newBookingParams.courtId}
        defaultDate={selectedDate}
        defaultTimeSlot={newBookingParams.timeSlot || '18:00'}
      />

      <BookingDetailSheet
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedBookingId(null)
        }}
        bookingId={selectedBookingId}
      />
    </div>
  )
}
