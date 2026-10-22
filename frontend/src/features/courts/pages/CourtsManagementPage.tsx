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
    <div className="space-y-8 pb-12">
      {/* Cabecera Principal */}
      <section className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950 uppercase">
              Gestión de Canchas
            </h1>
          </div>

          <div className="flex flex-col sm:items-end gap-1 flex-shrink-0">
            <span className="text-xs font-mono font-bold text-neutral-700 uppercase">
              Canchas Registradas
            </span>
            <span className="text-2xl font-black text-neutral-950 font-mono">
              {isLoadingCourts ? '...' : courts.length}
            </span>
          </div>
        </div>

        {/* Selector de Acciones Principales en Orden Natural */}
        <div className="pt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleTabChange('list')}
            className={`min-h-[44px] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-brand-sport text-white shadow-sm hover:bg-brand-sport-hover'
                : 'bg-white text-neutral-950 border border-neutral-300 hover:border-neutral-950'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            <span>Consultar Canchas</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('create')}
            className={`min-h-[44px] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-brand-sport text-white shadow-sm hover:bg-brand-sport-hover'
                : 'bg-white text-neutral-950 border border-neutral-300 hover:border-neutral-950'
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
        <section className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
              Canchas Existentes
            </h2>
            <span className="text-xs font-mono font-bold text-neutral-700">
              {filteredCourts.length} de {courts.length} {courts.length === 1 ? 'espacio' : 'espacios'}
            </span>
          </div>

          {/* Barra de Herramientas: Búsqueda y Filtros de Disciplinas */}
          {!isLoadingCourts && courts.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#FAF8F5] p-4 border border-neutral-200">
              {/* Buscador */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre de cancha..."
                  className="w-full bg-white border border-neutral-300 pl-10 pr-9 py-2 text-sm font-medium text-neutral-950 placeholder-neutral-500 focus:outline-none focus:border-neutral-950 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-950 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filtro por Deporte */}
              {availableSports.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-neutral-700 uppercase mr-1">
                    Disciplina:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSportFilter('all')}
                    className={`min-h-[36px] px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedSportFilter === 'all'
                        ? 'bg-neutral-950 text-white'
                        : 'bg-white text-neutral-800 border border-neutral-300 hover:border-neutral-950'
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
                        className={`min-h-[36px] px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          selectedSportFilter === sport
                            ? 'bg-neutral-950 text-white'
                            : 'bg-white text-neutral-800 border border-neutral-300 hover:border-neutral-950'
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

          {/* Estado de Carga con Tarjetas Skeleton Proporcionales (Regla 5 de AGENTS.md) */}
          {isLoadingCourts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-neutral-300 p-5 bg-[#FAF8F5] flex flex-col justify-between space-y-5 shadow-sm animate-pulse"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-neutral-200" />
                      <div className="h-4 w-12 bg-neutral-200" />
                    </div>
                    <div className="h-6 w-3/4 bg-neutral-200" />
                    <div className="h-4 w-1/2 bg-neutral-200" />
                  </div>
                  <div className="space-y-2 border-t border-neutral-200 pt-3">
                    <div className="h-3 w-28 bg-neutral-200" />
                    <div className="flex gap-1.5">
                      <div className="h-5 w-8 bg-neutral-200" />
                      <div className="h-5 w-8 bg-neutral-200" />
                      <div className="h-5 w-8 bg-neutral-200" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <div className="h-3 w-32 bg-neutral-200" />
                    <div className="h-10 bg-neutral-200" />
                  </div>
                  <div className="pt-4 border-t border-neutral-200 flex gap-2">
                    <div className="h-10 flex-1 bg-neutral-200" />
                    <div className="h-10 flex-1 bg-neutral-200" />
                    <div className="h-10 w-10 bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : courts.length === 0 ? (
            /* Estado Vacío Global (Sin canchas registradas en el predio) */
            <div className="text-center py-12 border border-dashed border-neutral-300 bg-[#FAF8F5] p-6 space-y-3">
              <p className="text-base font-bold text-neutral-950">No hay canchas registradas todavía.</p>
              <p className="text-sm font-medium text-neutral-700">
                Utilizá la acción &quot;Crear Cancha&quot; para registrar el primer espacio de tu predio.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('create')}
                className="mt-2 min-h-[44px] px-6 py-2.5 rounded-full bg-brand-sport text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-sport-hover transition-colors cursor-pointer"
              >
                Comenzar con Alta de Cancha
              </button>
            </div>
          ) : filteredCourts.length === 0 ? (
            /* Estado Vacío de Búsqueda / Filtro */
            <div className="text-center py-12 border border-dashed border-neutral-300 bg-[#FAF8F5] p-6 space-y-3">
              <p className="text-base font-bold text-neutral-950">
                No se encontraron canchas que coincidan con los filtros aplicados.
              </p>
              <p className="text-sm font-medium text-neutral-700">
                Probá buscando con otro nombre o seleccionando otra disciplina deportiva.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedSportFilter('all')
                }}
                className="mt-2 min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-950 border border-neutral-400 hover:border-neutral-950 transition-colors cursor-pointer"
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
                    className="border border-neutral-300 p-5 bg-[#FAF8F5] flex flex-col justify-between space-y-5 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase bg-neutral-950 text-white px-2.5 py-1 tracking-wider">
                          {court.surfaceType}
                        </span>
                        <span className="text-xs font-mono text-emerald-800 font-black">
                          {court.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-neutral-950 tracking-tight">
                        {court.name}
                      </h3>
                      <div className="text-xs font-medium text-neutral-800 space-y-0.5">
                        <p>
                          {court.isCovered ? 'Techada' : 'Al aire libre'} ·{' '}
                          {court.hasLighting ? 'Con iluminación' : 'Sin iluminación'}
                        </p>
                      </div>
                    </div>

                    {/* Días Operativos */}
                    {uniqueDays.length > 0 && (
                      <div className="space-y-1.5 border-t border-neutral-200 pt-3">
                        <div className="text-xs font-mono font-bold text-neutral-700 uppercase flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                          <span>Días Habilitados ({uniqueDays.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueDays.map((dayNum) => (
                            <span
                              key={dayNum}
                              className="text-xs font-mono bg-neutral-200 px-2 py-0.5 text-neutral-950 font-bold border border-neutral-300"
                            >
                              {DAY_NAMES[dayNum]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deportes y Tarifas */}
                    <div className="pt-3 border-t border-neutral-200 space-y-2">
                      <div className="text-xs font-mono font-bold text-neutral-700 uppercase flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Disciplinas y Tarifas:</span>
                      </div>
                      <div className="space-y-1.5">
                        {court.sports.map((s) => (
                          <div
                            key={s.courtSportId || s.sportId}
                            className="bg-white border border-neutral-300 p-2.5 text-xs flex items-center justify-between"
                          >
                            <span className="text-sm font-bold text-neutral-950">{s.sportName}</span>
                            <span className="font-mono text-xs font-bold text-neutral-800">
                              ${s.basePrice} · {s.durationMinutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Barra de Acciones de Administración */}
                    <div className="pt-4 border-t border-neutral-200 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/bookings?courtId=${court.id}`)}
                        title="Ver agenda de reservas de esta cancha"
                        className="flex-1 min-h-[44px] px-2.5 py-2 bg-brand-sport/10 hover:bg-brand-sport/20 text-[#164734] border border-brand-sport/40 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="h-4 w-4" strokeWidth={2} />
                        <span>Agenda</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(court.id)}
                        className="flex-1 min-h-[44px] px-2.5 py-2 bg-white border border-neutral-400 hover:border-neutral-950 text-neutral-950 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
                        <span>Modificar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingCourt(court)}
                        title="Dar de baja cancha"
                        className="min-h-[44px] min-w-[44px] px-2.5 py-2 border border-neutral-400 hover:border-red-600 hover:bg-red-50 text-neutral-700 hover:text-red-700 inline-flex items-center justify-center transition-colors cursor-pointer"
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

