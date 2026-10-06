import React, { useState } from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { CreateCourtForm } from '../components/CreateCourtForm'
import { useCourts } from '../hooks/useCourts'

type ActiveTab = 'create' | 'modify'

export const CourtsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('create')
  const { data: courts = [], isLoading: isLoadingCourts } = useCourts()

  return (
    <div className="space-y-8 pb-12">
      {/* Cabecera Principal */}
      <section className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand-red font-bold">
              INSTALACIONES DEL COMPLEJO
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950 mt-1 uppercase">
              Gestión de Canchas
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-2xl leading-relaxed">
              Administrá los espacios deportivos de tu predio. Da de alta nuevas canchas vinculadas a múltiples disciplinas o editá superficies y tarifas.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1 flex-shrink-0">
            <span className="text-xs font-mono text-neutral-500 uppercase">
              Canchas Registradas
            </span>
            <span className="text-2xl font-black text-neutral-950 font-mono">
              {isLoadingCourts ? '...' : courts.length}
            </span>
          </div>
        </div>

        {/* Selector de Acciones Principales */}
        <div className="pt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`min-h-[44px] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-brand-red text-white shadow-sm'
                : 'bg-white text-neutral-900 border border-neutral-300 hover:border-neutral-950'
            }`}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Crear Cancha</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modify')}
            className={`min-h-[44px] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 ${
              activeTab === 'modify'
                ? 'bg-neutral-950 text-white shadow-sm'
                : 'bg-white text-neutral-900 border border-neutral-300 hover:border-neutral-950'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            <span>Modificar Cancha</span>
          </button>
        </div>
      </section>

      {/* Contenido según Acción Activa */}
      {activeTab === 'create' ? (
        <CreateCourtForm onSuccess={() => setActiveTab('modify')} />
      ) : (
        /* Vista de Modificación / Listado de Canchas Existentes */
        <section className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-neutral-200 pb-4">
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 font-bold">
              LISTADO OPERATIVO
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight mt-1">
              Canchas Existentes
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Módulo de edición planificado. Podés consultar las canchas creadas en el sistema.
            </p>
          </div>

          {isLoadingCourts ? (
            <div className="space-y-3">
              <div className="h-16 bg-neutral-100 animate-pulse border border-neutral-200" />
              <div className="h-16 bg-neutral-100 animate-pulse border border-neutral-200" />
            </div>
          ) : courts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-300 bg-[#FAF8F5] p-6 space-y-3">
              <p className="text-sm font-bold text-neutral-800">No hay canchas registradas todavía.</p>
              <p className="text-xs text-neutral-500">Utilizá la acción &quot;Crear Cancha&quot; para registrar el primer espacio de tu predio.</p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="mt-2 min-h-[44px] px-6 py-2.5 rounded-full bg-brand-red text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-red-hover transition-colors"
              >
                Comenzar con Alta de Cancha
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courts.map((court) => (
                <article
                  key={court.id}
                  className="border border-neutral-300 p-5 bg-[#FAF8F5] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase bg-neutral-900 text-white px-2 py-0.5">
                        {court.surfaceType}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold">
                        {court.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-neutral-950 tracking-tight">
                      {court.name}
                    </h3>
                    <div className="text-xs text-neutral-600 space-y-0.5">
                      <p>
                        {court.isCovered ? 'Techada' : 'Al aire libre'} · {court.hasLighting ? 'Con luz' : 'Sin luz'}
                      </p>
                      <p className="font-mono text-[11px] text-neutral-500">
                        Turnos de {court.durationMinutes} min · Tarifa base: ${court.basePrice}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <div className="text-[10px] font-mono text-neutral-500 mb-2 uppercase">
                      Deportes ({court.sports.length}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {court.sports.map((s) => (
                        <span
                          key={s.sportId}
                          className="text-[10px] font-mono bg-white border border-neutral-200 px-2 py-0.5 text-neutral-800"
                        >
                          {s.sportName}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
