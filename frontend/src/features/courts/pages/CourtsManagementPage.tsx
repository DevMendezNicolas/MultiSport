import React, { useState } from 'react'
import {
  Plus,
  SlidersHorizontal,
  Calendar,
  Clock,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { CreateCourtForm } from '../components/CreateCourtForm'
import { EditCourtModal } from '../components/EditCourtModal'
import { useCourts, useDeleteCourt } from '../hooks/useCourts'
import type { CourtResponse } from '../types'

type ActiveTab = 'create' | 'modify'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const CourtsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('create')
  const { data: courts = [], isLoading: isLoadingCourts } = useCourts()
  const deleteCourtMutation = useDeleteCourt()

  // Estado para modal de modificación
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)

  // Estado para diálogo de confirmación de eliminación lógica
  const [deletingCourt, setDeletingCourt] = useState<CourtResponse | null>(null)

  const handleOpenEdit = (courtId: string) => {
    setEditingCourtId(courtId)
    setIsEditModalOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditModalOpen(false)
    setEditingCourtId(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCourt) return

    try {
      await deleteCourtMutation.mutateAsync(deletingCourt.id)
      toast.success('Cancha dada de baja exitosamente', {
        description: `"${deletingCourt.name}" fue desactivada y ya no estará disponible para nuevas reservas.`,
      })
      setDeletingCourt(null)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data
        if (error.response.status === 409) {
          toast.error('No se puede eliminar la cancha', {
            description:
              problem?.detail ||
              'Existen reservas futuras confirmadas en esta cancha. Debe cancelarlas o reubicarlas primero.',
          })
          return
        }
      }
      toast.error('Error al dar de baja la cancha', {
        description: 'No se pudo completar la operación en el servidor.',
      })
    }
  }

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
              Administrá los espacios deportivos de tu predio. Da de alta nuevas canchas vinculadas a múltiples disciplinas, gestioná disponibilidad temporal y tarifas diferenciales.
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
            className={`min-h-[44px] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
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
            className={`min-h-[44px] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'modify'
                ? 'bg-neutral-950 text-white shadow-sm'
                : 'bg-white text-neutral-900 border border-neutral-300 hover:border-neutral-950'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
            <span>Consultar Canchas</span>
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
              Espacios deportivos registrados con sus disciplinas asociadas, disponibilidad semanal y tarifas.
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
              <p className="text-xs text-neutral-500">
                Utilizá la acción &quot;Crear Cancha&quot; para registrar el primer espacio de tu predio.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="mt-2 min-h-[44px] px-6 py-2.5 rounded-full bg-brand-red text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-red-hover transition-colors cursor-pointer"
              >
                Comenzar con Alta de Cancha
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court) => {
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
                          {court.isCovered ? 'Techada' : 'Al aire libre'} ·{' '}
                          {court.hasLighting ? 'Con iluminación' : 'Sin iluminación'}
                        </p>
                      </div>
                    </div>

                    {/* Días Operativos */}
                    {uniqueDays.length > 0 && (
                      <div className="space-y-1.5 border-t border-neutral-200 pt-3">
                        <div className="text-[10px] font-mono text-neutral-500 uppercase flex items-center gap-1">
                          <Calendar className="h-3 w-3" strokeWidth={2} />
                          <span>Días Habilitados ({uniqueDays.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {uniqueDays.map((dayNum) => (
                            <span
                              key={dayNum}
                              className="text-[10px] font-mono bg-neutral-200 px-1.5 py-0.5 text-neutral-800 font-bold"
                            >
                              {DAY_NAMES[dayNum]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deportes y Tarifas */}
                    <div className="pt-3 border-t border-neutral-200 space-y-2">
                      <div className="text-[10px] font-mono text-neutral-500 uppercase flex items-center gap-1">
                        <Clock className="h-3 w-3" strokeWidth={2} />
                        <span>Disciplinas y Tarifas:</span>
                      </div>
                      <div className="space-y-1.5">
                        {court.sports.map((s) => (
                          <div
                            key={s.courtSportId || s.sportId}
                            className="bg-white border border-neutral-200 p-2 text-xs flex items-center justify-between"
                          >
                            <span className="font-bold text-neutral-900">{s.sportName}</span>
                            <span className="font-mono text-[11px] text-neutral-600">
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
                        onClick={() => handleOpenEdit(court.id)}
                        className="flex-1 min-h-[40px] px-3 py-2 bg-white border border-neutral-300 hover:border-neutral-950 text-neutral-900 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Modificar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingCourt(court)}
                        title="Dar de baja cancha"
                        className="min-h-[40px] min-w-[40px] px-2.5 py-2 border border-neutral-300 hover:border-red-600 hover:bg-red-50 text-neutral-500 hover:text-red-600 inline-flex items-center justify-center transition-colors cursor-pointer"
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

      {/* Modal de Modificación de Cancha */}
      <EditCourtModal
        courtId={editingCourtId}
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
      />

      {/* Diálogo de Confirmación para Eliminación Lógica */}
      {deletingCourt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600 border-b border-neutral-200 pb-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
              <h3 className="text-base font-black uppercase text-neutral-950">
                Dar de Baja Cancha
              </h3>
            </div>

            <div className="space-y-2 text-xs text-neutral-600 leading-relaxed font-mono">
              <p>
                ¿Estás seguro de que deseás dar de baja la cancha{' '}
                <strong className="text-neutral-950">&quot;{deletingCourt.name}&quot;</strong>?
              </p>
              <p className="bg-[#FAF8F5] p-3 border border-neutral-200 text-neutral-700">
                Esta acción es una <strong>baja lógica (soft delete)</strong>. La cancha dejará de estar disponible para nuevas reservas. Si existen turnos futuros confirmados, la operación será bloqueada automáticamente para proteger las reservas existentes.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setDeletingCourt(null)}
                disabled={deleteCourtMutation.isPending}
                className="min-h-[40px] px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteCourtMutation.isPending}
                className="min-h-[40px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                <span>
                  {deleteCourtMutation.isPending ? 'Procesando...' : 'Confirmar Baja'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
