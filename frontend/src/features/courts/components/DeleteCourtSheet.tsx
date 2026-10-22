import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trash2,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import {
  Sheet,
  SheetHeader,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet'
import { useDeleteCourt } from '../hooks/useCourts'
import type { CourtResponse } from '../types'

interface DeleteCourtSheetProps {
  court: CourtResponse | null
  isOpen: boolean
  onClose: () => void
}

export const DeleteCourtSheet: React.FC<DeleteCourtSheetProps> = ({
  court,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate()
  const deleteCourtMutation = useDeleteCourt()
  const [conflictError, setConflictError] = useState<string | null>(null)

  // Limpiar mensaje de conflicto al abrir o cambiar de cancha
  useEffect(() => {
    if (isOpen) {
      setConflictError(null)
    }
  }, [isOpen, court])

  if (!court) return null

  const handleConfirmDelete = async () => {
    setConflictError(null)

    try {
      await deleteCourtMutation.mutateAsync(court.id)
      toast.success('Cancha dada de baja exitosamente', {
        description: `"${court.name}" fue desactivada y ya no estará disponible para nuevas reservas.`,
      })
      onClose()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 409) {
          const problem = error.response.data
          const detail =
            problem?.detail ||
            'Existen reservas futuras confirmadas en esta cancha. Debe cancelarlas o reubicarlas primero.'
          setConflictError(detail)
          return
        }
      }
      toast.error('Error al dar de baja la cancha', {
        description: 'No se pudo completar la operación en el servidor. Intentá nuevamente.',
      })
    }
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} side="right">
      <div className="flex flex-col h-full">
        {/* Cabecera del Panel */}
        <SheetHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
              <Trash2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-950 uppercase tracking-tight">
                Dar de Baja Cancha
              </h2>
              <span className="text-xs font-mono text-neutral-500 block">
                Baja lógica y desactivación operativa
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Cuerpo Informativo */}
        <SheetBody className="space-y-6">
          {/* Tarjeta Resumen de la Cancha */}
          <div className="border border-neutral-300 p-4 bg-[#FAF8F5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-neutral-900 text-white px-2 py-0.5 font-bold">
                {court.surfaceType}
              </span>
              <span className="text-[11px] font-mono text-emerald-700 font-bold">
                {court.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">
              {court.name}
            </h3>

            <p className="text-xs text-neutral-600">
              {court.isCovered ? 'Techada' : 'Al aire libre'} ·{' '}
              {court.hasLighting ? 'Con iluminación' : 'Sin iluminación'}
            </p>

            {/* Disciplinas y Tarifas Base */}
            {court.sports && court.sports.length > 0 && (
              <div className="pt-3 border-t border-neutral-200 space-y-1.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3" strokeWidth={2} />
                  <span>Disciplinas registradas:</span>
                </span>
                <div className="space-y-1">
                  {court.sports.map((s) => (
                    <div
                      key={s.courtSportId || s.sportId}
                      className="bg-white border border-neutral-200 px-2.5 py-1.5 text-xs flex items-center justify-between font-mono"
                    >
                      <span className="font-bold text-neutral-800">{s.sportName}</span>
                      <span className="text-neutral-600">
                        ${s.basePrice} · {s.durationMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Banner de Advertencia de Soft Delete */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" strokeWidth={2} />
              <span>Advertencia Operativa</span>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Esta acción es una <strong>baja lógica (soft delete)</strong>. La cancha dejará de estar disponible de inmediato para nuevas reservas y torneos.
            </p>
            <p className="text-[11px] text-neutral-500 font-mono leading-relaxed">
              Los registros contables, pagos y turnos históricos ya disputados se mantendrán inmutables para fines de auditoría.
            </p>
          </div>

          {/* Banner de Conflicto 409 (Si existen turnos futuros) */}
          {conflictError && (
            <div className="bg-red-50 border border-red-300 p-4 space-y-3 animate-in fade-in duration-200 shadow-xs">
              <div className="flex items-start gap-2.5 text-red-700">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
                    Operación Bloqueada por Conflicto
                  </h4>
                  <p className="text-xs leading-relaxed text-red-800 font-mono">
                    {conflictError}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-red-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(`/admin/bookings?courtId=${court.id}`)
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 bg-white border border-red-300 hover:border-red-600 text-red-700 hover:text-red-900 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Ver Turnos en Agenda</span>
                </button>
              </div>
            </div>
          )}
        </SheetBody>

        {/* Footer con Acciones */}
        <SheetFooter className="justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteCourtMutation.isPending}
            className="min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={deleteCourtMutation.isPending}
            className="min-h-[44px] px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            <span>
              {deleteCourtMutation.isPending ? 'Desactivando...' : 'Confirmar Baja'}
            </span>
          </button>
        </SheetFooter>
      </div>
    </Sheet>
  )
}
