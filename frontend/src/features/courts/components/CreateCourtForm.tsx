import React, { useState, useMemo } from 'react'
import {
  ArrowRight,
  Check,
  Calendar,
  Clock,
  DollarSign,
  SlidersHorizontal,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useCreateCourt, useSports } from '../hooks/useCourts'
import type {
  CreateCourtPayload,
  CourtPricingTierPayload,
  CourtSportConfigPayload,
} from '../types'
import { CourtImagePreview } from './CourtImagePreview'
import { PricingTiersEditor } from './PricingTiersEditor'

const SURFACE_OPTIONS = [
  'Césped Sintético',
  'Césped Natural',
  'Cemento / Hormigón',
  'Parquet / Madera',
  'Polvo de Ladrillo',
  'Cristal / Blindex',
] as const

const DAYS_OF_WEEK = [
  { id: 1, short: 'Lun', name: 'Lunes' },
  { id: 2, short: 'Mar', name: 'Martes' },
  { id: 3, short: 'Mié', name: 'Miércoles' },
  { id: 4, short: 'Jue', name: 'Jueves' },
  { id: 5, short: 'Vie', name: 'Viernes' },
  { id: 6, short: 'Sáb', name: 'Sábado' },
  { id: 0, short: 'Dom', name: 'Domingo' },
] as const

interface CreateCourtFormProps {
  onSuccess?: () => void
}

export const CreateCourtForm: React.FC<CreateCourtFormProps> = ({ onSuccess }) => {
  const { data: sports = [], isLoading: isLoadingSports } = useSports()
  const createCourtMutation = useCreateCourt()

  // 1. Datos físicos generales
  const [formData, setFormData] = useState<{
    name: string
    surfaceType: string
    isCovered: boolean
    hasLighting: boolean
    basePrice: number
    durationMinutes: number
    sportIds: string[]
  }>({
    name: '',
    surfaceType: SURFACE_OPTIONS[0],
    isCovered: false,
    hasLighting: true,
    basePrice: 20000,
    durationMinutes: 60,
    sportIds: [],
  })

  // 2. Disponibilidad temporal simple
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [openingTime, setOpeningTime] = useState<string>('08:00')
  const [closingTime, setClosingTime] = useState<string>('23:00')

  // 3. Modalidad avanzada de franjas horarias y precios
  const [isAdvancedPricingMode, setIsAdvancedPricingMode] = useState<boolean>(false)
  const [customPricingTiers, setCustomPricingTiers] = useState<CourtPricingTierPayload[]>([])

  // 4. Personalización económica por deporte
  const [customizePricesBySport, setCustomizePricesBySport] = useState<boolean>(false)
  const [customSportConfigs, setCustomSportConfigs] = useState<
    Record<string, { basePrice: number; durationMinutes: number }>
  >({})

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Deporte primario seleccionado (para previsualización visual)
  const firstSport = useMemo(() => {
    if (formData.sportIds.length === 0) return undefined
    const firstId = formData.sportIds[0]
    return sports.find((s) => s.id === firstId)
  }, [formData.sportIds, sports])

  const toggleSport = (sportId: string) => {
    setFormData((prev) => {
      const exists = prev.sportIds.includes(sportId)
      const newIds = exists
        ? prev.sportIds.filter((id) => id !== sportId)
        : [...prev.sportIds, sportId]
      return { ...prev, sportIds: newIds }
    })

    if (!customSportConfigs[sportId]) {
      setCustomSportConfigs((prev) => ({
        ...prev,
        [sportId]: {
          basePrice: formData.basePrice,
          durationMinutes: formData.durationMinutes,
        },
      }))
    }

    if (errors.sportIds) {
      setErrors((prev) => ({ ...prev, sportIds: '' }))
    }
  }

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) => {
      const exists = prev.includes(dayId)
      const updated = exists ? prev.filter((d) => d !== dayId) : [...prev, dayId]
      return updated.sort((a, b) => {
        const orderA = a === 0 ? 7 : a
        const orderB = b === 0 ? 7 : b
        return orderA - orderB
      })
    })

    if (errors.schedules) {
      setErrors((prev) => ({ ...prev, schedules: '' }))
    }
  }

  const selectQuickDays = (type: 'weekdays' | 'all' | 'weekend') => {
    if (type === 'weekdays') {
      setSelectedDays([1, 2, 3, 4, 5])
    } else if (type === 'all') {
      setSelectedDays([1, 2, 3, 4, 5, 6, 0])
    } else {
      setSelectedDays([6, 0])
    }
    if (errors.schedules) {
      setErrors((prev) => ({ ...prev, schedules: '' }))
    }
  }

  // Generador de franjas simples automáticas
  const generateSimpleTiers = (): CourtPricingTierPayload[] => {
    return selectedDays.map((dayId) => ({
      dayOfWeek: dayId,
      startTime: openingTime,
      endTime: closingTime,
      price: formData.basePrice,
      durationMinutes: formData.durationMinutes,
    }))
  }

  // Activar modo avanzado inicializando con las franjas simples vigentes si está vacío
  const handleToggleAdvancedMode = () => {
    const nextState = !isAdvancedPricingMode
    setIsAdvancedPricingMode(nextState)

    if (nextState && customPricingTiers.length === 0) {
      setCustomPricingTiers(generateSimpleTiers())
    }
  }

  // Resumen visual del horario operativo
  const scheduleSummary = useMemo(() => {
    const parseMins = (timeStr: string) => {
      const [h, m] = (timeStr || '00:00').split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }

    const startMins = parseMins(openingTime)
    let endMins = parseMins(closingTime)
    if (closingTime === '00:00') endMins = 1440
    const crossesMidnight = endMins <= startMins
    const effectiveSpan = crossesMidnight ? 1440 - startMins + endMins : endMins - startMins
    const shiftCount = Math.max(1, Math.floor(effectiveSpan / (formData.durationMinutes || 60)))

    return {
      openingTime,
      closingTime,
      crossesMidnight,
      shiftCount,
    }
  }, [openingTime, closingTime, formData.durationMinutes])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres.'
    }

    if (!formData.surfaceType) {
      newErrors.surfaceType = 'Seleccioná el tipo de superficie.'
    }

    if (formData.sportIds.length === 0) {
      newErrors.sportIds = 'Seleccioná al menos un deporte admitido para esta cancha.'
    }

    if (formData.basePrice < 0) {
      newErrors.basePrice = 'El precio base no puede ser negativo.'
    }

    if (formData.durationMinutes <= 0) {
      newErrors.durationMinutes = 'La duración debe ser mayor a 0 minutos.'
    }

    if (selectedDays.length === 0) {
      newErrors.schedules = 'Debe seleccionar al menos un día de disponibilidad para la cancha.'
    }

    if (isAdvancedPricingMode && customPricingTiers.length === 0) {
      newErrors.pricingTiers = 'Debe configurar al menos una franja horaria en modo avanzado.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const effectiveTiers: CourtPricingTierPayload[] = isAdvancedPricingMode
      ? customPricingTiers
      : generateSimpleTiers()

    const customSportPricesPayload: CourtSportConfigPayload[] | undefined = customizePricesBySport
      ? formData.sportIds.map((sportId) => ({
          sportId,
          basePrice: customSportConfigs[sportId]?.basePrice ?? formData.basePrice,
          durationMinutes: customSportConfigs[sportId]?.durationMinutes ?? formData.durationMinutes,
        }))
      : undefined

    const payload: CreateCourtPayload = {
      name: formData.name.trim(),
      surfaceType: formData.surfaceType,
      isCovered: formData.isCovered,
      hasLighting: formData.hasLighting,
      basePrice: formData.basePrice,
      durationMinutes: formData.durationMinutes,
      sportIds: formData.sportIds,
      pricingTiers: effectiveTiers,
      customSportPrices: customSportPricesPayload,
    }

    try {
      await createCourtMutation.mutateAsync(payload)
      toast.success('Cancha creada exitosamente', {
        description: `Se registró "${formData.name.trim()}" con ${formData.sportIds.length} disciplina(s) y ${effectiveTiers.length} franja(s) de disponibilidad configurada(s).`,
      })

      // Reset form
      setFormData({
        name: '',
        surfaceType: SURFACE_OPTIONS[0],
        isCovered: false,
        hasLighting: true,
        basePrice: 20000,
        durationMinutes: 60,
        sportIds: [],
      })
      setSelectedDays([1, 2, 3, 4, 5])
      setOpeningTime('08:00')
      setClosingTime('23:00')
      setIsAdvancedPricingMode(false)
      setCustomPricingTiers([])
      setCustomizePricesBySport(false)
      setErrors({})
      onSuccess?.()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status
        const problem = error.response.data

        if (status === 409) {
          toast.error('Conflicto al crear la cancha', {
            description: problem?.detail || 'Ya existe una cancha con ese nombre o se generó una superposición de horarios.',
          })
          if (problem?.title?.toLowerCase().includes('nombre')) {
            setErrors((prev) => ({ ...prev, name: 'Nombre ya en uso en este complejo.' }))
          } else {
            setErrors((prev) => ({ ...prev, schedules: problem?.detail || 'Superposición de horarios.' }))
          }
          return
        }

        if (status === 400 && problem?.errors) {
          toast.error('Datos incompletos o inválidos')
          const serverErrors: Record<string, string> = {}
          Object.keys(problem.errors).forEach((key) => {
            const lowerKey = key.toLowerCase()
            serverErrors[lowerKey] = problem.errors[key][0]
          })
          setErrors(serverErrors)
          return
        }
      }

      toast.error('Error al registrar cancha', {
        description: 'No se pudo guardar la cancha en el servidor. Intentá nuevamente.',
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Columna Izquierda: Formulario Editorial */}
      <div className="lg:col-span-7 bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-neutral-200 pb-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-brand-red font-bold">
            FORMULARIO DE ALTA
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight mt-1">
            Registrar Nueva Cancha
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed">
            Ingresá las características físicas, disciplinas admitidas, días habilitados y tarifas operativas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: IDENTIFICACIÓN Y FÍSICOS */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-2">
              <span>01. Identificación y Superficie</span>
            </h3>

            {/* Nombre de la Cancha */}
            <div className="space-y-1.5">
              <label htmlFor="court-name" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                Nombre de Cancha *
              </label>
              <input
                id="court-name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                }}
                placeholder="Ej: Cancha 1 (Sintético) o Pista Central"
                className={`w-full bg-[#FAF8F5] border rounded-none px-4 py-3 text-base text-neutral-950 placeholder-neutral-400 focus:outline-none transition-colors ${
                  errors.name ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.name && <p className="text-xs text-red-600 font-mono mt-1">{errors.name}</p>}
            </div>

            {/* Deportes Permitidos (Multiselección) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                  Deportes Permitidos * ({formData.sportIds.length} seleccionados)
                </label>
                <span className="text-[11px] font-mono text-neutral-500">
                  El 1° seleccionado define la vista previa
                </span>
              </div>

              {isLoadingSports ? (
                <div className="h-16 bg-neutral-100 animate-pulse border border-neutral-200" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sports.map((sport) => {
                    const isSelected = formData.sportIds.includes(sport.id)
                    const isPrimarySport = formData.sportIds[0] === sport.id

                    return (
                      <button
                        key={sport.id}
                        type="button"
                        onClick={() => toggleSport(sport.id)}
                        className={`min-h-[44px] px-3.5 py-2 text-left border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-brand-red bg-brand-red/5 text-brand-red'
                            : 'border-neutral-200 bg-[#FAF8F5] text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        <span className="truncate">{sport.name}</span>
                        {isSelected && (
                          <span className="flex items-center gap-1">
                            {isPrimarySport && (
                              <span className="text-[9px] font-mono text-white bg-brand-red px-1 rounded-none">
                                1°
                              </span>
                            )}
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {errors.sportIds && <p className="text-xs text-red-600 font-mono mt-1">{errors.sportIds}</p>}
            </div>

            {/* Tipo de Superficie */}
            <div className="space-y-1.5">
              <label htmlFor="surface-type" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                Tipo de Superficie *
              </label>
              <select
                id="surface-type"
                value={formData.surfaceType}
                onChange={(e) => setFormData({ ...formData, surfaceType: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none px-4 py-3 text-base text-neutral-950 focus:outline-none focus:border-neutral-950 transition-colors"
              >
                {SURFACE_OPTIONS.map((surface) => (
                  <option key={surface} value={surface}>
                    {surface}
                  </option>
                ))}
              </select>
            </div>

            {/* Características Físicas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-3 p-3 border border-neutral-200 bg-[#FAF8F5] min-h-[44px]">
                <input
                  id="is-covered"
                  type="checkbox"
                  checked={formData.isCovered}
                  onChange={(e) => setFormData({ ...formData, isCovered: e.target.checked })}
                  className="h-4 w-4 rounded-none border-neutral-400 text-brand-red focus:ring-0"
                />
                <label htmlFor="is-covered" className="text-xs font-bold uppercase tracking-wider text-neutral-800 cursor-pointer select-none">
                  Techada
                </label>
              </div>

              <div className="flex items-center gap-3 p-3 border border-neutral-200 bg-[#FAF8F5] min-h-[44px]">
                <input
                  id="has-lighting"
                  type="checkbox"
                  checked={formData.hasLighting}
                  onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
                  className="h-4 w-4 rounded-none border-neutral-400 text-brand-red focus:ring-0"
                />
                <label htmlFor="has-lighting" className="text-xs font-bold uppercase tracking-wider text-neutral-800 cursor-pointer select-none">
                  Con Iluminación
                </label>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TARIFAS Y DURACIÓN BASE */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4" strokeWidth={2} />
                <span>02. Tarifas Base y Duración de Turnos</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="base-price" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                  Precio Base Estándar ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs text-neutral-400 font-mono">
                    $
                  </span>
                  <input
                    id="base-price"
                    type="number"
                    min="0"
                    step="500"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none pl-8 pr-4 py-3 text-base text-neutral-950 focus:outline-none focus:border-neutral-950 transition-colors font-mono"
                  />
                </div>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  Tarifa de referencia estándar por turno
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="duration-minutes" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                  Duración Estándar (minutos) *
                </label>
                <input
                  id="duration-minutes"
                  type="number"
                  min="15"
                  max="360"
                  step="5"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: Math.max(1, Number(e.target.value)) })}
                  className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none px-4 py-3 text-base text-neutral-950 focus:outline-none focus:border-neutral-950 transition-colors font-mono"
                />
                <span className="text-[10px] font-mono text-neutral-500 block">
                  Libremente configurable (ej: 45, 60, 75, 90)
                </span>
              </div>
            </div>

            {/* Toggle Personalización por Deporte */}
            {formData.sportIds.length > 1 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 border border-neutral-200 bg-[#FAF8F5]">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>Precios y duraciones diferenciales por deporte</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 block">
                      Permite fijar tarifas o tiempos específicos (ej: Pádel $15.000 / Tenis $10.000)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={customizePricesBySport}
                    onChange={(e) => setCustomizePricesBySport(e.target.checked)}
                    className="h-4 w-4 rounded-none border-neutral-400 text-brand-red focus:ring-0"
                  />
                </div>

                {customizePricesBySport && (
                  <div className="space-y-2 border border-neutral-200 p-4 bg-white">
                    <span className="text-xs font-mono uppercase font-bold text-neutral-800 block mb-2">
                      Configuración por disciplina deportiva:
                    </span>
                    {formData.sportIds.map((sportId) => {
                      const sport = sports.find((s) => s.id === sportId)
                      const currentConfig = customSportConfigs[sportId] || {
                        basePrice: formData.basePrice,
                        durationMinutes: formData.durationMinutes,
                      }

                      return (
                        <div key={sportId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#FAF8F5] border border-neutral-200">
                          <span className="text-xs font-bold uppercase text-neutral-900 sm:w-32">
                            {sport?.name ?? 'Deporte'}:
                          </span>

                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-[10px] font-mono text-neutral-500">$</span>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={currentConfig.basePrice}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value))
                                  setCustomSportConfigs((prev) => ({
                                    ...prev,
                                    [sportId]: { ...currentConfig, basePrice: val },
                                  }))
                                }}
                                className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-sm font-mono"
                                placeholder="Precio"
                              />
                            </div>

                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-[10px] font-mono text-neutral-500">Min:</span>
                              <input
                                type="number"
                                min="15"
                                max="360"
                                step="5"
                                value={currentConfig.durationMinutes}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value))
                                  setCustomSportConfigs((prev) => ({
                                    ...prev,
                                    [sportId]: { ...currentConfig, durationMinutes: val },
                                  }))
                                }}
                                className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-sm font-mono"
                                placeholder="Minutos"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: DISPONIBILIDAD TEMPORAL Y HORARIOS */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4" strokeWidth={2} />
                <span>03. Días y Horarios Operativos</span>
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectQuickDays('weekdays')}
                  className="text-[10px] font-mono uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 transition-colors"
                >
                  Lun-Vie
                </button>
                <button
                  type="button"
                  onClick={() => selectQuickDays('all')}
                  className="text-[10px] font-mono uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 transition-colors"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => selectQuickDays('weekend')}
                  className="text-[10px] font-mono uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 transition-colors"
                >
                  Finde
                </button>
              </div>
            </div>

            {/* Selector de Días */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider block">
                Días Habilitados * ({selectedDays.length} activos)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.id)
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`min-h-[44px] py-2 px-1 text-center border text-xs font-bold uppercase transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm'
                          : 'border-neutral-200 bg-[#FAF8F5] text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      <span>{day.short}</span>
                      <span className="text-[9px] font-mono opacity-70">{isSelected ? 'Activo' : 'Cerrado'}</span>
                    </button>
                  )
                })}
              </div>
              {errors.schedules && <p className="text-xs text-red-600 font-mono mt-1">{errors.schedules}</p>}
            </div>

            {/* Configuración Simple de Apertura y Cierre */}
            {!isAdvancedPricingMode && (
              <div className="p-4 border border-neutral-200 bg-[#FAF8F5] space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="text-xs font-mono uppercase font-bold text-neutral-800">
                    Horario General de Funcionamiento
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Aplica a los días seleccionados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="opening-time" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" strokeWidth={2} />
                      <span>Horario de Apertura *</span>
                    </label>
                    <input
                      id="opening-time"
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-none px-4 py-2.5 text-base text-neutral-950 font-mono focus:outline-none focus:border-neutral-950"
                    />
                    <span className="text-[10px] font-mono text-neutral-500 block">
                      Comienzo de las actividades diarias
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="closing-time" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" strokeWidth={2} />
                      <span>Horario de Cierre *</span>
                    </label>
                    <input
                      id="closing-time"
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-none px-4 py-2.5 text-base text-neutral-950 font-mono focus:outline-none focus:border-neutral-950"
                    />
                    <span className="text-[10px] font-mono text-neutral-500 block">
                      Fin de actividades (puede cruzar medianoche)
                    </span>
                  </div>
                </div>

                {/* Cálculo Visual */}
                <div className="bg-white border border-neutral-200 p-3 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-900 font-bold">
                    <AlertCircle className="h-3.5 w-3.5 text-brand-red flex-shrink-0" strokeWidth={2} />
                    <span>Cálculo Operativo:</span>
                  </div>
                  <p className="font-mono text-[11px] text-neutral-600 leading-relaxed pl-5">
                    Apertura: <strong className="text-neutral-950">{scheduleSummary.openingTime} hs</strong> · Cierre: <strong className="text-neutral-950">{scheduleSummary.closingTime} hs</strong>{scheduleSummary.crossesMidnight ? ' (cruza medianoche)' : ''}. Capacidad estimada: <strong className="text-neutral-950">{scheduleSummary.shiftCount} turnos diarios</strong> de {formData.durationMinutes} min.
                  </p>
                </div>
              </div>
            )}

            {/* SECCIÓN COLAPSABLE: CONFIGURACIONES AVANZADAS */}
            <div className="border border-neutral-300 bg-white">
              <button
                type="button"
                onClick={handleToggleAdvancedMode}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-brand-red" strokeWidth={2} />
                    <span>Configuraciones avanzadas de franjas y tarifas</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500 block">
                    {isAdvancedPricingMode
                      ? 'Modo avanzado activo: podés configurar múltiples turnos, tarifas nocturnas y precios por deporte.'
                      : 'Hacé clic para configurar múltiples franjas por día (diurno/nocturno) o precios por deporte.'}
                  </span>
                </div>
                {isAdvancedPricingMode ? (
                  <ChevronUp className="h-5 w-5 text-neutral-500 flex-shrink-0" strokeWidth={2} />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-500 flex-shrink-0" strokeWidth={2} />
                )}
              </button>

              {isAdvancedPricingMode && (
                <div className="p-4 sm:p-6 border-t border-neutral-200 bg-[#FAF8F5] space-y-4">
                  <PricingTiersEditor
                    tiers={customPricingTiers}
                    onChange={(updatedTiers) => {
                      setCustomPricingTiers(updatedTiers)
                      if (errors.pricingTiers) setErrors((prev) => ({ ...prev, pricingTiers: '' }))
                    }}
                    selectedDays={selectedDays}
                    sportIds={formData.sportIds}
                    sports={sports.filter((s) => formData.sportIds.includes(s.id))}
                    defaultPrice={formData.basePrice}
                    defaultDuration={formData.durationMinutes}
                  />
                  {errors.pricingTiers && (
                    <p className="text-xs text-red-600 font-mono mt-1">{errors.pricingTiers}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botón de Envío Ergonómico */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-neutral-500">
              * Creación atómica protegida con transacciones en base de datos
            </span>

            <button
              type="submit"
              disabled={createCourtMutation.isPending}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-full bg-brand-red text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-red-hover transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>{createCourtMutation.isPending ? 'Guardando Cancha...' : 'Crear Cancha'}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>

      {/* Columna Derecha: Previsualización Dinámica */}
      <div className="lg:col-span-5 sticky top-6">
        <CourtImagePreview
          firstSportName={firstSport?.name}
          surfaceType={formData.surfaceType}
          isCovered={formData.isCovered}
          hasLighting={formData.hasLighting}
          durationMinutes={formData.durationMinutes}
          basePrice={formData.basePrice}
        />
      </div>
    </div>
  )
}
