import React, { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  SlidersHorizontal,
  Calendar,
  Clock,
  Trash2,
  Search,
  X,
} from 'lucide-react'
import { CreateCourtForm } from '../components/CreateCourtForm'
import { DeleteCourtSheet } from '../components/DeleteCourtSheet'
import { useCourts } from '../hooks/useCourts'
import type { CourtResponse } from '../types'

type ActiveTab = 'list' | 'create'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const CourtsManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Sincronización con URL (?tab=create vs ?tab=list) - Por defecto siempre 'list'
  const tabParam = searchParams.get('tab')
  const activeTab: ActiveTab = tabParam === 'create' ? 'create' : 'list'

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'create') {
      setSearchParams({ tab: 'create' })
    } else {
      setSearchParams({ tab: 'list' })
    }
  }

  const { data: courts = [], isLoading: isLoadingCourts } = useCourts()

  // Estados de búsqueda y filtro
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSportFilter, setSelectedSportFilter] = useState('all')

  // Estado para panel slide-over de confirmación de eliminación lógica (Zero-Popup)
  const [deletingCourt, setDeletingCourt] = useState<CourtResponse | null>(null)

  // Extraer disciplinas deportivas únicas disponibles
  const availableSports = useMemo(() => {
    const sportSet = new Set<string>()
    courts.forEach((c) => {
      c.sports.forEach((s) => {
        if (s.sportName) sportSet.add(s.sportName)
      })
    })
    return Array.from(sportSet).sort()
  }, [courts])

  // Canchas filtradas por búsqueda de nombre y disciplina
  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      const matchesSearch = court.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      const matchesSport =
        selectedSportFilter === 'all' ||
        court.sports.some(
          (s) => s.sportName.toLowerCase() === selectedSportFilter.toLowerCase()
        )
      return matchesSearch && matchesSport
    })
  }, [courts, searchQuery, selectedSportFilter])

  const handleOpenEdit = (courtId: string) => {
    navigate(`/admin/courts/${courtId}/edit`)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera Principal */}
      <section className="bg-[#16181D] border border-[#31343E] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#31343E]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F2F3F5] uppercase font-headline">
              Gestión de Canchas
            </h1>
            <p className="text-xs sm:text-sm text-[#9497A1] mt-1 font-medium">
              Administrá la infraestructura deportiva, disciplinas permitidas y esquemas tarifarios de tu predio.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="bg-[#22242B] border border-[#31343E] px-4 py-2 rounded-xl text-left sm:text-right">
              <span className="text-[10px] font-mono font-bold text-[#9497A1] uppercase block">
                Canchas Registradas
              </span>
              <span className="text-2xl font-black text-[#F2F3F5] font-mono">
                {isLoadingCourts ? '...' : courts.length}
              </span>
            </div>
          </div>
        </div>

        {/* Selector de Acciones Principales */}
        <div className="pt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleTabChange('list')}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#258653] text-white shadow-md shadow-[#258653]/20'
                : 'bg-[#22242B] text-[#9497A1] border border-[#31343E] hover:text-[#F2F3F5] hover:bg-[#2d3039]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            <span>Consultar Canchas</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('create')}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#258653] text-white shadow-md shadow-[#258653]/20'
                : 'bg-[#22242B] text-[#9497A1] border border-[#31343E] hover:text-[#F2F3F5] hover:bg-[#2d3039]'
            }`}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Crear Cancha</span>
          </button>
        </div>
      </section>

      {/* Contenido según Acción Activa */}
      {activeTab === 'create' ? (
        <CreateCourtForm onSuccess={() => handleTabChange('list')} />
      ) : (
        /* Vista de Listado / Consulta de Canchas Existentes */
        <section className="bg-[#16181D] border border-[#31343E] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#31343E] pb-4">
            <div>
              <h2 className="text-xl font-black text-[#F2F3F5] uppercase tracking-tight font-headline">
                Canchas Existentes
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#9497A1]">
              {filteredCourts.length} de {courts.length} {courts.length === 1 ? 'espacio' : 'espacios'}
            </span>
          </div>

          {/* Barra de Herramientas: Búsqueda y Filtros de Disciplinas */}
          {!isLoadingCourts && courts.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#22242B] p-3.5 sm:p-4 rounded-xl border border-[#31343E]">
              {/* Buscador */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9497A1]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre de cancha..."
                  className="w-full bg-[#16181D] border border-[#31343E] rounded-xl pl-10 pr-9 py-2 text-sm font-medium text-[#F2F3F5] placeholder-[#9497A1] focus:outline-hidden focus:border-[#258653] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9497A1] hover:text-[#F2F3F5] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filtro por Deporte */}
              {availableSports.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[#9497A1] uppercase mr-1">
                    Disciplina:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSportFilter('all')}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedSportFilter === 'all'
                        ? 'bg-[#258653] text-white shadow-xs'
                        : 'bg-[#16181D] text-[#9497A1] border border-[#31343E] hover:text-[#F2F3F5] hover:bg-[#22242B]'
                    }`}
                  >
                    Todas ({courts.length})
                  </button>
                  {availableSports.map((sport) => {
                    const count = courts.filter((c) =>
                      c.sports.some((s) => s.sportName.toLowerCase() === sport.toLowerCase())
                    ).length
                    return (
                      <button
                        key={sport}
                        type="button"
                        onClick={() => setSelectedSportFilter(sport)}
                        className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          selectedSportFilter === sport
                            ? 'bg-[#258653] text-white shadow-xs'
                            : 'bg-[#16181D] text-[#9497A1] border border-[#31343E] hover:text-[#F2F3F5] hover:bg-[#22242B]'
                        }`}
                      >
                        {sport} ({count})
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Estado de Carga con Tarjetas Skeleton */}
          {isLoadingCourts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-[#31343E] rounded-2xl p-5 bg-[#1E2027] flex flex-col justify-between space-y-5 shadow-sm animate-pulse"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-[#22242B] rounded" />
                      <div className="h-4 w-12 bg-[#22242B] rounded" />
                    </div>
                    <div className="h-6 w-3/4 bg-[#22242B] rounded" />
                    <div className="h-4 w-1/2 bg-[#22242B] rounded" />
                  </div>
                  <div className="space-y-2 border-t border-[#31343E] pt-3">
                    <div className="h-3 w-28 bg-[#22242B] rounded" />
                    <div className="flex gap-1.5">
                      <div className="h-5 w-8 bg-[#22242B] rounded" />
                      <div className="h-5 w-8 bg-[#22242B] rounded" />
                      <div className="h-5 w-8 bg-[#22242B] rounded" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#31343E] space-y-2">
                    <div className="h-3 w-32 bg-[#22242B] rounded" />
                    <div className="h-10 bg-[#22242B] rounded" />
                  </div>
                  <div className="pt-4 border-t border-[#31343E] flex gap-2">
                    <div className="h-10 flex-1 bg-[#22242B] rounded" />
                    <div className="h-10 flex-1 bg-[#22242B] rounded" />
                    <div className="h-10 w-10 bg-[#22242B] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : courts.length === 0 ? (
            /* Estado Vacío Global */
            <div className="text-center py-12 border border-dashed border-[#31343E] rounded-2xl bg-[#1E2027]/50 p-6 space-y-3">
              <p className="text-base font-bold text-[#F2F3F5]">No hay canchas registradas todavía.</p>
              <p className="text-sm font-medium text-[#9497A1]">
                Utilizá la acción &quot;Crear Cancha&quot; para registrar el primer espacio de tu predio.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('create')}
                className="mt-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-[#258653] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1E6E44] transition-colors cursor-pointer shadow-md"
              >
                Comenzar con Alta de Cancha
              </button>
            </div>
          ) : filteredCourts.length === 0 ? (
            /* Estado Vacío de Búsqueda / Filtro */
            <div className="text-center py-12 border border-dashed border-[#31343E] rounded-2xl bg-[#1E2027]/50 p-6 space-y-3">
              <p className="text-base font-bold text-[#F2F3F5]">
                No se encontraron canchas que coincidan con los filtros aplicados.
              </p>
              <p className="text-sm font-medium text-[#9497A1]">
                Probá buscando con otro nombre o seleccionando otra disciplina deportiva.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedSportFilter('all')
                }}
                className="mt-2 min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F2F3F5] border border-[#31343E] bg-[#22242B] hover:bg-[#2d3039] rounded-xl transition-colors cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            /* Grilla de Canchas */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourts.map((court) => {
                // Extraer días únicos con reglas
                const uniqueDays = Array.from(
                  new Set(
                    court.sports.flatMap((s) => (s.pricingRules || []).map((r) => r.dayOfWeek))
                  )
                ).sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))

                return (
                  <article
                    key={court.id}
                    className="border border-[#31343E] rounded-2xl p-5 sm:p-6 bg-[#1E2027] flex flex-col justify-between space-y-5 shadow-lg hover:border-[#327357]/60 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase bg-[#258653]/15 text-[#327357] border border-[#327357]/30 px-2.5 py-1 rounded-md tracking-wider">
                          {court.surfaceType}
                        </span>
                        <span className="text-xs font-mono font-bold flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              court.isActive ? 'bg-emerald-400' : 'bg-neutral-500'
                            }`}
                          />
                          <span className={court.isActive ? 'text-emerald-400' : 'text-[#9497A1]'}>
                            {court.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-[#F2F3F5] tracking-tight">
                        {court.name}
                      </h3>

                      <div className="text-xs font-medium text-[#9497A1] flex items-center gap-2">
                        <span>{court.isCovered ? 'Techada' : 'Al aire libre'}</span>
                        <span>·</span>
                        <span>{court.hasLighting ? 'Con iluminación' : 'Sin iluminación'}</span>
                      </div>
                    </div>

                    {/* Días Operativos */}
                    {uniqueDays.length > 0 && (
                      <div className="space-y-2 border-t border-[#31343E] pt-3">
                        <div className="text-[11px] font-mono font-bold text-[#9497A1] uppercase flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                          <span>Días Habilitados ({uniqueDays.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueDays.map((dayNum) => (
                            <span
                              key={dayNum}
                              className="text-xs font-mono bg-[#16181D] px-2 py-0.5 text-[#F2F3F5] font-bold border border-[#31343E] rounded-md"
                            >
                              {DAY_NAMES[dayNum]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deportes y Tarifas */}
                    <div className="pt-3 border-t border-[#31343E] space-y-2">
                      <div className="text-[11px] font-mono font-bold text-[#9497A1] uppercase flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                        <span>Disciplinas y Tarifas Base:</span>
                      </div>
                      <div className="space-y-1.5">
                        {court.sports.map((s) => (
                          <div
                            key={s.courtSportId || s.sportId}
                            className="bg-[#16181D] border border-[#31343E] p-2.5 rounded-xl text-xs flex items-center justify-between"
                          >
                            <span className="text-sm font-bold text-[#F2F3F5]">{s.sportName}</span>
                            <span className="font-mono text-xs font-bold text-[#327357]">
                              ${Number(s.basePrice).toLocaleString('es-AR')} · {s.durationMinutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Barra de Acciones de Administración */}
                    <div className="pt-4 border-t border-[#31343E] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/bookings?courtId=${court.id}`)}
                        title="Ver agenda de reservas de esta cancha"
                        className="flex-1 min-h-[44px] px-3 py-2 bg-[#258653]/15 hover:bg-[#258653]/25 text-emerald-400 border border-[#258653]/40 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="h-4 w-4" strokeWidth={2} />
                        <span>Ver Agenda</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(court.id)}
                        className="flex-1 min-h-[44px] px-3 py-2 bg-[#22242B] border border-[#31343E] hover:bg-[#2d3039] text-[#F2F3F5] rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
                        <span>Modificar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingCourt(court)}
                        title="Dar de baja cancha"
                        className="min-h-[44px] min-w-[44px] px-3 py-2 bg-[#22242B] border border-[#31343E] hover:border-red-500/50 hover:bg-red-950/30 text-[#9497A1] hover:text-red-400 rounded-xl inline-flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Panel Slide-over Lateral de Confirmación de Baja (Regla 13 Zero-Popup) */}
      <DeleteCourtSheet
        court={deletingCourt}
        isOpen={Boolean(deletingCourt)}
        onClose={() => setDeletingCourt(null)}
      />
    </div>
  )
}
