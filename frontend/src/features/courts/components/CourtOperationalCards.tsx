import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Clock,
  Warehouse,
  Zap,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react'
import { useCourts } from '../hooks/useCourts'
import { useDailyGrid } from '@/features/bookings/hooks/useBookings'
import { resolveCourtImage } from './CourtVisualSystem'
import type { CourtResponse } from '../types'
import type { DailyGridCourtItem } from '@/features/bookings/types'

type StatusFilter = 'all' | 'free' | 'busy' | 'blocked'

interface CourtLiveState {
  state: 'free' | 'busy' | 'blocked' | 'inactive'
  badgeLabel: string
  detailLabel: string
  bookingsCount: number
}

export const CourtOperationalCards: React.FC = () => {
  const navigate = useNavigate()

  // Fecha de hoy en formato local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  // Carga de datos de canchas y grilla del día
  const { data: courts = [], isLoading: isLoadingCourts } = useCourts()
  const { data: gridData, isLoading: isLoadingGrid } = useDailyGrid(todayStr)

  // Filtros de visualización
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all')

  // Mapeo rápido de turnos por cancha
  const gridCourtsMap = useMemo(() => {
    const map = new Map<string, DailyGridCourtItem>()
    if (gridData?.courts) {
      gridData.courts.forEach((gc) => {
        map.set(gc.courtId, gc)
      })
    }
    return map
  }, [gridData])

  // Obtener lista única de deportes presentes
  const availableSports = useMemo(() => {
    const sportSet = new Set<string>()
    courts.forEach((c) => {
      c.sports.forEach((s) => {
        if (s.sportName) sportSet.add(s.sportName)
      })
    })
    return Array.from(sportSet).sort()
  }, [courts])

  // Cálculo del estado en tiempo real para una cancha
  const getCourtLiveState = (court: CourtResponse): CourtLiveState => {
    if (!court.isActive) {
      return {
        state: 'inactive',
        badgeLabel: 'Inactiva',
        detailLabel: 'Cancha fuera de servicio',
        bookingsCount: 0,
      }
    }

    const gridCourt = gridCourtsMap.get(court.id)
    const bookings = (gridCourt?.bookings || []).filter((b) => b.status !== 'cancelled')
    const bookingsCount = bookings.length

    const nowMs = Date.now()

    // Comprobar si hay un turno o bloqueo en el horario actual
    const currentBooking = bookings.find((b) => {
      const startMs = new Date(b.startTimeUtc).getTime()
      const endMs = new Date(b.endTimeUtc).getTime()
      return nowMs >= startMs && nowMs < endMs
    })

    if (currentBooking) {
      const endLocal = new Date(currentBooking.endTimeUtc).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })

      if (currentBooking.status === 'blocked') {
        return {
          state: 'blocked',
          badgeLabel: 'Bloqueada',
          detailLabel: currentBooking.notes || `Bloqueada hasta las ${endLocal} hs`,
          bookingsCount,
        }
      }

      return {
        state: 'busy',
        badgeLabel: 'Ocupada',
        detailLabel: `En juego hasta las ${endLocal} hs · ${currentBooking.sportName}`,
        bookingsCount,
      }
    }

    // Si está libre, buscar el próximo turno del día
    const upcoming = bookings
      .filter((b) => new Date(b.startTimeUtc).getTime() > nowMs)
      .sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime())

    if (upcoming.length > 0) {
      const next = upcoming[0]
      const nextStart = new Date(next.startTimeUtc).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      return {
        state: 'free',
        badgeLabel: 'Libre ahora',
        detailLabel: `Próximo turno: ${nextStart} hs · ${next.sportName}`,
        bookingsCount,
      }
    }

    return {
      state: 'free',
      badgeLabel: 'Libre ahora',
      detailLabel: bookingsCount === 0 ? 'Sin turnos restantes hoy' : 'Próximas franjas disponibles',
      bookingsCount,
    }
  }

  // Filtrado de canchas
  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      // Filtro de disciplina
      const matchesSport =
        selectedSport === 'all' ||
        court.sports.some((s) => s.sportName.toLowerCase() === selectedSport.toLowerCase())

      if (!matchesSport) return false

      // Filtro de estado
      if (selectedStatus === 'all') return true

      const live = getCourtLiveState(court)
      if (selectedStatus === 'free') return live.state === 'free'
      if (selectedStatus === 'busy') return live.state === 'busy'
      if (selectedStatus === 'blocked') return live.state === 'blocked'

      return true
    })
  }, [courts, selectedSport, selectedStatus, gridCourtsMap])

  const isLoading = isLoadingCourts || isLoadingGrid

  const handleCardClick = (courtId: string) => {
    navigate(`/admin/bookings?courtId=${courtId}`)
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Resumen Operativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-300 p-4 shadow-sm">
        {/* Filtros por Deporte */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-neutral-600 uppercase tracking-wider mr-1">
            Deporte:
          </span>
          <button
            type="button"
            onClick={() => setSelectedSport('all')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
              selectedSport === 'all'
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Todos
          </button>
          {availableSports.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
                selectedSport.toLowerCase() === sport.toLowerCase()
                  ? 'bg-brand-sport text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Filtros por Estado en Vivo */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-neutral-600 uppercase tracking-wider mr-1">
            Estado:
          </span>
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('free')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
              selectedStatus === 'free'
                ? 'bg-emerald-800 text-white'
                : 'bg-neutral-100 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Libres
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('busy')}
            className={`min-h-[38px] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
              selectedStatus === 'busy'
                ? 'bg-amber-700 text-white'
                : 'bg-neutral-100 text-amber-900 hover:bg-amber-50'
            }`}
          >
            Ocupadas
          </button>
        </div>
      </div>

      {/* Estados de Carga Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-neutral-300 shadow-sm flex flex-col overflow-hidden animate-pulse"
            >
              <div className="h-48 w-full bg-neutral-200" />
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-32 bg-neutral-200" />
                  <div className="h-6 w-24 bg-neutral-200" />
                </div>
                <div className="h-4 w-48 bg-neutral-200" />
                <div className="h-16 w-full bg-neutral-200" />
                <div className="h-11 w-full bg-neutral-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : courts.length === 0 ? (
        /* Estado Vacío: Sin Canchas en el Predio */
        <div className="text-center py-12 border border-dashed border-neutral-300 bg-[#FAF8F5] p-8 space-y-4">
          <p className="text-lg font-bold text-neutral-950">No hay canchas registradas en el establecimiento.</p>
          <p className="text-sm font-medium text-neutral-700 max-w-md mx-auto">
            Configura los espacios deportivos de tu complejo para habilitar la grilla horaria y recepción de reservas.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/courts?tab=create')}
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-brand-sport text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-sport-hover transition-colors cursor-pointer shadow-sm"
          >
            Registrar Primera Cancha
          </button>
        </div>
      ) : filteredCourts.length === 0 ? (
        /* Estado Vacío de Filtro */
        <div className="text-center py-10 border border-dashed border-neutral-300 bg-[#FAF8F5] p-6 space-y-3">
          <p className="text-base font-bold text-neutral-950">
            No hay canchas que coincidan con los filtros seleccionados.
          </p>
          <p className="text-sm font-medium text-neutral-700">
            Intenta restablecer el filtro de disciplina o el estado en vivo.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSport('all')
              setSelectedStatus('all')
            }}
            className="min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-950 border border-neutral-400 hover:border-neutral-950 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Restablecer Filtros</span>
          </button>
        </div>
      ) : (
        /* Grilla de Cards Descriptivas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map((court) => {
            const live = getCourtLiveState(court)
            const primarySport = court.sports[0]?.sportName || ''
            const visual = resolveCourtImage(primarySport, court.surfaceType)

            return (
              <article
                key={court.id}
                onClick={() => handleCardClick(court.id)}
                className="group bg-white border border-neutral-300 shadow-sm hover:border-neutral-950 hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Fotografía de Cabecera Limpia (Sin etiquetas ni degradados decorativos) */}
                <div className="relative h-48 w-full overflow-hidden border-b border-neutral-200 bg-neutral-100">
                  <img
                    src={visual.imageUrl}
                    alt={visual.caption}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Contenido Operativo de la Card */}
                <div className="p-6 flex flex-col justify-between flex-1 space-y-5">
                  {/* Nombre y Estado en Vivo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-black text-neutral-950 uppercase tracking-tight group-hover:text-brand-sport transition-colors">
                        {court.name}
                      </h3>

                      {/* Badge de Estado en Vivo */}
                      {live.state === 'free' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex-shrink-0">
                          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span>{live.badgeLabel}</span>
                        </span>
                      )}

                      {live.state === 'busy' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 flex-shrink-0">
                          <span className="h-2 w-2 rounded-full bg-amber-600" />
                          <span>{live.badgeLabel}</span>
                        </span>
                      )}

                      {live.state === 'blocked' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-200 text-neutral-900 border border-neutral-300 flex-shrink-0">
                          <ShieldAlert className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2} />
                          <span>{live.badgeLabel}</span>
                        </span>
                      )}

                      {live.state === 'inactive' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-200 text-neutral-600 border border-neutral-300 flex-shrink-0">
                          <span>{live.badgeLabel}</span>
                        </span>
                      )}
                    </div>

                    {/* Detalle Operativo en Vivo / Próximo Turno */}
                    <p className="text-xs font-medium text-neutral-700 leading-relaxed">
                      {live.detailLabel}
                    </p>
                  </div>

                  {/* Resumen de Ocupación Diaria y Atributos Físicos */}
                  <div className="pt-3 border-t border-neutral-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-neutral-600" strokeWidth={2} />
                        <span>Ocupación de hoy:</span>
                      </div>
                      <span className="text-neutral-950">
                        {live.bookingsCount} {live.bookingsCount === 1 ? 'turno' : 'turnos'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span className="bg-neutral-100 text-neutral-900 px-2.5 py-1 font-bold border border-neutral-300">
                        {court.surfaceType}
                      </span>
                      <span className="bg-neutral-100 text-neutral-800 px-2.5 py-1 font-medium border border-neutral-300 inline-flex items-center gap-1">
                        <Warehouse className="h-3 w-3" strokeWidth={2} />
                        {court.isCovered ? 'Techada' : 'Al aire libre'}
                      </span>
                      <span className="bg-neutral-100 text-neutral-800 px-2.5 py-1 font-medium border border-neutral-300 inline-flex items-center gap-1">
                        <Zap className="h-3 w-3" strokeWidth={2} />
                        {court.hasLighting ? 'Con luz' : 'Sin luz'}
                      </span>
                    </div>
                  </div>

                  {/* Disciplinas y Tarifas Disponibles */}
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-700 uppercase">
                      <Clock className="h-3.5 w-3.5 text-neutral-600" strokeWidth={2} />
                      <span>Disciplinas y Tarifas:</span>
                    </div>
                    <div className="space-y-1.5">
                      {court.sports.map((sport) => (
                        <div
                          key={sport.courtSportId || sport.sportId}
                          className="bg-neutral-50 border border-neutral-200 p-2 text-xs flex items-center justify-between"
                        >
                          <span className="font-bold text-neutral-900">{sport.sportName}</span>
                          <span className="font-mono font-bold text-neutral-700">
                            ${sport.basePrice.toLocaleString('es-AR')} · {sport.durationMinutes} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón de Acción a la Grilla Diaria */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCardClick(court.id)
                      }}
                      className="min-h-[44px] w-full rounded-full bg-brand-sport text-white hover:bg-brand-sport-hover font-bold text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-between px-5 py-2.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <span>Abrir Schedule Diario</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
