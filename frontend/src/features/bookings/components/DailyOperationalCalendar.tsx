import React, { useState, useMemo } from 'react'
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
  // Manejo de fecha seleccionada (formato YYYY-MM-DD en hora local)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Filtro por deporte
  const [selectedSport, setSelectedSport] = useState<string>('all')

  // Vista adaptativa en móvil (cancha única vs grilla)
  const [selectedMobileCourtId, setSelectedMobileCourtId] = useState<string>('')

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

  // Obtener lista única de deportes presentes en las canchas
  const availableSports = useMemo(() => {
    const sportSet = new Set<string>()
    courts.forEach((c) => {
      c.sports.forEach((s) => sportSet.add(s.name))
    })
    return Array.from(sportSet)
  }, [courts])

  // Filtrado de canchas por deporte seleccionado
  const filteredCourts = useMemo(() => {
    if (selectedSport === 'all') return courts
    return courts.filter((c) =>
      c.sports.some((s) => s.name.toLowerCase() === selectedSport.toLowerCase())
    )
  }, [courts, selectedSport])

  // Cancha activa para vista móvil
  const activeMobileCourt = useMemo(() => {
    if (!filteredCourts.length) return null
    return (
      filteredCourts.find((c) => c.courtId === selectedMobileCourtId) || filteredCourts[0]
    )
  }, [filteredCourts, selectedMobileCourtId])

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
    setNewBookingParams({ courtId, timeSlot })
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
          {/* Navegador de Fecha */}
          <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white">
              <CalendarIcon className="h-4 w-4 text-[#258653]" strokeWidth={2} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-medium text-neutral-800 bg-transparent outline-hidden cursor-pointer capitalize"
              />
            </div>

            <span className="hidden md:inline-block text-sm font-semibold text-neutral-900 capitalize ml-2">
              {formattedDateTitle}
            </span>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-10 w-10 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-950 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Refrescar agenda"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => openNewBooking()}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#258653] hover:bg-[#1E6E44] active:bg-[#164734] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Nuevo Turno</span>
            </button>
          </div>
        </div>

        {/* Filtros de Deportes */}
        {availableSports.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedSport('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedSport === 'all'
                  ? 'bg-[#258653] text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Todas las Canchas
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedSport.toLowerCase() === sport.toLowerCase()
                    ? 'bg-[#258653] text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        )}

        {/* Selector de Cancha en Dispositivos Móviles (Ergonomía Fitts / Hick) */}
        <div className="md:hidden mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filteredCourts.map((c) => (
            <button
              key={c.courtId}
              type="button"
              onClick={() => setSelectedMobileCourtId(c.courtId)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                (activeMobileCourt?.courtId === c.courtId)
                  ? 'border-[#258653] bg-[#258653]/10 text-[#1E6E44]'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {c.courtName}
            </button>
          ))}
        </div>
      </header>

      {/* Contenido Principal de la Grilla Operativa */}
      <main className="flex-1 overflow-auto p-3 sm:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
        ) : filteredCourts.length === 0 ? (
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
            {/* Vista Desktop: Multi-Columna Paralela */}
            <div className="hidden md:block overflow-x-auto">
              <div
                className="grid min-w-[750px]"
                style={{
                  gridTemplateColumns: `80px repeat(${filteredCourts.length}, minmax(220px, 1fr))`,
                }}
              >
                {/* Cabecera: Eje de Tiempo */}
                <div className="p-3.5 border-b border-r border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-500 flex items-center justify-center sticky left-0 z-10">
                  Horario
                </div>

                {/* Cabeceras de Canchas */}
                {filteredCourts.map((court) => (
                  <div
                    key={court.courtId}
                    className="p-3.5 border-b border-r border-neutral-200 bg-neutral-50/80 text-center"
                  >
                    <span className="text-sm font-bold text-neutral-900 block truncate">
                      {court.courtName}
                    </span>
                    <span className="text-xs text-neutral-500 truncate block mt-0.5">
                      {court.surface} {court.isIndoor ? '· Techada' : ''}
                    </span>
                  </div>
                ))}

                {/* Cuerpo del Cronograma con Slots de 30 min */}
                <div className="contents">
                  {/* Columna Izquierda de Horas */}
                  <div className="relative border-r border-neutral-200 bg-neutral-50 sticky left-0 z-10">
                    {TIME_SLOTS_30.map((slot) => {
                      const isFullHour = slot.endsWith(':00')
                      return (
                        <div
                          key={slot}
                          style={{ height: `${SLOT_HEIGHT_PX}px` }}
                          className={`flex items-center justify-center text-[11px] font-medium border-b border-neutral-100 ${
                            isFullHour ? 'text-neutral-800 font-semibold' : 'text-neutral-400'
                          }`}
                        >
                          {slot}
                        </div>
                      )
                    })}
                  </div>

                  {/* Columnas por cada Cancha */}
                  {filteredCourts.map((court) => (
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
                          className="border-b border-neutral-100 hover:bg-[#258653]/5 transition-colors cursor-pointer group flex items-center justify-end px-2"
                        >
                          <span className="text-[10px] text-[#258653] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
                                ? 'bg-[#258653]/10 border-[#258653]/30 text-neutral-900 hover:border-[#258653]'
                                : isBlocked
                                ? 'bg-neutral-800 text-white border-neutral-700'
                                : isPending
                                ? 'bg-amber-50 border-amber-200 text-amber-950'
                                : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  {isBlocked ? (
                                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
                                  ) : (
                                    <User className="h-3.5 w-3.5 shrink-0 text-[#258653]" />
                                  )}
                                  <span className="font-bold truncate text-xs">
                                    {booking.customerName}
                                  </span>
                                </div>
                                {!isBlocked && (
                                  <span className="text-[11px] text-neutral-500 block truncate">
                                    {booking.sportName} · {booking.customerPhone}
                                  </span>
                                )}
                              </div>

                              {booking.isRecurring && (
                                <Repeat className="h-3.5 w-3.5 shrink-0 text-[#258653]" />
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="font-semibold">
                                ${booking.totalPrice.toLocaleString('es-AR')}
                              </span>
                              {isPending && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
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
                  <div className="p-3 bg-neutral-50 border-b border-neutral-200 text-center">
                    <span className="text-sm font-bold text-neutral-900 block">
                      {activeMobileCourt.courtName}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {activeMobileCourt.surface} {activeMobileCourt.isIndoor ? '· Techada' : ''}
                    </span>
                  </div>

                  <div
                    className="grid"
                    style={{ gridTemplateColumns: '70px 1fr' }}
                  >
                    {/* Horarios */}
                    <div className="relative border-r border-neutral-200 bg-neutral-50">
                      {TIME_SLOTS_30.map((slot) => (
                        <div
                          key={slot}
                          style={{ height: `${SLOT_HEIGHT_PX}px` }}
                          className="flex items-center justify-center text-[11px] text-neutral-600 border-b border-neutral-100 font-medium"
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
                          className="border-b border-neutral-100 hover:bg-[#258653]/5 transition-colors cursor-pointer flex items-center justify-end px-3"
                        >
                          <span className="text-[10px] text-[#258653] font-medium">
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
                                ? 'bg-[#258653]/10 border-[#258653]/30 text-neutral-900'
                                : isBlocked
                                ? 'bg-neutral-800 text-white border-neutral-700'
                                : 'bg-amber-50 border-amber-200 text-amber-950'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold block truncate">
                                  {booking.customerName}
                                </span>
                                <span className="text-[11px] text-neutral-500 block truncate">
                                  {booking.sportName} · {booking.customerPhone}
                                </span>
                              </div>
                              {booking.isRecurring && (
                                <Repeat className="h-3.5 w-3.5 text-[#258653]" />
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="font-semibold">
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
