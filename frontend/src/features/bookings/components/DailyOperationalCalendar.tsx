import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCourts } from '@/features/courts/hooks/useCourts'
import {
  TIME_SLOTS,
  DEFAULT_OPERATIONAL_COURTS,
  generateMockBookingsForDate,
  type OperationalCourt,
  type OperationalBooking,
} from '../mock/mockBookingsData'
import { BookingDetailModal } from './BookingDetailModal'
import { NewBookingModal } from './NewBookingModal'

export const DailyOperationalCalendar: React.FC = () => {
  // Manejo de fecha seleccionada (formato YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // Filtro por deporte
  const [selectedSport, setSelectedSport] = React.useState<string>('all')

  // Obtener canchas reales si existen
  const { data: serverCourts, isLoading: isLoadingCourts } = useCourts()

  const courts: OperationalCourt[] = React.useMemo(() => {
    if (serverCourts && serverCourts.length > 0) {
      return serverCourts.map((c) => ({
        id: c.id,
        name: c.name,
        sport: c.sports?.[0]?.sportName || 'Polideportivo',
        surface: c.surfaceType,
        isCovered: c.isCovered,
      }))
    }
    return DEFAULT_OPERATIONAL_COURTS
  }, [serverCourts])

  // Lista de deportes disponibles para filtrado
  const availableSports = React.useMemo(() => {
    const set = new Set<string>()
    courts.forEach((c) => set.add(c.sport))
    return Array.from(set)
  }, [courts])

  const filteredCourts = React.useMemo(() => {
    if (selectedSport === 'all') return courts
    return courts.filter((c) => c.sport.toLowerCase() === selectedSport.toLowerCase())
  }, [courts, selectedSport])

  // Estados para vista adaptativa móvil (Ergonomía Fitts / Hick)
  const [selectedCourtIdForMobile, setSelectedCourtIdForMobile] = React.useState<string>('')
  const [mobileViewMode, setMobileViewMode] = React.useState<'single' | 'matrix'>('single')

  const activeMobileCourt = React.useMemo(() => {
    if (!filteredCourts.length) return null
    const found = filteredCourts.find((c) => c.id === selectedCourtIdForMobile)
    return found || filteredCourts[0]
  }, [filteredCourts, selectedCourtIdForMobile])

  // Almacenamiento en memoria de turnos por fecha
  const [bookingsByDate, setBookingsByDate] = React.useState<Record<string, OperationalBooking[]>>(
    {}
  )

  // Cargar mock por defecto para la fecha si aún no existe
  React.useEffect(() => {
    setBookingsByDate((prev) => {
      if (prev[selectedDate]) return prev
      return {
        ...prev,
        [selectedDate]: generateMockBookingsForDate(selectedDate),
      }
    })
  }, [selectedDate])

  const activeBookings = bookingsByDate[selectedDate] || []

  // Estados de Modales
  const [selectedBooking, setSelectedBooking] = React.useState<OperationalBooking | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  const [slotToCreate, setSlotToCreate] = React.useState<{
    court: OperationalCourt
    timeSlot: string
  } | null>(null)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  // Navegación de fecha
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const current = new Date(y, m - 1, d)
    current.setDate(current.getDate() + days)
    const nextY = current.getFullYear()
    const nextM = String(current.getMonth() + 1).padStart(2, '0')
    const nextD = String(current.getDate()).padStart(2, '0')
    setSelectedDate(`${nextY}-${nextM}-${nextD}`)
  }

  const handleSelectQuickDate = (type: 'today' | 'tomorrow' | 'afterTomorrow') => {
    const d = new Date()
    if (type === 'tomorrow') d.setDate(d.getDate() + 1)
    if (type === 'afterTomorrow') d.setDate(d.getDate() + 2)
    const nextY = d.getFullYear()
    const nextM = String(d.getMonth() + 1).padStart(2, '0')
    const nextD = String(d.getDate()).padStart(2, '0')
    setSelectedDate(`${nextY}-${nextM}-${nextD}`)
  }

  const formattedDateTitle = React.useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj)
  }, [selectedDate])

  // Métricas del día seleccionado
  const metrics = React.useMemo(() => {
    const nonBlocked = activeBookings.filter((b) => b.status !== 'blocked')
    const confirmedCount = nonBlocked.filter((b) => b.status === 'confirmed').length
    const partialCount = nonBlocked.filter((b) => b.status === 'partial_deposit').length
    const blockedCount = activeBookings.filter((b) => b.status === 'blocked').length

    let pendingTotal = 0
    nonBlocked.forEach((b) => {
      pendingTotal += Math.max(0, b.totalPrice - b.depositAmount)
    })

    const totalPossibleSlots = filteredCourts.length * TIME_SLOTS.length
    const totalOccupied = activeBookings.length
    const occupancyRate =
      totalPossibleSlots > 0 ? Math.round((totalOccupied / totalPossibleSlots) * 100) : 0

    return {
      totalBookings: nonBlocked.length,
      confirmedCount,
      partialCount,
      blockedCount,
      pendingTotal,
      occupancyRate,
    }
  }, [activeBookings, filteredCourts.length])

  // Handlers para actualizar turnos en memoria
  const handleUpdateBooking = (updated: OperationalBooking) => {
    setBookingsByDate((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).map((b) => (b.id === updated.id ? updated : b)),
    }))
    toast.success('Cobro de saldo registrado correctamente')
  }

  const handleCancelBooking = (bookingId: string) => {
    setBookingsByDate((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).filter((b) => b.id !== bookingId),
    }))
    toast.info('El turno ha sido cancelado y el horario está disponible')
  }

  const handleCreateBooking = (newBooking: OperationalBooking) => {
    setBookingsByDate((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newBooking],
    }))
    toast.success(`Turno reservado para ${newBooking.customerName}`)
  }

  const handleResetDay = () => {
    setBookingsByDate((prev) => ({
      ...prev,
      [selectedDate]: generateMockBookingsForDate(selectedDate),
    }))
    toast.info('Grilla horaria restablecida con datos demo')
  }

  return (
    <section className="bg-white border border-neutral-300 shadow-sm overflow-hidden">
      {/* Barra Superior: Control de Fecha y Filtros */}
      <div className="p-4 sm:p-6 border-b border-neutral-200 bg-neutral-50/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Selector y Navegación de Fecha */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center border border-neutral-300 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-2.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Día anterior"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="px-3 py-2 text-center border-x border-neutral-200 min-w-[180px]">
              <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-neutral-950 block capitalize">
                {formattedDateTitle}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-2.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Día siguiente"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          {/* Atajos Rápidos */}
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSelectQuickDate('today')}
              className="min-h-[44px] px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickDate('tomorrow')}
              className="min-h-[44px] px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors"
            >
              Mañana
            </button>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value)
                }}
                className="min-h-[44px] px-3 py-2 text-xs font-bold bg-white border border-neutral-300 hover:bg-neutral-100 cursor-pointer text-neutral-800"
                aria-label="Seleccionar fecha específica"
              />
            </div>
          </div>
        </div>

        {/* Filtros por Deporte y Acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 border border-neutral-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setSelectedSport('all')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors min-h-[36px] ${
                selectedSport === 'all'
                  ? 'bg-brand-sport text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
              }`}
            >
              Todos ({courts.length})
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors min-h-[36px] ${
                  selectedSport.toLowerCase() === sport.toLowerCase()
                    ? 'bg-brand-sport text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetDay}
            title="Restablecer turnos demo para este día"
            className="min-h-[44px] px-3 py-2 text-xs font-bold uppercase text-neutral-500 hover:text-neutral-900 border border-neutral-300 bg-white hover:bg-neutral-100 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Franja de Métricas Operativas del Día */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-neutral-200 bg-white text-xs divide-x divide-y md:divide-y-0 divide-neutral-200">
        <div className="p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Turnos Reservados
            </span>
            <span className="text-lg sm:text-xl font-black text-neutral-950 font-mono">
              {metrics.totalBookings}
            </span>
          </div>
          <CalendarIcon className="h-5 w-5 text-neutral-400" strokeWidth={2} />
        </div>

        <div className="p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Saldos en Mostrador
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-900 font-mono">
              ${metrics.pendingTotal.toLocaleString('es-AR')}
            </span>
          </div>
          <AlertCircle className="h-5 w-5 text-amber-500" strokeWidth={2} />
        </div>

        <div className="p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Cobros Completos
            </span>
            <span className="text-lg sm:text-xl font-black text-brand-sport font-mono">
              {metrics.confirmedCount}
            </span>
          </div>
          <CheckCircle2 className="h-5 w-5 text-brand-sport" strokeWidth={2} />
        </div>

        <div className="p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Ocupación General
            </span>
            <span className="text-lg sm:text-xl font-black text-neutral-950 font-mono">
              {metrics.occupancyRate}%
            </span>
          </div>
          <Clock className="h-5 w-5 text-neutral-400" strokeWidth={2} />
        </div>
      </div>

      {/* Selector de Modo Móvil (Por Cancha vs Matriz) */}
      <div className="md:hidden p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-neutral-300 p-0.5 bg-neutral-200/60">
          <button
            type="button"
            onClick={() => setMobileViewMode('single')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md inline-flex items-center gap-1.5 min-h-[36px] transition-colors ${
              mobileViewMode === 'single'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            <List className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Por Cancha</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('matrix')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md inline-flex items-center gap-1.5 min-h-[36px] transition-colors ${
              mobileViewMode === 'matrix'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Matriz</span>
          </button>
        </div>
        {mobileViewMode === 'single' && activeMobileCourt && (
          <span className="text-xs font-semibold text-neutral-500 truncate max-w-[130px]">
            {activeMobileCourt.name}
          </span>
        )}
      </div>

      {/* Vista Móvil: Cronología por Cancha Individual */}
      {mobileViewMode === 'single' && activeMobileCourt && (
        <div className="md:hidden border-b border-neutral-200">
          {/* Selector de Canchas Móvil */}
          <div className="p-2.5 bg-white border-b border-neutral-200 overflow-x-auto flex gap-2">
            {filteredCourts.map((court) => {
              const isSelected = activeMobileCourt.id === court.id
              const courtBookingsCount = activeBookings.filter((b) => b.courtId === court.id).length
              return (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => setSelectedCourtIdForMobile(court.id)}
                  className={`min-h-[44px] px-3.5 py-2 text-xs font-bold shrink-0 flex items-center gap-2 border transition-all ${
                    isSelected
                      ? 'bg-brand-sport text-white border-brand-sport shadow-xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span>{court.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {courtBookingsCount}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Ficha de la Cancha Activa */}
          <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-neutral-950 block">
                {activeMobileCourt.name}
              </span>
              <span className="text-[11px] text-neutral-500">
                {activeMobileCourt.surface} · {activeMobileCourt.isCovered ? 'Cubierta' : 'Descubierta'}
              </span>
            </div>
            <span className="text-xs font-bold text-brand-british uppercase">
              {activeMobileCourt.sport}
            </span>
          </div>

          {/* Lista de Turnos por Horario */}
          <div className="p-3 space-y-2 bg-neutral-100/40">
            {TIME_SLOTS.map((time) => {
              const booking = activeBookings.find(
                (b) => b.courtId === activeMobileCourt.id && b.startTime === time
              )
              const startH = parseInt(time.split(':')[0], 10)
              const endH = (startH + 1).toString().padStart(2, '0')
              const timeRange = `${time} - ${endH}:00 hs`

              if (!booking) {
                return (
                  <div
                    key={time}
                    onClick={() => {
                      setSlotToCreate({ court: activeMobileCourt, timeSlot: time })
                      setIsCreateOpen(true)
                    }}
                    className="p-3 bg-white border border-dashed border-neutral-300 flex items-center justify-between gap-3 cursor-pointer hover:border-brand-sport hover:bg-brand-soft/10 transition-colors min-h-[56px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-neutral-400" strokeWidth={2} />
                      <span className="text-xs font-mono font-bold text-neutral-700">{timeRange}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-sport uppercase tracking-wider">
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Disponible</span>
                    </span>
                  </div>
                )
              }

              if (booking.status === 'blocked') {
                return (
                  <div
                    key={time}
                    onClick={() => {
                      setSelectedBooking(booking)
                      setIsDetailOpen(true)
                    }}
                    className="p-3 bg-neutral-100 border border-neutral-300 flex items-center justify-between gap-3 cursor-pointer hover:border-neutral-500 transition-colors min-h-[56px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="h-4 w-4 text-neutral-600" strokeWidth={2} />
                      <div>
                        <span className="text-xs font-mono font-bold text-neutral-800 block">{timeRange}</span>
                        <span className="text-xs font-medium text-neutral-600">{booking.customerName}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-200 px-2 py-0.5">
                      Bloqueo
                    </span>
                  </div>
                )
              }

              const isFull = booking.status === 'confirmed'
              const pending = Math.max(0, booking.totalPrice - booking.depositAmount)

              return (
                <div
                  key={time}
                  onClick={() => {
                    setSelectedBooking(booking)
                    setIsDetailOpen(true)
                  }}
                  className={`p-3 border flex items-center justify-between gap-3 cursor-pointer transition-colors min-h-[56px] ${
                    isFull
                      ? 'bg-brand-soft/20 border-brand-sport/50 hover:border-brand-sport'
                      : 'bg-amber-50 border-amber-300 hover:border-amber-500'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-900">{timeRange}</span>
                      {isFull ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-sport" strokeWidth={2} />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-700" strokeWidth={2} />
                      )}
                    </div>
                    <p className="text-xs font-bold text-neutral-950">{booking.customerName}</p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="font-bold text-neutral-900 block">
                      ${booking.totalPrice.toLocaleString('es-AR')}
                    </span>
                    {!isFull && pending > 0 ? (
                      <span className="text-[10px] font-bold text-amber-800 block">
                        Resta ${pending.toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-brand-sport uppercase">
                        Pagado
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Matriz / Grilla de Turnos (Desktop o modo Matriz en móvil) */}
      {isLoadingCourts ? (
        <div className="p-12 text-center text-neutral-500 text-sm">
          Cargando configuración de canchas...
        </div>
      ) : (
        <div className={`relative overflow-x-auto ${mobileViewMode === 'matrix' ? 'block' : 'hidden md:block'}`}>
          <table className="w-full border-collapse text-left select-none min-w-[1280px]">
            {/* Cabecera de Horarios */}
            <thead>
              <tr className="border-b border-neutral-300 bg-neutral-100">
                <th
                  scope="col"
                  className="sticky left-0 z-20 bg-neutral-100 px-4 py-3 text-xs font-black uppercase tracking-wider text-neutral-900 border-r border-neutral-300 w-56 min-w-[220px]"
                >
                  Cancha / Instalación
                </th>
                {TIME_SLOTS.map((time) => (
                  <th
                    key={time}
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-bold text-neutral-800 border-r border-neutral-200 min-w-[110px]"
                  >
                    <span className="font-mono">{time}</span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Filas de Canchas */}
            <tbody className="divide-y divide-neutral-200">
              {filteredCourts.map((court) => (
                <tr key={court.id} className="hover:bg-neutral-50/50 transition-colors">
                  {/* Celda Fija de la Cancha */}
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-neutral-300 font-normal align-middle shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-neutral-950 uppercase tracking-tight block">
                        {court.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span className="font-semibold text-brand-british">{court.sport}</span>
                        <span>·</span>
                        <span className="truncate max-w-[130px]">{court.surface}</span>
                      </div>
                    </div>
                  </th>

                  {/* Celdas de Turno por Hora */}
                  {TIME_SLOTS.map((time) => {
                    const booking = activeBookings.find(
                      (b) => b.courtId === court.id && b.startTime === time
                    )

                    if (!booking) {
                      // Celda Libre / Disponible
                      return (
                        <td
                          key={time}
                          onClick={() => {
                            setSlotToCreate({ court, timeSlot: time })
                            setIsCreateOpen(true)
                          }}
                          className="px-2 py-2 border-r border-neutral-200 text-center align-middle cursor-pointer hover:bg-brand-soft/20 transition-all group"
                          title={`Disponible a las ${time} hs en ${court.name} (clic para reservar)`}
                        >
                          <div className="h-14 w-full flex items-center justify-center border border-dashed border-neutral-200 group-hover:border-brand-sport transition-colors bg-white">
                            <span className="hidden group-hover:inline-flex items-center gap-1 text-[11px] font-bold uppercase text-brand-sport">
                              <Plus className="h-3 w-3" strokeWidth={2} />
                              <span>Libre</span>
                            </span>
                          </div>
                        </td>
                      )
                    }

                    // Celda de Bloqueo
                    if (booking.status === 'blocked') {
                      return (
                        <td
                          key={time}
                          onClick={() => {
                            setSelectedBooking(booking)
                            setIsDetailOpen(true)
                          }}
                          className="px-2 py-2 border-r border-neutral-200 align-middle cursor-pointer"
                        >
                          <div className="h-14 w-full p-2 bg-neutral-100 border border-neutral-300 flex flex-col justify-between hover:border-neutral-500 transition-colors">
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                              <ShieldAlert className="h-3 w-3 shrink-0" strokeWidth={2} />
                              <span className="truncate">Bloqueo</span>
                            </div>
                            <span className="text-[11px] font-medium text-neutral-800 truncate">
                              {booking.customerName}
                            </span>
                          </div>
                        </td>
                      )
                    }

                    // Celda Reservada (Confirmada o Con Seña)
                    const isFull = booking.status === 'confirmed'
                    const pendingAmount = Math.max(0, booking.totalPrice - booking.depositAmount)

                    return (
                      <td
                        key={time}
                        onClick={() => {
                          setSelectedBooking(booking)
                          setIsDetailOpen(true)
                        }}
                        className="px-2 py-2 border-r border-neutral-200 align-middle cursor-pointer"
                      >
                        <div
                          className={`h-14 w-full p-2 border flex flex-col justify-between transition-shadow hover:shadow-sm ${
                            isFull
                              ? 'bg-brand-soft/20 border-brand-sport/50 text-neutral-950 hover:border-brand-sport'
                              : 'bg-amber-50 border-amber-300 text-amber-950 hover:border-amber-500'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {booking.customerName}
                            </span>
                            {isFull ? (
                              <CheckCircle2
                                className="h-3 w-3 text-brand-sport shrink-0"
                                strokeWidth={2}
                              />
                            ) : (
                              <AlertCircle
                                className="h-3 w-3 text-amber-700 shrink-0"
                                strokeWidth={2}
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono leading-none">
                            <span className="font-semibold">${booking.totalPrice.toLocaleString('es-AR')}</span>
                            {!isFull && pendingAmount > 0 && (
                              <span className="text-amber-800 font-bold">
                                Resta ${pendingAmount.toLocaleString('es-AR')}
                              </span>
                            )}
                            {isFull && (
                              <span className="text-brand-sport font-semibold uppercase text-[9px]">
                                Pagado
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda Operativa Inferior */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold uppercase tracking-wider text-neutral-500 text-[10px]">
            Referencias:
          </span>
          <div className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 bg-brand-soft/30 border border-brand-sport/60 inline-block" />
            <span className="text-neutral-700 font-medium">Turno Abonado Completo</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 bg-amber-50 border border-amber-300 inline-block" />
            <span className="text-neutral-700 font-medium">Con Seña (Saldo Pendiente)</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 bg-neutral-100 border border-neutral-300 inline-block" />
            <span className="text-neutral-700 font-medium">Bloqueo / Mantenimiento</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 bg-white border border-dashed border-neutral-300 inline-block" />
            <span className="text-neutral-700 font-medium">Libre (Clic para agendar)</span>
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 font-medium italic">
          * Los cambios se procesan de forma inmediata en la grilla diaria.
        </div>
      </div>

      {/* Modales Interactivos */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedBooking(null)
        }}
        onUpdateBooking={handleUpdateBooking}
        onCancelBooking={handleCancelBooking}
      />

      <NewBookingModal
        court={slotToCreate?.court || null}
        timeSlot={slotToCreate?.timeSlot || '08:00'}
        date={selectedDate}
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false)
          setSlotToCreate(null)
        }}
        onCreateBooking={handleCreateBooking}
      />
    </section>
  )
}
