import React, { useState, useEffect } from 'react'
import { Clock, Save, Copy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateComplexSchedules } from '../hooks/useComplex'
import type { ComplexProfile, ComplexScheduleItem } from '../types'

const DAYS_META = [
  { dayOfWeek: 1, name: 'Lunes', short: 'Lun' },
  { dayOfWeek: 2, name: 'Martes', short: 'Mar' },
  { dayOfWeek: 3, name: 'Miércoles', short: 'Mié' },
  { dayOfWeek: 4, name: 'Jueves', short: 'Jue' },
  { dayOfWeek: 5, name: 'Viernes', short: 'Vie' },
  { dayOfWeek: 6, name: 'Sábado', short: 'Sáb' },
  { dayOfWeek: 0, name: 'Domingo', short: 'Dom' },
] as const

interface OperatingHoursTabProps {
  profile: ComplexProfile
}

export const OperatingHoursTab: React.FC<OperatingHoursTabProps> = ({ profile }) => {
  const updateMutation = useUpdateComplexSchedules()

  const [schedules, setSchedules] = useState<ComplexScheduleItem[]>([])

  useEffect(() => {
    // Inicializar los 7 días asegurando que existan registros completos
    const existingMap = new Map(profile.schedules?.map((s) => [s.dayOfWeek, s]))
    const initialSchedules: ComplexScheduleItem[] = DAYS_META.map((meta) => {
      const found = existingMap.get(meta.dayOfWeek)
      return {
        dayOfWeek: meta.dayOfWeek,
        openingTime: found?.openingTime?.substring(0, 5) || '08:00',
        closingTime: found?.closingTime?.substring(0, 5) || '23:00',
        isClosed: found?.isClosed ?? false,
      }
    })
    setSchedules(initialSchedules)
  }, [profile])

  const handleUpdateDay = (
    dayOfWeek: number,
    patch: Partial<ComplexScheduleItem>
  ) => {
    setSchedules((prev) =>
      prev.map((item) => (item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item))
    )
  }

  const handleCopyFirstDaySchedule = () => {
    const monday = schedules.find((s) => s.dayOfWeek === 1)
    if (!monday) return

    setSchedules((prev) =>
      prev.map((item) => ({
        ...item,
        openingTime: monday.openingTime,
        closingTime: monday.closingTime,
      }))
    )
    toast.success('Horario del Lunes replicado a todos los días.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateMutation.mutateAsync({ schedules })
      toast.success('Horarios de atención actualizados exitosamente.')
    } catch {
      toast.error('Error al guardar los horarios de atención.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#1E2027] border border-[#31343E] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#31343E] pb-3">
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F2F3F5] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#327357]" strokeWidth={2} />
              <span>Horarios Generales de Apertura y Cierre del Predio</span>
            </h4>
            <p className="text-xs text-[#9497A1] mt-0.5 font-medium">
              Definí el rango horario operativo semanal durante el cual el predio deportivo está abierto al público.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyFirstDaySchedule}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#22242B] border border-[#31343E] hover:bg-[#2d3039] text-[#9497A1] hover:text-[#F2F3F5] text-xs font-mono font-bold uppercase inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            title="Copiar horario del lunes a todos los días"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Copiar Lunes a todos</span>
          </button>
        </div>

        {/* Grilla de los 7 Días */}
        <div className="space-y-2.5">
          {DAYS_META.map((meta) => {
            const current = schedules.find((s) => s.dayOfWeek === meta.dayOfWeek) || {
              dayOfWeek: meta.dayOfWeek,
              openingTime: '08:00',
              closingTime: '23:00',
              isClosed: false,
            }

            return (
              <div
                key={meta.dayOfWeek}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  current.isClosed
                    ? 'border-[#31343E]/50 bg-[#16181D]/60 opacity-60'
                    : 'border-[#31343E] bg-[#16181D]'
                }`}
              >
                <div className="flex items-center gap-3 sm:w-44">
                  <span className="h-8 w-10 flex items-center justify-center rounded-lg bg-[#22242B] text-xs font-mono font-bold text-[#F2F3F5] border border-[#31343E]">
                    {meta.short}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-[#F2F3F5] block">
                      {meta.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#9497A1]">
                      {current.isClosed ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 flex-1 sm:justify-end">
                  <div className="flex items-center gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase font-bold text-[#9497A1] block">
                        Apertura
                      </label>
                      <input
                        type="time"
                        disabled={current.isClosed}
                        value={current.openingTime}
                        onChange={(e) =>
                          handleUpdateDay(meta.dayOfWeek, { openingTime: e.target.value })
                        }
                        className="bg-[#22242B] border border-[#31343E] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653] disabled:opacity-40"
                      />
                    </div>

                    <span className="text-[#9497A1] font-mono text-xs pt-4">-</span>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase font-bold text-[#9497A1] block">
                        Cierre
                      </label>
                      <input
                        type="time"
                        disabled={current.isClosed}
                        value={current.closingTime}
                        onChange={(e) =>
                          handleUpdateDay(meta.dayOfWeek, { closingTime: e.target.value })
                        }
                        className="bg-[#22242B] border border-[#31343E] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653] disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 sm:pt-0 pl-1">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#9497A1] hover:text-[#F2F3F5] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={current.isClosed}
                        onChange={(e) =>
                          handleUpdateDay(meta.dayOfWeek, { isClosed: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-[#31343E] bg-[#22242B] text-[#258653] focus:ring-0 cursor-pointer"
                      />
                      <span>Cerrado este día</span>
                    </label>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Banner Informativo */}
        <div className="bg-[#16181D] border border-[#31343E] rounded-xl p-4 flex items-start gap-3 text-xs text-[#9497A1]">
          <AlertCircle className="h-4 w-4 text-[#327357] mt-0.5 shrink-0" strokeWidth={2} />
          <p className="leading-relaxed font-mono">
            Las canchas del predio adaptan su disponibilidad horaria dentro de estos límites de apertura y cierre institucional.
          </p>
        </div>

        {/* Botón de Guardado */}
        <div className="pt-4 border-t border-[#31343E] flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#258653] hover:bg-[#1E6E44] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" strokeWidth={2} />
            <span>{updateMutation.isPending ? 'Guardando...' : 'Guardar Horarios de Atención'}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
