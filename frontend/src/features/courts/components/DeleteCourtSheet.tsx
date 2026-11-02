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
        description: 'Ocurrió un error inesperado al procesar la solicitud.',
      })
    }
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} side="right">
      <div className="flex flex-col h-full bg-[#16181D] text-[#F2F3F5]">
        {/* Cabecera del Panel */}
        <SheetHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400 flex-shrink-0">
              <Trash2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#F2F3F5] uppercase tracking-tight font-headline">
                Dar de Baja Cancha
              </h2>
              <span className="text-xs font-mono text-[#9497A1] block">
                Baja lógica y desactivación operativa
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* Cuerpo Informativo */}
        <SheetBody className="space-y-6">
          {/* Tarjeta Resumen de la Cancha */}
          <div className="border border-[#31343E] rounded-xl p-4 bg-[#1E2027] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-[#258653]/15 text-[#327357] border border-[#327357]/30 px-2.5 py-0.5 rounded-md font-bold">
                {court.surfaceType}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {court.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-[#F2F3F5] tracking-tight">
              {court.name}
            </h3>

            <p className="text-xs text-[#9497A1]">
              {court.isCovered ? 'Techada' : 'Al aire libre'} ·{' '}
              {court.hasLighting ? 'Con iluminación' : 'Sin iluminación'}
            </p>

            {/* Disciplinas y Tarifas Base */}
            {court.sports && court.sports.length > 0 && (
              <div className="pt-3 border-t border-[#31343E] space-y-1.5">
                <span className="text-[10px] font-mono text-[#9497A1] uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#327357]" strokeWidth={2} />
                  <span>Disciplinas registradas:</span>
                </span>
                <div className="space-y-1">
                  {court.sports.map((s) => (
                    <div
                      key={s.courtSportId || s.sportId}
                      className="bg-[#16181D] border border-[#31343E] rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between font-mono"
                    >
                      <span className="font-bold text-[#F2F3F5]">{s.sportName}</span>
                      <span className="text-[#327357] font-bold">
                        ${Number(s.basePrice).toLocaleString('es-AR')} · {s.durationMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Banner de Advertencia de Soft Delete */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" strokeWidth={2} />
              <span>Advertencia Operativa</span>
            </div>
            <p className="text-xs text-[#F2F3F5] leading-relaxed">
              Esta acción es una <strong>baja lógica (soft delete)</strong>. La cancha dejará de estar disponible de inmediato para nuevas reservas y torneos.
            </p>
            <p className="text-[11px] text-[#9497A1] font-mono leading-relaxed">
              Los registros contables, pagos y turnos históricos ya disputados se mantendrán inmutables para fines de auditoría.
            </p>
          </div>

          {/* Banner de Conflicto 409 (Si existen turnos futuros) */}
          {conflictError && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5 text-red-400">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">
                    Operación Bloqueada por Conflicto
                  </h4>
                  <p className="text-xs leading-relaxed text-red-200 font-mono">
                    {conflictError}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-red-900/40 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(`/admin/bookings?courtId=${court.id}`)
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 bg-[#16181D] border border-red-700/60 hover:border-red-500 text-red-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>Ver Turnos en Agenda</span>
                </button>
              </div>
            </div>
          )}
        </SheetBody>

        {/* Footer con Acciones */}
        <SheetFooter className="justify-between gap-3 border-t border-[#31343E]">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteCourtMutation.isPending}
            className="min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#9497A1] hover:text-[#F2F3F5] bg-[#22242B] border border-[#31343E] hover:bg-[#2d3039] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={deleteCourtMutation.isPending}
            className="min-h-[44px] px-6 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            <span>Confirmar Baja Lógica</span>
          </button>
        </SheetFooter>
      </div>
    </Sheet>
  )
}
