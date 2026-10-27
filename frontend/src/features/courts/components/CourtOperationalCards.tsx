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
          badgeLabel: 'Mantenimiento',
          detailLabel: `Bloqueada hasta las ${endLocal} hs (${currentBooking.notes || 'Operativo'})`,
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
      const matchesSport =
        selectedSport === 'all' ||
        court.sports.some((s) => s.sportName.toLowerCase() === selectedSport.toLowerCase())

      if (!matchesSport) return false

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#22242B] border border-[#31343E] p-4 rounded-xl shadow-sm">
        {/* Filtros por Deporte */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mr-1">
            Deporte:
          </span>
          <button
            type="button"
            onClick={() => setSelectedSport('all')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border ${
              selectedSport === 'all'
                ? 'bg-[#D46211] text-white border-[#D46211]'
                : 'bg-[#17181C] text-[#9497A1] border-[#31343E]/60 hover:text-white hover:bg-[#292A2E]'
            }`}
          >
            Todos
          </button>
          {availableSports.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border ${
                selectedSport.toLowerCase() === sport.toLowerCase()
                  ? 'bg-[#D46211] text-white border-[#D46211]'
                  : 'bg-[#17181C] text-[#9497A1] border-[#31343E]/60 hover:text-white hover:bg-[#292A2E]'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Filtros por Estado en Vivo */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#9497A1] uppercase tracking-wider mr-1">
            Estado:
          </span>
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border ${
              selectedStatus === 'all'
                ? 'bg-[#F2F3F5] text-[#17181C] border-white font-extrabold'
                : 'bg-[#17181C] text-[#9497A1] border-[#31343E]/60 hover:text-white'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('free')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border ${
              selectedStatus === 'free'
                ? 'bg-[#327357] text-white border-[#327357]'
                : 'bg-[#17181C] text-[#9497A1] border-[#31343E]/60 hover:text-white'
            }`}
          >
            Libres
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('busy')}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border ${
              selectedStatus === 'busy'
                ? 'bg-[#D46211] text-white border-[#D46211]'
                : 'bg-[#17181C] text-[#9497A1] border-[#31343E]/60 hover:text-white'
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
              className="bg-[#22242B] border border-[#31343E] rounded-xl shadow-sm flex flex-col overflow-hidden animate-pulse"
            >
              <div className="h-48 w-full bg-[#17181C]" />
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-32 bg-[#17181C] rounded" />
                  <div className="h-6 w-24 bg-[#17181C] rounded" />
                </div>
                <div className="h-4 w-48 bg-[#17181C] rounded" />
                <div className="h-16 w-full bg-[#17181C] rounded" />
                <div className="h-11 w-full bg-[#17181C] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : courts.length === 0 ? (
        /* Estado Vacío: Sin Canchas en el Predio */
        <div className="text-center py-12 border border-dashed border-[#31343E] bg-[#22242B] p-8 rounded-xl space-y-4">
          <p className="text-lg font-bold text-[#F2F3F5]">No hay canchas registradas en el establecimiento.</p>
          <p className="text-sm font-medium text-[#9497A1] max-w-md mx-auto">
            Configura los espacios deportivos de tu complejo para habilitar la grilla horaria y recepción de reservas.
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin/courts?tab=create')}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#D46211] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#E37A24] transition-colors cursor-pointer shadow-sm"
          >
            Registrar Primera Cancha
          </button>
        </div>
      ) : filteredCourts.length === 0 ? (
        /* Estado Vacío de Filtro */
        <div className="text-center py-10 border border-dashed border-[#31343E] bg-[#22242B] p-6 rounded-xl space-y-3">
          <p className="text-base font-bold text-[#F2F3F5]">
            No hay canchas que coincidan con los filtros seleccionados.
          </p>
          <p className="text-sm font-medium text-[#9497A1]">
            Intenta restablecer el filtro de disciplina o el estado en vivo.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSport('all')
              setSelectedStatus('all')
            }}
            className="min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F2F3F5] bg-[#17181C] border border-[#31343E] hover:bg-[#292A2E] rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={2} />
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
                className="group bg-[#22242B] border border-[#31343E] rounded-xl shadow-md hover:border-[#D46211] transition-all flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Fotografía de Cabecera Limpia */}
                <div className="relative h-48 w-full overflow-hidden border-b border-[#31343E] bg-[#17181C]">
                  <img
                    src={visual.imageUrl}
                    alt={visual.caption}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Contenido Operativo de la Card */}
                <div className="p-5 flex flex-col justify-between flex-1 space-y-5">
                  {/* Nombre y Estado en Vivo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg sm:text-xl font-headline font-black text-[#F2F3F5] uppercase tracking-tight group-hover:text-[#D46211] transition-colors truncate">
                        {court.name}
                      </h3>

                      {/* Badge de Estado en Vivo */}
                      {live.state === 'free' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#327357]/20 text-[#92D4B3] border border-[#327357]/40 flex-shrink-0">
                          <span className="h-2 w-2 rounded-full bg-[#327357] animate-pulse" />
                          <span>{live.badgeLabel}</span>
                        </span>
                      )}

                      {live.state === 'busy' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#D46211]/20 text-[#FFB786] border border-[#D46211]/40 flex-shrink-0">
                          <span className="h-2 w-2 rounded-full bg-[#D46211]" />
                          <span>{live.badgeLabel}</span>
                        </span>
                      )}

                      {live.state === 'blocked' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#17181C] text-[#9497A1] border border-[#31343E] flex-shrink-0">
                          <ShieldAlert className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={2} />
                          <span>{live.badgeLabel}</span>
                        </span>
                      )}

                      {live.state === 'inactive' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#17181C] text-[#9497A1] border border-[#31343E] flex-shrink-0">
                          <span>{live.badgeLabel}</span>
                        </span>
                      )}
                    </div>

                    {/* Detalle Operativo en Vivo / Próximo Turno */}
                    <p className="text-xs font-medium text-[#9497A1] leading-relaxed">
                      {live.detailLabel}
                    </p>
                  </div>

                  {/* Resumen de Ocupación Diaria y Atributos Físicos */}
                  <div className="pt-3 border-t border-[#31343E] space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-[#9497A1]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={1.75} />
                        <span>Ocupación de hoy:</span>
                      </div>
                      <span className="text-[#F2F3F5]">
                        {live.bookingsCount} {live.bookingsCount === 1 ? 'turno' : 'turnos'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span className="bg-[#17181C] text-[#F2F3F5] px-2.5 py-1 font-bold rounded border border-[#31343E]">
                        {court.surfaceType}
                      </span>
                      <span className="bg-[#17181C] text-[#9497A1] px-2.5 py-1 font-medium rounded border border-[#31343E] inline-flex items-center gap-1">
                        <Warehouse className="h-3 w-3 text-[#D46211]" strokeWidth={1.75} />
                        {court.isCovered ? 'Techada' : 'Al aire libre'}
                      </span>
                      <span className="bg-[#17181C] text-[#9497A1] px-2.5 py-1 font-medium rounded border border-[#31343E] inline-flex items-center gap-1">
                        <Zap className="h-3 w-3 text-[#D46211]" strokeWidth={1.75} />
                        {court.hasLighting ? 'Con luz' : 'Sin luz'}
                      </span>
                    </div>
                  </div>

                  {/* Disciplinas y Tarifas Disponibles */}
                  <div className="pt-3 border-t border-[#31343E] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#9497A1] uppercase">
                      <Clock className="h-3.5 w-3.5 text-[#D46211]" strokeWidth={1.75} />
                      <span>Disciplinas y Tarifas:</span>
                    </div>
                    <div className="space-y-1.5">
                      {court.sports.map((sport) => (
                        <div
                          key={sport.courtSportId || sport.sportId}
                          className="bg-[#17181C] border border-[#31343E]/60 rounded-lg p-2 text-xs flex items-center justify-between"
                        >
                          <span className="font-bold text-[#F2F3F5]">{sport.sportName}</span>
                          <span className="font-mono font-bold text-[#327357]">
                            ${sport.basePrice.toLocaleString('es-AR')} · {sport.durationMinutes} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón de Acción a la Planilla de Turnos */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCardClick(court.id)
                      }}
                      className="min-h-[44px] w-full rounded-xl bg-[#327357] text-white hover:bg-[#285E46] font-bold text-xs uppercase tracking-wider inline-flex items-center justify-between px-5 py-2.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <span>Abrir Planilla de Turnos</span>
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
