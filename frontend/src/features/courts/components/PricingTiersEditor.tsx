import React, { useMemo } from 'react'
import { Plus, Trash2, Clock, AlertCircle } from 'lucide-react'
import type { CourtPricingTierPayload, SportResponse } from '../types'

const DAYS_OF_WEEK = [
  { id: 1, short: 'Lun', name: 'Lunes' },
  { id: 2, short: 'Mar', name: 'Martes' },
  { id: 3, short: 'Mié', name: 'Miércoles' },
  { id: 4, short: 'Jue', name: 'Jueves' },
  { id: 5, short: 'Vie', name: 'Viernes' },
  { id: 6, short: 'Sáb', name: 'Sábado' },
  { id: 0, short: 'Dom', name: 'Domingo' },
] as const

interface PricingTiersEditorProps {
  tiers: CourtPricingTierPayload[]
  onChange: (tiers: CourtPricingTierPayload[]) => void
  selectedDays: number[]
  sportIds: string[]
  sports: SportResponse[]
  defaultPrice: number
  defaultDuration: number
}

export const PricingTiersEditor: React.FC<PricingTiersEditorProps> = ({
  tiers,
  onChange,
  selectedDays,
  sports,
  defaultPrice,
  defaultDuration,
}) => {
  // Función para normalizar minutos en [start, end)
  const parseMins = (timeStr: string) => {
    const [h, m] = (timeStr || '00:00').split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }

  // Detectar solapamientos internos descomponiendo cruces de medianoche idéntico al backend
  const overlappingIndices = useMemo(() => {
    const overlapSet = new Set<number>()

    interface IntervalItem {
      tierIndex: number
      dayOfWeek: number
      startMins: number
      endMins: number
      sportId?: string
    }

    const intervals: IntervalItem[] = []

    tiers.forEach((tier, idx) => {
      const start = parseMins(tier.startTime)
      const end = tier.endTime === '00:00' ? 1440 : parseMins(tier.endTime)

      if (start === end) {
        overlapSet.add(idx)
        return
      }

      if (end > start) {
        intervals.push({
          tierIndex: idx,
          dayOfWeek: tier.dayOfWeek,
          startMins: start,
          endMins: end,
          sportId: tier.sportId,
        })
      } else {
        // Cruza medianoche: día actual hasta 1440, día siguiente desde 0 hasta end
        intervals.push({
          tierIndex: idx,
          dayOfWeek: tier.dayOfWeek,
          startMins: start,
          endMins: 1440,
          sportId: tier.sportId,
        })
        const nextDay = (tier.dayOfWeek + 1) % 7
        intervals.push({
          tierIndex: idx,
          dayOfWeek: nextDay,
          startMins: 0,
          endMins: end,
          sportId: tier.sportId,
        })
      }
    })

    for (let i = 0; i < intervals.length; i++) {
      for (let j = i + 1; j < intervals.length; j++) {
        const i1 = intervals[i]
        const i2 = intervals[j]

        if (i1.tierIndex === i2.tierIndex) continue
        if (i1.dayOfWeek !== i2.dayOfWeek) continue

        const affectsSameSport =
          !i1.sportId || !i2.sportId || i1.sportId === i2.sportId
        if (!affectsSameSport) continue

        const overlaps = Math.max(i1.startMins, i2.startMins) < Math.min(i1.endMins, i2.endMins)
        if (overlaps) {
          overlapSet.add(i1.tierIndex)
          overlapSet.add(i2.tierIndex)
        }
      }
    }

    return overlapSet
  }, [tiers])

  const addTierForDay = (dayId: number) => {
    // Determinar horario sugerido basado en la última franja del día
    const dayTiers = tiers.filter((t) => t.dayOfWeek === dayId)
    let suggestedStart = '08:00'
    let suggestedEnd = '14:00'

    if (dayTiers.length > 0) {
      const lastTier = dayTiers[dayTiers.length - 1]
      suggestedStart = lastTier.endTime === '00:00' ? '00:00' : lastTier.endTime
      const startMins = parseMins(suggestedStart)
      const nextEndMins = Math.min(1440, startMins + 240) // +4hs por defecto
      const h = Math.floor(nextEndMins / 60).toString().padStart(2, '0')
      const m = (nextEndMins % 60).toString().padStart(2, '0')
      suggestedEnd = nextEndMins === 1440 ? '00:00' : `${h}:${m}`
    }

    const newTier: CourtPricingTierPayload = {
      dayOfWeek: dayId,
      startTime: suggestedStart,
      endTime: suggestedEnd,
      price: defaultPrice,
      durationMinutes: defaultDuration,
    }

    onChange([...tiers, newTier])
  }

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index))
  }

  const updateTier = (index: number, patch: Partial<CourtPricingTierPayload>) => {
    const updated = tiers.map((t, i) => (i === index ? { ...t, ...patch } : t))
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-neutral-900 tracking-wider">
            Franjas Tarifarias por Día y Horario
          </span>
          <p className="text-xs font-medium text-neutral-700 mt-0.5">
            Configurá horarios de apertura, precios diferenciados (diurno/nocturno) y duraciones de turno.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-200 px-2.5 py-1 border border-neutral-300">
          {tiers.length} franja(s) configurada(s)
        </span>
      </div>

      {selectedDays.length === 0 ? (
        <div className="p-4 border border-dashed border-neutral-300 text-center text-xs font-medium text-neutral-700 bg-[#FAF8F5]">
          Seleccioná al menos un día habilitado en la sección anterior para configurar franjas.
        </div>
      ) : (
        <div className="space-y-4">
          {selectedDays.map((dayId) => {
            const dayMeta = DAYS_OF_WEEK.find((d) => d.id === dayId)
            const dayTierIndices = tiers
              .map((t, idx) => ({ tier: t, index: idx }))
              .filter((item) => item.tier.dayOfWeek === dayId)

            return (
              <div
                key={dayId}
                className="border border-neutral-300 bg-white shadow-xs p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-neutral-950 font-mono tracking-wide">
                      {dayMeta?.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-800 bg-neutral-200 px-2 py-0.5 border border-neutral-300">
                      {dayTierIndices.length} franja(s)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addTierForDay(dayId)}
                    className="min-h-[38px] px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    <span>Agregar Franja</span>
                  </button>
                </div>

                {dayTierIndices.length === 0 ? (
                  <p className="text-xs text-neutral-600 font-mono py-1">
                    Sin franjas asignadas para este día. Presioná &quot;Agregar Franja&quot; para definir disponibilidad.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {dayTierIndices.map(({ tier, index }) => {
                      const isOverlapping = overlappingIndices.has(index)
                      const crossesMidnight =
                        tier.endTime !== '00:00' &&
                        parseMins(tier.endTime) < parseMins(tier.startTime)

                      return (
                        <div
                          key={index}
                          className={`p-3 border transition-colors ${
                            isOverlapping
                              ? 'border-red-500 bg-red-50/40'
                              : 'border-neutral-300 bg-[#FAF8F5]'
                          } flex flex-col md:flex-row md:items-center justify-between gap-3`}
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 items-end">
                            {/* Desde */}
                            <div className="space-y-1">
                              <label className="text-xs font-mono uppercase font-bold text-neutral-800 block">
                                Desde (hs)
                              </label>
                              <input
                                type="time"
                                value={tier.startTime}
                                onChange={(e) =>
                                  updateTier(index, { startTime: e.target.value })
                                }
                                className="w-full bg-white border border-neutral-300 px-2.5 py-1.5 text-sm font-mono text-neutral-950 focus:outline-none focus:border-neutral-950"
                              />
                            </div>

                            {/* Hasta */}
                            <div className="space-y-1">
                              <label className="text-xs font-mono uppercase font-bold text-neutral-800 block">
                                Hasta (hs)
                              </label>
                              <input
                                type="time"
                                value={tier.endTime}
                                onChange={(e) =>
                                  updateTier(index, { endTime: e.target.value })
                                }
                                className="w-full bg-white border border-neutral-300 px-2.5 py-1.5 text-sm font-mono text-neutral-950 focus:outline-none focus:border-neutral-950"
                              />
                            </div>

                            {/* Precio */}
                            <div className="space-y-1">
                              <label className="text-xs font-mono uppercase font-bold text-neutral-800 block">
                                Precio ($)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs text-neutral-600 font-mono font-bold">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="500"
                                  value={tier.price}
                                  onChange={(e) =>
                                    updateTier(index, {
                                      price: Math.max(0, Number(e.target.value)),
                                    })
                                  }
                                  className="w-full bg-white border border-neutral-300 pl-6 pr-2 py-1.5 text-sm font-mono text-neutral-950 focus:outline-none focus:border-neutral-950"
                                />
                              </div>
                            </div>

                            {/* Duración */}
                            <div className="space-y-1">
                              <label className="text-xs font-mono uppercase font-bold text-neutral-800 block">
                                Duración (min)
                              </label>
                              <input
                                type="number"
                                min="15"
                                max="240"
                                step="15"
                                value={tier.durationMinutes ?? defaultDuration}
                                onChange={(e) =>
                                  updateTier(index, {
                                    durationMinutes: Math.max(
                                      15,
                                      Number(e.target.value)
                                    ),
                                  })
                                }
                                className="w-full bg-white border border-neutral-300 px-2.5 py-1.5 text-sm font-mono text-neutral-950 focus:outline-none focus:border-neutral-950"
                              />
                            </div>
                          </div>

                          {/* Disciplina específica (si hay varias) y acciones */}
                          <div className="flex items-center justify-between md:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-neutral-200">
                            {sports.length > 1 && (
                              <select
                                value={tier.sportId ?? ''}
                                onChange={(e) =>
                                  updateTier(index, {
                                    sportId: e.target.value || undefined,
                                  })
                                }
                                className="bg-white border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-900 focus:outline-none"
                              >
                                <option value="">Todas las disciplinas</option>
                                {sports.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            )}

                            {crossesMidnight && (
                              <span className="text-xs font-mono uppercase font-bold bg-amber-100 text-amber-950 px-2 py-1 border border-amber-300 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-800" strokeWidth={2} />
                                <span>Cruza 00hs</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => removeTier(index)}
                              title="Eliminar franja"
                              className="min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-600 hover:text-red-700 transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>

                          {tier.startTime === tier.endTime && (
                            <div className="w-full flex items-center gap-1.5 text-red-600 text-xs font-mono pt-1">
                              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>
                                Error: el horario de inicio y fin no pueden ser idénticos.
                              </span>
                            </div>
                          )}

                          {isOverlapping && tier.startTime !== tier.endTime && (
                            <div className="w-full flex items-center gap-1.5 text-red-600 text-xs font-mono pt-1">
                              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>
                                Advertencia: esta franja se superpone con otra franja del mismo día y deporte.
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
