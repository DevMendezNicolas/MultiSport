import React, { useState, useMemo } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
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

const DURATION_PRESETS = [30, 45, 60, 90, 120] as const

export type CourtCreationStep = 'infrastructure' | 'sports_pricing' | 'schedule'

interface StepConfig {
  id: CourtCreationStep
  label: string
  description: string
}

const STEPS: StepConfig[] = [
  {
    id: 'infrastructure',
    label: 'Infraestructura',
    description: 'Nombre, superficie e instalaciones',
  },
  {
    id: 'sports_pricing',
    label: 'Deportes y Tarifas',
    description: 'Disciplinas, precio y duración',
  },
  {
    id: 'schedule',
    label: 'Disponibilidad y Franjas',
    description: 'Días, horarios y esquemas',
  },
]

interface CreateCourtFormProps {
  onSuccess?: () => void
}

export const CreateCourtForm: React.FC<CreateCourtFormProps> = ({ onSuccess }) => {
  const { data: sports = [], isLoading: isLoadingSports } = useSports()
  const createCourtMutation = useCreateCourt()

  // Control de progresión por pasos
  const [currentStep, setCurrentStep] = useState<CourtCreationStep>('infrastructure')
  const [completedSteps, setCompletedSteps] = useState<Set<CourtCreationStep>>(new Set())

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

  // 2. Esquema de precios por deporte
  const [customizePricesBySport, setCustomizePricesBySport] = useState<boolean>(false)
  const [customSportConfigs, setCustomSportConfigs] = useState<
    Record<string, { basePrice: number; durationMinutes: number }>
  >({})

  // 3. Disponibilidad y Horarios Operativos
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0])
  const [openingTime, setOpeningTime] = useState<string>('08:00')
  const [closingTime, setClosingTime] = useState<string>('23:00')

  // 4. Modo Avanzado de Franjas Horarias
  const [isAdvancedPricingMode, setIsAdvancedPricingMode] = useState<boolean>(false)
  const [customPricingTiers, setCustomPricingTiers] = useState<CourtPricingTierPayload[]>([])

  // 5. Estado de validación
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Selección/Deselección de disciplinas deportivas
  const toggleSport = (sportId: string) => {
    setFormData((prev) => {
      const exists = prev.sportIds.includes(sportId)
      const nextSportIds = exists
        ? prev.sportIds.filter((id) => id !== sportId)
        : [...prev.sportIds, sportId]

      if (!exists && !customSportConfigs[sportId]) {
        setCustomSportConfigs((configs) => ({
          ...configs,
          [sportId]: {
            basePrice: prev.basePrice,
            durationMinutes: prev.durationMinutes,
          },
        }))
      }

      return { ...prev, sportIds: nextSportIds }
    })

    if (errors.sportIds) {
      setErrors((prev) => ({ ...prev, sportIds: '' }))
    }
  }

  // Selección/Deselección de días habilitados
  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    )
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

  // Generador de franjas simples automáticas respetando tarifas individuales si están configuradas
  const generateSimpleTiers = (): CourtPricingTierPayload[] => {
    if (customizePricesBySport && formData.sportIds.length > 0) {
      return selectedDays.flatMap((dayId) =>
        formData.sportIds.map((sportId) => ({
          dayOfWeek: dayId,
          startTime: openingTime,
          endTime: closingTime,
          price: customSportConfigs[sportId]?.basePrice ?? formData.basePrice,
          durationMinutes: customSportConfigs[sportId]?.durationMinutes ?? formData.durationMinutes,
          sportId,
        }))
      )
    }

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

  // Resumen visual del horario operativo y detección de trasnoche
  const scheduleSummary = useMemo(() => {
    const parseMins = (timeStr: string) => {
      const [h, m] = (timeStr || '00:00').split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }

    const startMins = parseMins(openingTime)
    const endMins = parseMins(closingTime)
    const isSameTime = startMins === endMins

    let totalMinutes = 0
    let crossesMidnight = false

    if (!isSameTime) {
      if (endMins > startMins) {
        totalMinutes = endMins - startMins
      } else {
        totalMinutes = 1440 - startMins + endMins
        crossesMidnight = true
      }
    }

    const duration = formData.durationMinutes > 0 ? formData.durationMinutes : 60
    const shiftCount = totalMinutes > 0 ? Math.floor(totalMinutes / duration) : 0

    return {
      totalMinutes,
      shiftCount,
      crossesMidnight,
      isSameTime,
      openingTime,
      closingTime,
    }
  }, [openingTime, closingTime, formData.durationMinutes])

  // Validación aislada por etapa
  const validateStep = (step: CourtCreationStep): boolean => {
    const newErrors: Record<string, string> = { ...errors }

    if (step === 'infrastructure') {
      delete newErrors.name
      delete newErrors.surfaceType

      if (!formData.name.trim()) {
        newErrors.name = 'El nombre de la cancha es obligatorio.'
      } else if (formData.name.trim().length > 100) {
        newErrors.name = 'El nombre no puede superar los 100 caracteres.'
      }

      if (!formData.surfaceType) {
        newErrors.surfaceType = 'Debe seleccionar un tipo de superficie.'
      }
    }

    if (step === 'sports_pricing') {
      delete newErrors.sportIds
      delete newErrors.basePrice
      delete newErrors.durationMinutes

      if (formData.sportIds.length === 0) {
        newErrors.sportIds = 'Debe seleccionar al menos una disciplina deportiva para esta cancha.'
      }

      if (formData.basePrice < 0) {
        newErrors.basePrice = 'El precio base no puede ser negativo.'
      }

      if (formData.durationMinutes <= 0) {
        newErrors.durationMinutes = 'La duración debe ser mayor a 0 minutos.'
      } else if (formData.durationMinutes % 15 !== 0) {
        newErrors.durationMinutes =
          'La duración debe ser múltiplo de 15 minutos (ej: 30, 45, 60, 90 min).'
      }
    }

    if (step === 'schedule') {
      delete newErrors.schedules
      delete newErrors.closingTime
      delete newErrors.pricingTiers

      if (selectedDays.length === 0) {
        newErrors.schedules = 'Debe seleccionar al menos un día habilitado para la cancha.'
      }

      if (!isAdvancedPricingMode && scheduleSummary.isSameTime) {
        newErrors.closingTime =
          'El horario de apertura y cierre no pueden ser idénticos. Ingrese un horario de fin posterior o de trasnoche.'
      }

      if (isAdvancedPricingMode) {
        if (customPricingTiers.length === 0) {
          newErrors.pricingTiers = 'Debe configurar al menos una franja horaria en modo avanzado.'
        }
        const hasIdenticalHours = customPricingTiers.some((t) => t.startTime === t.endTime)
        if (hasIdenticalHours) {
          newErrors.pricingTiers = 'Existen franjas horarias con horario de inicio y fin idénticos.'
        }
      }
    }

    setErrors(newErrors)
    const stepFields: Record<CourtCreationStep, string[]> = {
      infrastructure: ['name', 'surfaceType'],
      sports_pricing: ['sportIds', 'basePrice', 'durationMinutes'],
      schedule: ['schedules', 'closingTime', 'pricingTiers'],
    }

    const currentStepHasErrors = stepFields[step].some((field) => Boolean(newErrors[field]))
    return !currentStepHasErrors
  }

  // Validación completa previa al guardado
  const validateAll = (): { isValid: boolean; targetStep?: CourtCreationStep } => {
    for (const stepConfig of STEPS) {
      if (!validateStep(stepConfig.id)) {
        return { isValid: false, targetStep: stepConfig.id }
      }
    }
    return { isValid: true }
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
      if (currentStep === 'infrastructure') setCurrentStep('sports_pricing')
      else if (currentStep === 'sports_pricing') setCurrentStep('schedule')
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 'schedule') setCurrentStep('sports_pricing')
    else if (currentStep === 'sports_pricing') setCurrentStep('infrastructure')
  }

  const handleJumpToStep = (targetStep: CourtCreationStep) => {
    const stepOrder: CourtCreationStep[] = ['infrastructure', 'sports_pricing', 'schedule']
    const targetIndex = stepOrder.indexOf(targetStep)
    const currentIndex = stepOrder.indexOf(currentStep)

    if (targetIndex < currentIndex) {
      setCurrentStep(targetStep)
      return
    }

    for (let i = currentIndex; i < targetIndex; i++) {
      if (!validateStep(stepOrder[i])) {
        toast.error('Campos incompletos', {
          description: 'Por favor complete los campos requeridos de la etapa actual.',
        })
        return
      }
      setCompletedSteps((prev) => new Set([...prev, stepOrder[i]]))
    }

    setCurrentStep(targetStep)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (scheduleSummary.isSameTime && !isAdvancedPricingMode) {
      setErrors((prev) => ({
        ...prev,
        closingTime: 'El horario de apertura y cierre no pueden ser idénticos.',
      }))
      setCurrentStep('schedule')
      toast.error('Horario operativo inválido', {
        description: 'El horario de apertura y cierre no pueden ser idénticos.',
      })
      return
    }

    const { isValid, targetStep } = validateAll()
    if (!isValid && targetStep) {
      setCurrentStep(targetStep)
      toast.error('Datos incompletos', {
        description: 'Por favor completá los campos obligatorios antes de continuar.',
      })
      return
    }

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

      // Reset de estado
      setFormData({
        name: '',
        surfaceType: SURFACE_OPTIONS[0],
        isCovered: false,
        hasLighting: true,
        basePrice: 20000,
        durationMinutes: 60,
        sportIds: [],
      })
      setCustomizePricesBySport(false)
      setCustomSportConfigs({})
      setSelectedDays([1, 2, 3, 4, 5, 6, 0])
      setOpeningTime('08:00')
      setClosingTime('23:00')
      setIsAdvancedPricingMode(false)
      setCustomPricingTiers([])
      setCompletedSteps(new Set())
      setCurrentStep('infrastructure')
      setErrors({})

      onSuccess?.()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const problem = error.response.data
        if (problem.detail) {
          toast.error('Error al registrar cancha', {
            description: problem.detail,
          })
          return
        }

        if (problem.errors) {
          const detail = Object.values(problem.errors).flat().join(' ')
          toast.error('Error de validación', {
            description: detail,
          })
          return
        }
      }

      toast.error('Error al crear cancha', {
        description: 'Ocurrió un error inesperado al procesar la solicitud.',
      })
    }
  }

  // Deporte primario para la imagen de previsualización
  const firstSport = useMemo(() => {
    if (formData.sportIds.length === 0) return undefined
    return sports.find((s) => s.id === formData.sportIds[0])
  }, [sports, formData.sportIds])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Columna Izquierda: Formulario Estructurado en 3 Pasos */}
      <div className="lg:col-span-7 bg-[#16181D] border border-[#31343E] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-[#F2F3F5]">
        {/* Cabecera del Módulo */}
        <div className="border-b border-[#31343E] pb-4">
          <h2 className="text-xl sm:text-2xl font-black text-[#F2F3F5] uppercase tracking-tight font-headline">
            Registrar Nueva Cancha
          </h2>
          <p className="text-sm text-[#9497A1] mt-1 leading-relaxed font-medium">
            Ingresá las características físicas, disciplinas admitidas, días habilitados y tarifas operativas.
          </p>
        </div>

        {/* Stepper de Progresión Sobrio */}
        <nav aria-label="Progreso de alta de cancha" className="border-b border-[#31343E] pb-4">
          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((step) => {
              const isCurrent = currentStep === step.id
              const isDone = completedSteps.has(step.id)

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleJumpToStep(step.id)}
                  className={`min-h-[44px] text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'border-[#258653] bg-[#258653]/15 text-[#F2F3F5] shadow-xs'
                      : isDone
                      ? 'border-[#31343E] bg-[#22242B] text-[#F2F3F5] hover:border-[#327357]/60'
                      : 'border-[#31343E]/50 bg-transparent text-[#9497A1] hover:text-[#F2F3F5]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider truncate ${
                        isCurrent ? 'text-emerald-400' : ''
                      }`}
                    >
                      {step.label}
                    </span>
                    {isDone && !isCurrent && (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-[#9497A1] truncate hidden sm:block">
                    {step.description}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
              e.preventDefault()
              if (currentStep !== 'schedule') {
                handleNextStep()
              }
            }
          }}
          className="space-y-6"
        >
          {/* ETAPA 1: INFRAESTRUCTURA */}
          {currentStep === 'infrastructure' && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div className="border-b border-[#31343E] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] font-headline">
                  Infraestructura y Superficie
                </h3>
                <p className="text-xs font-medium text-[#9497A1] mt-0.5">
                  Identificá el espacio y sus condiciones estructurales.
                </p>
              </div>

              {/* Nombre de la Cancha */}
              <div className="space-y-1.5">
                <label
                  htmlFor="court-name"
                  className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider block"
                >
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
                  className={`w-full bg-[#22242B] border rounded-xl px-4 py-3 text-base sm:text-sm text-[#F2F3F5] placeholder:text-[#9497A1] focus:outline-hidden transition-colors ${
                    errors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#31343E] focus:border-[#258653]'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-400 font-mono mt-1">{errors.name}</p>}
              </div>

              {/* Tipo de Superficie */}
              <div className="space-y-1.5">
                <label
                  htmlFor="surface-type"
                  className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider block"
                >
                  Tipo de Superficie *
                </label>
                <select
                  id="surface-type"
                  value={formData.surfaceType}
                  onChange={(e) => {
                    setFormData({ ...formData, surfaceType: e.target.value })
                    if (errors.surfaceType) setErrors((prev) => ({ ...prev, surfaceType: '' }))
                  }}
                  className={`w-full bg-[#22242B] border rounded-xl px-4 py-3 text-base sm:text-sm text-[#F2F3F5] focus:outline-hidden transition-colors ${
                    errors.surfaceType
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#31343E] focus:border-[#258653]'
                  }`}
                >
                  {SURFACE_OPTIONS.map((surface) => (
                    <option key={surface} value={surface} className="bg-[#22242B] text-[#F2F3F5]">
                      {surface}
                    </option>
                  ))}
                </select>
                {errors.surfaceType && (
                  <p className="text-xs text-red-400 font-mono mt-1">{errors.surfaceType}</p>
                )}
              </div>

              {/* Características Físicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-3 p-3.5 border border-[#31343E] bg-[#22242B] rounded-xl min-h-[44px]">
                  <input
                    id="is-covered"
                    type="checkbox"
                    checked={formData.isCovered}
                    onChange={(e) => setFormData({ ...formData, isCovered: e.target.checked })}
                    className="h-4 w-4 rounded border-[#31343E] bg-[#16181D] text-[#258653] focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="is-covered"
                    className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] cursor-pointer select-none"
                  >
                    Techada / Cubierta
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3.5 border border-[#31343E] bg-[#22242B] rounded-xl min-h-[44px]">
                  <input
                    id="has-lighting"
                    type="checkbox"
                    checked={formData.hasLighting}
                    onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
                    className="h-4 w-4 rounded border-[#31343E] bg-[#16181D] text-[#258653] focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="has-lighting"
                    className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] cursor-pointer select-none"
                  >
                    Con Iluminación Artificial
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: DEPORTES Y TARIFAS */}
          {currentStep === 'sports_pricing' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-[#31343E] pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] font-headline">
                  Deportes Admitidos y Tarifas
                </h3>
                <p className="text-xs font-medium text-[#9497A1] mt-0.5">
                  Definí las disciplinas que se juegan en este espacio y las condiciones base.
                </p>
              </div>

              {/* Deportes Permitidos (Multiselección) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider">
                    Disciplinas Permitidas * ({formData.sportIds.length} seleccionadas)
                  </label>
                  <span className="text-[11px] font-mono text-[#9497A1]">
                    La primera define la imagen de referencia
                  </span>
                </div>

                {isLoadingSports ? (
                  <div className="h-16 bg-[#22242B] animate-pulse rounded-xl border border-[#31343E]" />
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
                          className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-left border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#258653] bg-[#258653]/15 text-emerald-400 shadow-xs'
                              : 'border-[#31343E] bg-[#22242B] text-[#9497A1] hover:border-[#327357]/60 hover:text-[#F2F3F5]'
                          }`}
                        >
                          <span className="truncate">{sport.name}</span>
                          {isSelected && (
                            <span className="flex items-center gap-1">
                              {isPrimarySport && (
                                <span className="text-[10px] font-mono font-bold text-white bg-[#258653] px-1.5 py-0.5 rounded-md">
                                  1°
                                </span>
                              )}
                              <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.sportIds && (
                  <p className="text-xs text-red-400 font-mono mt-1">{errors.sportIds}</p>
                )}
              </div>

              {/* Tarifas y Duración Base */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Precio Base */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="base-price"
                    className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider block"
                  >
                    Precio Base Estándar ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-xs text-[#327357] font-mono font-bold">
                      $
                    </span>
                    <input
                      id="base-price"
                      type="number"
                      min="0"
                      step="500"
                      value={formData.basePrice}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          basePrice: Math.max(0, Number(e.target.value)),
                        })
                        if (errors.basePrice) setErrors((prev) => ({ ...prev, basePrice: '' }))
                      }}
                      className={`w-full bg-[#22242B] border rounded-xl pl-8 pr-4 py-3 text-base sm:text-sm text-[#F2F3F5] focus:outline-hidden transition-colors font-mono ${
                        errors.basePrice
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#31343E] focus:border-[#258653]'
                      }`}
                    />
                  </div>
                  {errors.basePrice ? (
                    <p className="text-xs text-red-400 font-mono mt-1">{errors.basePrice}</p>
                  ) : (
                    <span className="text-xs font-mono text-[#9497A1] block">
                      Tarifa de referencia estándar por turno
                    </span>
                  )}
                </div>

                {/* Duración Estándar */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="duration-minutes"
                    className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider block"
                  >
                    Duración Estándar (minutos) *
                  </label>

                  {/* Botones Presets Rápidos */}
                  <div className="flex flex-wrap items-center gap-1.5 pb-1">
                    {DURATION_PRESETS.map((preset) => {
                      const isPresetActive = formData.durationMinutes === preset
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, durationMinutes: preset })
                            if (errors.durationMinutes) {
                              setErrors((prev) => ({ ...prev, durationMinutes: '' }))
                            }
                          }}
                          className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                            isPresetActive
                              ? 'border-[#258653] bg-[#258653] text-white shadow-xs'
                              : 'border-[#31343E] bg-[#22242B] text-[#9497A1] hover:border-[#327357]/60 hover:text-[#F2F3F5]'
                          }`}
                        >
                          {preset}m
                        </button>
                      )
                    })}
                  </div>

                  <input
                    id="duration-minutes"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={formData.durationMinutes}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setFormData({ ...formData, durationMinutes: Math.max(15, val) })
                      if (val % 15 === 0 && errors.durationMinutes) {
                        setErrors((prev) => ({ ...prev, durationMinutes: '' }))
                      }
                    }}
                    className={`w-full bg-[#22242B] border rounded-xl px-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] focus:outline-hidden transition-colors font-mono ${
                      errors.durationMinutes
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#31343E] focus:border-[#258653]'
                    }`}
                  />
                  {errors.durationMinutes ? (
                    <p className="text-xs text-red-400 font-mono mt-1">{errors.durationMinutes}</p>
                  ) : (
                    <span className="text-xs font-mono text-[#9497A1] block">
                      Intervalos múltiplos de 15 min (ej: 30, 45, 60, 90, 120)
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle Personalización por Deporte */}
              {formData.sportIds.length > 1 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 border border-[#31343E] bg-[#22242B] rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                        <span>Precios y duraciones diferenciales por deporte</span>
                      </span>
                      <span className="text-xs font-mono text-[#9497A1] block">
                        Permite fijar tarifas o tiempos específicos (ej: Pádel $15.000 / Tenis $10.000)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={customizePricesBySport}
                      onChange={(e) => setCustomizePricesBySport(e.target.checked)}
                      className="h-4 w-4 rounded border-[#31343E] bg-[#16181D] text-[#258653] focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {customizePricesBySport && (
                    <div className="space-y-2 border border-[#31343E] rounded-xl p-4 bg-[#1E2027]">
                      <span className="text-xs font-mono uppercase font-bold text-[#F2F3F5] block mb-2">
                        Configuración por disciplina deportiva:
                      </span>
                      {formData.sportIds.map((sportId) => {
                        const sport = sports.find((s) => s.id === sportId)
                        const currentConfig = customSportConfigs[sportId] || {
                          basePrice: formData.basePrice,
                          durationMinutes: formData.durationMinutes,
                        }

                        return (
                          <div
                            key={sportId}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#16181D] border border-[#31343E] rounded-xl"
                          >
                            <span className="text-xs font-bold uppercase text-[#F2F3F5] sm:w-32">
                              {sport?.name ?? 'Deporte'}:
                            </span>

                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs font-mono font-bold text-[#327357]">$</span>
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
                                  className="w-full bg-[#22242B] border border-[#31343E] rounded-lg px-3 py-1.5 text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
                                  placeholder="Precio"
                                />
                              </div>

                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs font-mono font-bold text-[#9497A1]">Min:</span>
                                <input
                                  type="number"
                                  min="15"
                                  max="240"
                                  step="15"
                                  value={currentConfig.durationMinutes}
                                  onChange={(e) => {
                                    const val = Math.max(15, Number(e.target.value))
                                    setCustomSportConfigs((prev) => ({
                                      ...prev,
                                      [sportId]: { ...currentConfig, durationMinutes: val },
                                    }))
                                  }}
                                  className="w-full bg-[#22242B] border border-[#31343E] rounded-lg px-3 py-1.5 text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
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
          )}

          {/* ETAPA 3: DISPONIBILIDAD Y FRANJAS */}
          {currentStep === 'schedule' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-[#31343E] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] font-headline">
                    Días y Horarios Operativos
                  </h3>
                  <p className="text-xs font-medium text-[#9497A1] mt-0.5">
                    Configurá días habilitados, horario general o franjas tarifarias avanzadas.
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => selectQuickDays('weekdays')}
                    className="min-h-[36px] text-xs font-mono font-bold uppercase bg-[#22242B] hover:bg-[#2d3039] text-[#F2F3F5] border border-[#31343E] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Lun-Vie
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickDays('all')}
                    className="min-h-[36px] text-xs font-mono font-bold uppercase bg-[#22242B] hover:bg-[#2d3039] text-[#F2F3F5] border border-[#31343E] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickDays('weekend')}
                    className="min-h-[36px] text-xs font-mono font-bold uppercase bg-[#22242B] hover:bg-[#2d3039] text-[#F2F3F5] border border-[#31343E] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Finde
                  </button>
                </div>
              </div>

              {/* Selector de Días */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider block">
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
                        className={`min-h-[44px] py-2 px-1 text-center border rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'border-[#258653] bg-[#258653] text-white shadow-xs'
                            : 'border-[#31343E] bg-[#22242B] text-[#9497A1] hover:border-[#327357]/60 hover:text-[#F2F3F5]'
                        }`}
                      >
                        <span>{day.short}</span>
                        <span className="text-[10px] font-mono font-bold">
                          {isSelected ? 'Activo' : 'Cerrado'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.schedules && (
                  <p className="text-xs text-red-400 font-mono mt-1">{errors.schedules}</p>
                )}
              </div>

              {/* Configuración Simple de Apertura y Cierre */}
              {!isAdvancedPricingMode && (
                <div className="p-4 sm:p-5 border border-[#31343E] bg-[#1E2027] rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#31343E] pb-2">
                    <span className="text-xs font-mono uppercase font-bold text-[#F2F3F5]">
                      Horario General de Funcionamiento
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#9497A1]">
                      Aplica a los días seleccionados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="opening-time"
                        className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider flex items-center gap-1.5"
                      >
                        <Clock className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                        <span>Horario de Apertura *</span>
                      </label>
                      <input
                        id="opening-time"
                        type="time"
                        value={openingTime}
                        onChange={(e) => {
                          setOpeningTime(e.target.value)
                          if (errors.closingTime) {
                            setErrors((prev) => ({ ...prev, closingTime: '' }))
                          }
                        }}
                        className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] font-mono focus:outline-hidden focus:border-[#258653]"
                      />
                      <span className="text-[11px] font-mono text-[#9497A1] block">
                        Comienzo de las actividades diarias
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="closing-time"
                        className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider flex items-center gap-1.5"
                      >
                        <Clock className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                        <span>Horario de Cierre *</span>
                      </label>
                      <input
                        id="closing-time"
                        type="time"
                        value={closingTime}
                        onChange={(e) => {
                          setClosingTime(e.target.value)
                          if (errors.closingTime) {
                            setErrors((prev) => ({ ...prev, closingTime: '' }))
                          }
                        }}
                        className={`w-full bg-[#16181D] border rounded-xl px-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] font-mono focus:outline-hidden ${
                          errors.closingTime
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#31343E] focus:border-[#258653]'
                        }`}
                      />
                      {errors.closingTime ? (
                        <p className="text-xs text-red-400 font-mono mt-1">{errors.closingTime}</p>
                      ) : (
                        <span className="text-[11px] font-mono text-[#9497A1] block">
                          Fin de actividades (puede cruzar medianoche)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Panel de Cálculo Operativo */}
                  <div
                    className={`border rounded-xl p-3 space-y-1 text-xs transition-colors ${
                      scheduleSummary.crossesMidnight
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                        : 'bg-[#16181D] border-[#31343E] text-[#9497A1]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {scheduleSummary.crossesMidnight ? (
                        <Clock className="h-4 w-4 text-amber-400 shrink-0" strokeWidth={2} />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-[#327357] shrink-0" strokeWidth={2} />
                      )}
                      <span className="text-xs font-mono uppercase tracking-wider text-[#F2F3F5]">
                        {scheduleSummary.crossesMidnight
                          ? 'Turno Trasnoche Activo (Cruce de Medianoche):'
                          : 'Cálculo Operativo:'}
                      </span>
                    </div>

                    <p className="font-mono text-xs leading-relaxed pl-5">
                      {scheduleSummary.isSameTime ? (
                        <span className="text-red-400 font-bold">
                          El horario de apertura y cierre no pueden ser idénticos.
                        </span>
                      ) : scheduleSummary.crossesMidnight ? (
                        <>
                          El horario abarca desde las{' '}
                          <strong className="text-[#F2F3F5] font-black">{scheduleSummary.openingTime} hs</strong>{' '}
                          hasta las{' '}
                          <strong className="text-[#F2F3F5] font-black">{scheduleSummary.closingTime} hs</strong>{' '}
                          de la madrugada del día siguiente. Capacidad estimada:{' '}
                          <strong className="text-emerald-400 font-black">
                            {scheduleSummary.shiftCount} turnos diarios
                          </strong>{' '}
                          de {formData.durationMinutes} min.
                        </>
                      ) : (
                        <>
                          Apertura:{' '}
                          <strong className="text-[#F2F3F5] font-black">{scheduleSummary.openingTime} hs</strong>{' '}
                          · Cierre:{' '}
                          <strong className="text-[#F2F3F5] font-black">{scheduleSummary.closingTime} hs</strong>.
                          Capacidad estimada:{' '}
                          <strong className="text-emerald-400 font-black">
                            {scheduleSummary.shiftCount} turnos diarios
                          </strong>{' '}
                          de {formData.durationMinutes} min.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* SECCIÓN COLAPSABLE: CONFIGURACIONES AVANZADAS */}
              <div className="border border-[#31343E] rounded-xl bg-[#1E2027] overflow-hidden">
                <button
                  type="button"
                  onClick={handleToggleAdvancedMode}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#22242B] transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-[#327357]" strokeWidth={2} />
                      <span>Configuraciones avanzadas de franjas y tarifas</span>
                    </span>
                    <span className="text-xs font-mono text-[#9497A1] block">
                      {isAdvancedPricingMode
                        ? 'Modo avanzado activo: podés configurar múltiples turnos, tarifas nocturnas y precios por deporte.'
                        : 'Hacé clic para configurar múltiples franjas por día (diurno/nocturno) o precios por deporte.'}
                    </span>
                  </div>
                  {isAdvancedPricingMode ? (
                    <ChevronUp className="h-5 w-5 text-[#9497A1] shrink-0" strokeWidth={2} />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#9497A1] shrink-0" strokeWidth={2} />
                  )}
                </button>

                {isAdvancedPricingMode && (
                  <div className="p-4 sm:p-6 border-t border-[#31343E] bg-[#16181D] space-y-4">
                    <PricingTiersEditor
                      tiers={customPricingTiers}
                      onChange={(updatedTiers) => {
                        setCustomPricingTiers(updatedTiers)
                        if (errors.pricingTiers) {
                          setErrors((prev) => ({ ...prev, pricingTiers: '' }))
                        }
                      }}
                      selectedDays={selectedDays}
                      sportIds={formData.sportIds}
                      sports={sports.filter((s) => formData.sportIds.includes(s.id))}
                      defaultPrice={formData.basePrice}
                      defaultDuration={formData.durationMinutes}
                    />
                    {errors.pricingTiers && (
                      <p className="text-xs text-red-400 font-mono mt-1">{errors.pricingTiers}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Barra de Navegación del Stepper y Guardado */}
          <div className="pt-4 border-t border-[#31343E] flex items-center justify-between gap-3">
            {currentStep !== 'infrastructure' ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#31343E] bg-[#22242B] text-[#F2F3F5] text-xs font-bold uppercase tracking-wider hover:bg-[#2d3039] transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                <span>Anterior</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep !== 'schedule' ? (
              <button
                key="btn-step-next"
                type="button"
                onClick={handleNextStep}
                className="min-h-[44px] px-7 py-2.5 rounded-xl bg-[#258653] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1E6E44] transition-all inline-flex items-center gap-2 shadow-md cursor-pointer ml-auto"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            ) : (
              <button
                key="btn-step-submit"
                type="submit"
                disabled={createCourtMutation.isPending}
                className="min-h-[44px] px-7 py-2.5 rounded-xl bg-[#258653] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1E6E44] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md cursor-pointer ml-auto"
              >
                <span>
                  {createCourtMutation.isPending ? 'Guardando Cancha...' : 'Crear Cancha'}
                </span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
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
