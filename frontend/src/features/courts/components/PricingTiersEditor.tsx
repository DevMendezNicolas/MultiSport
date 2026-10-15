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

  // Detectar solapamientos internos
  const overlappingIndices = useMemo(() => {
    const overlapSet = new Set<number>()

    for (let i = 0; i < tiers.length; i++) {
      const t1 = tiers[i]
      const t1Start = parseMins(t1.startTime)
      const t1End = t1.endTime === '00:00' ? 1440 : parseMins(t1.endTime)

      for (let j = i + 1; j < tiers.length; j++) {
        const t2 = tiers[j]
        // Mismo día
        if (t1.dayOfWeek !== t2.dayOfWeek) continue

        // Misma disciplina o al menos una es general (null/undefined)
        const affectsSameSport =
          !t1.sportId || !t2.sportId || t1.sportId === t2.sportId
        if (!affectsSameSport) continue

        const t2Start = parseMins(t2.startTime)
        const t2End = t2.endTime === '00:00' ? 1440 : parseMins(t2.endTime)

        // Evaluar solapamiento en día base
        const overlapMain =
          Math.max(t1Start, t2Start) < Math.min(t1End, t2End)

        if (overlapMain) {
          overlapSet.add(i)
          overlapSet.add(j)
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
          <span className="text-[11px] font-mono uppercase font-bold text-neutral-800 tracking-wider">
            Franjas Tarifarias por Día y Horario
          </span>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configurá horarios de apertura, precios diferenciados (diurno/nocturno) y duraciones de turno.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1">
          {tiers.length} franja(s) configurada(s)
        </span>
      </div>

      {selectedDays.length === 0 ? (
        <div className="p-4 border border-dashed border-neutral-300 text-center text-xs text-neutral-500 bg-[#FAF8F5]">
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
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-neutral-950 font-mono tracking-wide">
                      {dayMeta?.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5">
                      {dayTierIndices.length} franja(s)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addTierForDay(dayId)}
                    className="min-h-[36px] px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    <span>Agregar Franja</span>
                  </button>
                </div>

                {dayTierIndices.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-1 font-mono">
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
                              ? 'border-red-500 bg-red-50/30'
                              : 'border-neutral-200 bg-[#FAF8F5]'
                          } flex flex-col md:flex-row md:items-center justify-between gap-3`}
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 items-end">
                            {/* Desde */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono uppercase font-bold text-neutral-600 block">
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
                              <label className="text-[10px] font-mono uppercase font-bold text-neutral-600 block">
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
                              <label className="text-[10px] font-mono uppercase font-bold text-neutral-600 block">
                                Precio ($)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs text-neutral-400 font-mono">
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
                              <label className="text-[10px] font-mono uppercase font-bold text-neutral-600 block">
                                Duración (min)
                              </label>
                              <input
                                type="number"
                                min="15"
                                max="360"
                                step="5"
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
                                className="bg-white border border-neutral-300 px-2 py-1.5 text-xs text-neutral-800 focus:outline-none"
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
                              <span className="text-[9px] font-mono uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 border border-amber-200 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" strokeWidth={2} />
                                <span>Cruza 00hs</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => removeTier(index)}
                              title="Eliminar franja"
                              className="min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-red-600 transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>

                          {isOverlapping && (
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
