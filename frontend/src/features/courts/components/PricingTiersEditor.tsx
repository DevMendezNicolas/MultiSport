import React, { useMemo } from 'react'
import { Plus, Trash2, Clock, AlertCircle, RotateCcw } from 'lucide-react'
import { NumericInput } from '@/components/ui/numeric-input'
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

export const QUARTER_HOUR_TIME_OPTIONS: string[] = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4)
    .toString()
    .padStart(2, '0')
  const m = ((i % 4) * 15).toString().padStart(2, '0')
  return `${h}:${m}`
})

interface PricingTiersEditorProps {
  tiers: CourtPricingTierPayload[]
  onChange: (tiers: CourtPricingTierPayload[]) => void
  selectedDays: number[]
  sportIds: string[]
  sports: SportResponse[]
  defaultPrice: number
  defaultDuration: number
  customizePricesBySport?: boolean
  customSportConfigs?: Record<string, { basePrice: number; durationMinutes: number }>
}

export const PricingTiersEditor: React.FC<PricingTiersEditorProps> = ({
  tiers,
  onChange,
  selectedDays,
  sportIds,
  sports,
  defaultPrice,
  defaultDuration,
  customizePricesBySport = false,
  customSportConfigs = {},
}) => {
  const selectableSports = useMemo(
    () => sports.filter((s) => sportIds.includes(s.id)),
    [sports, sportIds]
  )

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

        if (Math.max(i1.startMins, i2.startMins) < Math.min(i1.endMins, i2.endMins)) {
          overlapSet.add(i1.tierIndex)
          overlapSet.add(i2.tierIndex)
        }
      }
    }

    return overlapSet
  }, [tiers])

  const getInheritedBaseValues = (sportId?: string) => {
    if (customizePricesBySport && sportId && customSportConfigs[sportId]) {
      return {
        price: customSportConfigs[sportId].basePrice,
        durationMinutes: customSportConfigs[sportId].durationMinutes,
      }
    }
    return {
      price: defaultPrice,
      durationMinutes: defaultDuration,
    }
  }

  const addTierForDay = (dayId: number) => {
    const targetSportId = customizePricesBySport ? sportIds[0] : undefined
    const relevantDayTiers = tiers.filter(
      (t) =>
        t.dayOfWeek === dayId &&
        (!customizePricesBySport || t.sportId === targetSportId)
    )

    let suggestedStart = '08:00'
    let suggestedEnd = '23:00'

    if (relevantDayTiers.length > 0) {
      const lastTier = relevantDayTiers[relevantDayTiers.length - 1]
      suggestedStart = lastTier.endTime
      const [h, m] = suggestedStart.split(':').map(Number)
      const nextH = (h + 1) % 24
      suggestedEnd = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }

    const inherited = getInheritedBaseValues(targetSportId)

    const newTier: CourtPricingTierPayload = {
      dayOfWeek: dayId,
      startTime: suggestedStart,
      endTime: suggestedEnd,
      price: inherited.price,
      durationMinutes: inherited.durationMinutes,
      sportId: targetSportId,
      isPriceCustom: false,
      isDurationCustom: false,
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

  const resetTierToBase = (index: number) => {
    const target = tiers[index]
    if (!target) return
    const inherited = getInheritedBaseValues(target.sportId)
    updateTier(index, {
      price: inherited.price,
      durationMinutes: inherited.durationMinutes,
      isPriceCustom: false,
      isDurationCustom: false,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#31343E] pb-3">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-[#F2F3F5] tracking-wider">
            Franjas Tarifarias por Día y Horario
          </span>
          <p className="text-xs font-medium text-[#9497A1] mt-0.5">
            {customizePricesBySport
              ? 'Cada franja hereda la tarifa y duración de su disciplina salvo que la edites manualmente.'
              : 'Cada franja hereda el precio y duración general salvo que personalices un turno específico (ej. nocturno).'}
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#327357] bg-[#258653]/15 px-3 py-1 rounded-lg border border-[#327357]/30">
          {tiers.length} franja(s) configurada(s)
        </span>
      </div>

      {selectedDays.length === 0 ? (
        <div className="p-4 border border-dashed border-[#31343E] rounded-xl text-center text-xs font-medium text-[#9497A1] bg-[#1E2027]/50">
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
                className="border border-[#31343E] bg-[#1E2027] rounded-xl shadow-xs p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#31343E] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-[#F2F3F5] font-mono tracking-wide">
                      {dayMeta?.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#9497A1] bg-[#16181D] px-2 py-0.5 border border-[#31343E] rounded-md">
                      {dayTierIndices.length} franja(s)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addTierForDay(dayId)}
                    className="min-h-[38px] px-3.5 py-1.5 bg-[#258653] hover:bg-[#1E6E44] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    <span>Agregar Franja</span>
                  </button>
                </div>

                {dayTierIndices.length === 0 ? (
                  <p className="text-xs text-[#9497A1] font-mono py-1">
                    Sin franjas asignadas para este día. Presioná &quot;Agregar Franja&quot; para definir disponibilidad.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {dayTierIndices.map(({ tier, index }) => {
                      const isOverlapping = overlappingIndices.has(index)
                      const crossesMidnight =
                        tier.endTime !== '00:00' &&
                        parseMins(tier.endTime) < parseMins(tier.startTime)
                      const invalidPrice = !tier.price || tier.price <= 0
                      const currentDuration = tier.durationMinutes ?? defaultDuration
                      const invalidDuration =
                        !currentDuration ||
                        currentDuration < 30 ||
                        currentDuration > 480 ||
                        currentDuration % 15 !== 0
                      const isCustomized = Boolean(tier.isPriceCustom || tier.isDurationCustom)

                      return (
                        <div
                          key={index}
                          className={`p-3 border rounded-xl transition-colors ${
                            isOverlapping || invalidPrice || invalidDuration
                              ? 'border-red-500/80 bg-red-950/20'
                              : 'border-[#31343E] bg-[#16181D]'
                          } flex flex-col gap-3`}
                        >
                          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 items-end">
                              {/* Desde */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-mono uppercase font-bold text-[#9497A1] block">
                                  Desde (hs)
                                </label>
                                <select
                                  value={tier.startTime}
                                  onChange={(e) =>
                                    updateTier(index, { startTime: e.target.value })
                                  }
                                  className="w-full bg-[#22242B] border border-[#31343E] rounded-lg px-2.5 py-2 text-base sm:text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653] cursor-pointer"
                                >
                                  {QUARTER_HOUR_TIME_OPTIONS.map((t) => (
                                    <option key={t} value={t} className="bg-[#22242B]">
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Hasta */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-mono uppercase font-bold text-[#9497A1] block">
                                  Hasta (hs)
                                </label>
                                <select
                                  value={tier.endTime}
                                  onChange={(e) =>
                                    updateTier(index, { endTime: e.target.value })
                                  }
                                  className="w-full bg-[#22242B] border border-[#31343E] rounded-lg px-2.5 py-2 text-base sm:text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653] cursor-pointer"
                                >
                                  {QUARTER_HOUR_TIME_OPTIONS.map((t) => (
                                    <option key={t} value={t} className="bg-[#22242B]">
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Precio */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <label className="text-[11px] font-mono uppercase font-bold text-[#9497A1]">
                                    Precio ($)
                                  </label>
                                  {tier.isPriceCustom && (
                                    <span className="text-[9px] font-mono uppercase font-bold text-emerald-400">
                                      Personalizado
                                    </span>
                                  )}
                                </div>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-[#327357] font-mono font-bold">
                                    $
                                  </span>
                                  <NumericInput
                                    value={tier.price}
                                    onChange={(val) =>
                                      updateTier(index, { price: val, isPriceCustom: true })
                                    }
                                    placeholder="Ej: 20000"
                                    className={`w-full bg-[#22242B] border rounded-lg pl-6 pr-2 py-1.5 text-base sm:text-sm font-mono text-[#F2F3F5] focus:outline-hidden ${
                                      tier.isPriceCustom
                                        ? 'border-[#258653]/70 focus:border-[#258653]'
                                        : 'border-[#31343E] focus:border-[#258653]'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Duración */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <label className="text-[11px] font-mono uppercase font-bold text-[#9497A1]">
                                    Duración (min)
                                  </label>
                                  {tier.isDurationCustom && (
                                    <span className="text-[9px] font-mono uppercase font-bold text-emerald-400">
                                      Personalizado
                                    </span>
                                  )}
                                </div>
                                <NumericInput
                                  value={tier.durationMinutes ?? defaultDuration}
                                  onChange={(val) =>
                                    updateTier(index, {
                                      durationMinutes: val,
                                      isDurationCustom: true,
                                    })
                                  }
                                  placeholder="Ej: 60"
                                  className={`w-full bg-[#22242B] border rounded-lg px-2.5 py-1.5 text-base sm:text-sm font-mono text-[#F2F3F5] focus:outline-hidden ${
                                    tier.isDurationCustom
                                      ? 'border-[#258653]/70 focus:border-[#258653]'
                                      : 'border-[#31343E] focus:border-[#258653]'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Disciplina específica (solo en modalidad personalizada) y acciones */}
                            <div className="flex items-center justify-between md:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-[#31343E]">
                              {customizePricesBySport ? (
                                <select
                                  value={tier.sportId || sportIds[0] || ''}
                                  onChange={(e) => {
                                    const nextSportId = e.target.value
                                    const nextConfig = customSportConfigs[nextSportId]
                                    updateTier(index, {
                                      sportId: nextSportId,
                                      ...(nextConfig
                                        ? {
                                            price: tier.isPriceCustom
                                              ? tier.price
                                              : nextConfig.basePrice,
                                            durationMinutes: tier.isDurationCustom
                                              ? tier.durationMinutes
                                              : nextConfig.durationMinutes,
                                          }
                                        : {}),
                                    })
                                  }}
                                  className="min-h-[38px] bg-[#22242B] border border-[#31343E] rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase text-[#F2F3F5] focus:outline-hidden focus:border-[#258653] cursor-pointer"
                                >
                                  {selectableSports.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-[#22242B]">
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[11px] font-mono font-bold text-[#9497A1] bg-[#22242B] px-2.5 py-1.5 rounded-lg border border-[#31343E]">
                                  Todas las disciplinas
                                </span>
                              )}

                              {isCustomized && (
                                <button
                                  type="button"
                                  onClick={() => resetTierToBase(index)}
                                  title="Restablecer al precio y duración base"
                                  className="min-h-[38px] px-2.5 py-1.5 bg-[#22242B] hover:bg-[#2d3039] border border-[#31343E] rounded-lg text-[11px] font-mono font-bold text-[#9497A1] hover:text-[#F2F3F5] inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                                  <span>Base</span>
                                </button>
                              )}

                              {crossesMidnight && (
                                <span className="text-[11px] font-mono uppercase font-bold bg-amber-950/40 text-amber-400 px-2 py-1 border border-amber-800/40 rounded-md flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-amber-500" strokeWidth={2} />
                                  <span>Cruza 00hs</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => removeTier(index)}
                                title="Eliminar franja"
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center text-[#9497A1] hover:text-red-400 transition-colors p-1 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={2} />
                              </button>
                            </div>
                          </div>

                          {tier.startTime === tier.endTime && (
                            <div className="w-full flex items-center gap-1.5 text-red-400 text-xs font-mono">
                              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>
                                Error: el horario de inicio y fin no pueden ser idénticos.
                              </span>
                            </div>
                          )}

                          {invalidPrice && (
                            <div className="w-full flex items-center gap-1.5 text-red-400 text-xs font-mono">
                              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>El precio de la franja debe ser mayor a $0.</span>
                            </div>
                          )}

                          {invalidDuration && (
                            <div className="w-full flex items-center gap-1.5 text-red-400 text-xs font-mono">
                              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>
                                La duración debe ser múltiplo de 15 min (entre 30 y 480 min).
                              </span>
                            </div>
                          )}

                          {isOverlapping && tier.startTime !== tier.endTime && (
                            <div className="w-full flex items-center gap-1.5 text-red-400 text-xs font-mono">
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
