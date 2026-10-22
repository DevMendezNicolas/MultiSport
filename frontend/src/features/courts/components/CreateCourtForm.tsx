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

  // Resumen visual del horario operativo y detección de trasnoche
  const scheduleSummary = useMemo(() => {
    const parseMins = (timeStr: string) => {
      const [h, m] = (timeStr || '00:00').split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }

    const startMins = parseMins(openingTime)
    let endMins = parseMins(closingTime)
    if (closingTime === '00:00') endMins = 1440

    const isSameTime = openingTime === closingTime
    const crossesMidnight = endMins < startMins
    const effectiveSpan = crossesMidnight
      ? 1440 - startMins + endMins
      : Math.max(0, endMins - startMins)
    const shiftCount =
      effectiveSpan > 0 && formData.durationMinutes > 0
        ? Math.max(1, Math.floor(effectiveSpan / formData.durationMinutes))
        : 0

    return {
      openingTime,
      closingTime,
      isSameTime,
      crossesMidnight,
      effectiveSpan,
      shiftCount,
    }
  }, [openingTime, closingTime, formData.durationMinutes])

  // Validaciones por paso individual
  const validateStep = (step: CourtCreationStep): boolean => {
    const newErrors: Record<string, string> = { ...errors }

    if (step === 'infrastructure') {
      delete newErrors.name
      delete newErrors.surfaceType

      const trimmedName = formData.name.trim()
      if (!trimmedName || trimmedName.length < 2) {
        newErrors.name = 'El nombre debe tener al menos 2 caracteres.'
      } else if (trimmedName.length > 100) {
        newErrors.name = 'El nombre no puede exceder 100 caracteres.'
      }

      if (!formData.surfaceType) {
        newErrors.surfaceType = 'Seleccioná el tipo de superficie.'
      }
    }

    if (step === 'sports_pricing') {
      delete newErrors.sportIds
      delete newErrors.basePrice
      delete newErrors.durationMinutes

      if (formData.sportIds.length === 0) {
        newErrors.sportIds = 'Seleccioná al menos un deporte admitido para esta cancha.'
      }

      if (formData.basePrice < 0) {
        newErrors.basePrice = 'El precio base no puede ser negativo.'
      }

      if (formData.durationMinutes <= 0) {
        newErrors.durationMinutes = 'La duración debe ser mayor a 0 minutos.'
      } else if (formData.durationMinutes % 15 !== 0) {
        newErrors.durationMinutes = 'La duración debe ser múltiplo de 15 minutos (ej: 30, 45, 60, 90 min).'
      }

      if (customizePricesBySport) {
        formData.sportIds.forEach((sId) => {
          const cfg = customSportConfigs[sId]
          if (cfg) {
            delete newErrors[`sport_${sId}_price`]
            delete newErrors[`sport_${sId}_duration`]

            if (cfg.basePrice < 0) {
              newErrors[`sport_${sId}_price`] = 'El precio no puede ser negativo.'
            }
            if (cfg.durationMinutes <= 0 || cfg.durationMinutes % 15 !== 0) {
              newErrors[`sport_${sId}_duration`] = 'Debe ser múltiplo de 15 min.'
            }
          }
        })
      }
    }

    if (step === 'schedule') {
      delete newErrors.schedules
      delete newErrors.closingTime
      delete newErrors.pricingTiers

      if (selectedDays.length === 0) {
        newErrors.schedules = 'Debe seleccionar al menos un día de disponibilidad para la cancha.'
      }

      if (!isAdvancedPricingMode) {
        if (scheduleSummary.isSameTime) {
          newErrors.closingTime = 'El horario de apertura y cierre no pueden ser idénticos.'
        }
      } else {
        if (customPricingTiers.length === 0) {
          newErrors.pricingTiers = 'Debe configurar al menos una franja horaria en modo avanzado.'
        } else {
          const hasIdenticalHours = customPricingTiers.some((t) => t.startTime === t.endTime)
          if (hasIdenticalHours) {
            newErrors.pricingTiers = 'Existen franjas horarias con horario de inicio y fin idénticos.'
          }
        }
      }
    }

    setErrors(newErrors)

    const stepFieldKeys: Record<CourtCreationStep, string[]> = {
      infrastructure: ['name', 'surfaceType'],
      sports_pricing: [
        'sportIds',
        'basePrice',
        'durationMinutes',
        ...formData.sportIds.map((sId) => `sport_${sId}_price`),
        ...formData.sportIds.map((sId) => `sport_${sId}_duration`),
      ],
      schedule: ['schedules', 'closingTime', 'pricingTiers'],
    }

    const hasStepErrors = stepFieldKeys[step].some((k) => Boolean(newErrors[k]))
    return !hasStepErrors
  }

  // Navegación asistida
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
      if (currentStep === 'infrastructure') {
        setCurrentStep('sports_pricing')
      } else if (currentStep === 'sports_pricing') {
        setCurrentStep('schedule')
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 'schedule') {
      setCurrentStep('sports_pricing')
    } else if (currentStep === 'sports_pricing') {
      setCurrentStep('infrastructure')
    }
  }

  const handleJumpToStep = (targetStep: CourtCreationStep) => {
    const stepOrder: CourtCreationStep[] = ['infrastructure', 'sports_pricing', 'schedule']
    const targetIdx = stepOrder.indexOf(targetStep)
    const currentIdx = stepOrder.indexOf(currentStep)

    if (targetIdx === currentIdx) return

    // Permitir volver libremente a pasos previos ya transitados
    if (targetIdx < currentIdx) {
      setCurrentStep(targetStep)
      return
    }

    // Para avanzar hacia adelante, todos los pasos intermedios deben ser validados
    for (let i = 0; i < targetIdx; i++) {
      const stepKey = stepOrder[i]
      if (!validateStep(stepKey)) {
        setCurrentStep(stepKey)
        toast.error('Datos incompletos', {
          description: `Completá la etapa "${STEPS[i].label}" antes de avanzar.`,
        })
        return
      }
    }

    setCompletedSteps((prev) => {
      const nextSet = new Set(prev)
      for (let i = 0; i < targetIdx; i++) {
        nextSet.add(stepOrder[i])
      }
      return nextSet
    })
    setCurrentStep(targetStep)
  }

  const validateAll = (): { isValid: boolean; targetStep?: CourtCreationStep } => {
    const isStep1Valid = validateStep('infrastructure')
    if (!isStep1Valid) return { isValid: false, targetStep: 'infrastructure' }

    const isStep2Valid = validateStep('sports_pricing')
    if (!isStep2Valid) return { isValid: false, targetStep: 'sports_pricing' }

    const isStep3Valid = validateStep('schedule')
    if (!isStep3Valid) return { isValid: false, targetStep: 'schedule' }

    return { isValid: true }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Regla de Integridad de Wizard: No se permite enviar si no está en la etapa final de disponibilidad
    if (currentStep !== 'schedule') {
      handleNextStep()
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
      setCompletedSteps(new Set())
      setCurrentStep('infrastructure')
      onSuccess?.()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status
        const problem = error.response.data

        if (status === 409) {
          const detail = problem?.detail || 'Conflicto de unicidad o superposición de horarios.'
          toast.error('Conflicto al crear la cancha', { description: detail })

          const isNameConflict =
            problem?.title?.toLowerCase().includes('nombre') ||
            detail.toLowerCase().includes('nombre')

          if (isNameConflict) {
            setErrors((prev) => ({
              ...prev,
              name: 'Ya existe una cancha activa con este nombre en tu complejo.',
            }))
            setCurrentStep('infrastructure')
          } else {
            setErrors((prev) => ({
              ...prev,
              schedules: detail,
              pricingTiers: detail,
            }))
            setCurrentStep('schedule')
          }
          return
        }

        if (status === 400 && problem?.errors) {
          toast.error('Revisá los datos ingresados', {
            description: 'El servidor detectó inconsistencias en el formulario.',
          })
          const serverErrors: Record<string, string> = {}
          let firstErrorStep: CourtCreationStep | null = null

          Object.entries(problem.errors as Record<string, string[]>).forEach(([key, messages]) => {
            const lowerKey = key.toLowerCase()
            const message = messages[0] || 'Dato inválido'
            serverErrors[lowerKey] = message

            if (!firstErrorStep) {
              if (lowerKey.includes('name') || lowerKey.includes('surface')) {
                firstErrorStep = 'infrastructure'
              } else if (
                lowerKey.includes('sport') ||
                lowerKey.includes('price') ||
                lowerKey.includes('duration')
              ) {
                firstErrorStep = 'sports_pricing'
              } else if (
                lowerKey.includes('tier') ||
                lowerKey.includes('schedule') ||
                lowerKey.includes('time')
              ) {
                firstErrorStep = 'schedule'
              }
            }
          })

          setErrors((prev) => ({ ...prev, ...serverErrors }))
          if (firstErrorStep) {
            setCurrentStep(firstErrorStep)
          }
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
      {/* Columna Izquierda: Formulario Estructurado en 3 Pasos */}
      <div className="lg:col-span-7 bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Cabecera del Módulo */}
        <div className="border-b border-neutral-200 pb-4">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight">
            Registrar Nueva Cancha
          </h2>
          <p className="text-sm text-neutral-700 mt-1 leading-relaxed font-medium">
            Ingresá las características físicas, disciplinas admitidas, días habilitados y tarifas operativas.
          </p>
        </div>

        {/* Stepper de Progresión Sobrio (Sin prefijos '01.', '02.' cumpliendo AGENTS.md) */}
        <nav aria-label="Progreso de alta de cancha" className="border-b border-neutral-200 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((step) => {
              const isCurrent = currentStep === step.id
              const isDone = completedSteps.has(step.id)

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleJumpToStep(step.id)}
                  className={`min-h-[44px] text-left p-2.5 border transition-all cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'border-brand-sport bg-brand-sport/10 text-neutral-950 shadow-xs'
                      : isDone
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-900 hover:border-neutral-400'
                      : 'border-neutral-200 bg-transparent text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider truncate ${
                        isCurrent ? 'text-brand-sport' : ''
                      }`}
                    >
                      {step.label}
                    </span>
                    {isDone && !isCurrent && (
                      <Check className="h-3.5 w-3.5 text-brand-sport flex-shrink-0" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-700 truncate hidden sm:block">
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
              <div className="border-b border-neutral-100 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-950">
                  Infraestructura y Superficie
                </h3>
                <p className="text-xs font-medium text-neutral-700 mt-0.5">
                  Identificá el espacio y sus condiciones estructurales.
                </p>
              </div>

              {/* Nombre de la Cancha */}
              <div className="space-y-1.5">
                <label
                  htmlFor="court-name"
                  className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider block"
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
                  className={`w-full bg-[#FAF8F5] border rounded-none px-4 py-3 text-base text-neutral-950 placeholder:text-neutral-500 focus:outline-none transition-colors ${
                    errors.name
                      ? 'border-red-600 focus:border-red-600'
                      : 'border-neutral-300 focus:border-neutral-950'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-600 font-mono mt-1">{errors.name}</p>}
              </div>

              {/* Tipo de Superficie */}
              <div className="space-y-1.5">
                <label
                  htmlFor="surface-type"
                  className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider block"
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
                  className={`w-full bg-[#FAF8F5] border rounded-none px-4 py-3 text-base text-neutral-950 focus:outline-none transition-colors ${
                    errors.surfaceType
                      ? 'border-red-600 focus:border-red-600'
                      : 'border-neutral-300 focus:border-neutral-950'
                  }`}
                >
                  {SURFACE_OPTIONS.map((surface) => (
                    <option key={surface} value={surface}>
                      {surface}
                    </option>
                  ))}
                </select>
                {errors.surfaceType && (
                  <p className="text-xs text-red-600 font-mono mt-1">{errors.surfaceType}</p>
                )}
              </div>

              {/* Características Físicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-3 p-3.5 border border-neutral-200 bg-[#FAF8F5] min-h-[44px]">
                  <input
                    id="is-covered"
                    type="checkbox"
                    checked={formData.isCovered}
                    onChange={(e) => setFormData({ ...formData, isCovered: e.target.checked })}
                    className="h-4 w-4 rounded-none border-neutral-400 text-brand-sport focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="is-covered"
                    className="text-xs font-bold uppercase tracking-wider text-neutral-800 cursor-pointer select-none"
                  >
                    Techada / Cubierta
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3.5 border border-neutral-200 bg-[#FAF8F5] min-h-[44px]">
                  <input
                    id="has-lighting"
                    type="checkbox"
                    checked={formData.hasLighting}
                    onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
                    className="h-4 w-4 rounded-none border-neutral-400 text-brand-sport focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="has-lighting"
                    className="text-xs font-bold uppercase tracking-wider text-neutral-800 cursor-pointer select-none"
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
              <div className="border-b border-neutral-100 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-950">
                  Deportes Admitidos y Tarifas
                </h3>
                <p className="text-xs font-medium text-neutral-700 mt-0.5">
                  Definí las disciplinas que se juegan en este espacio y las condiciones base.
                </p>
              </div>

              {/* Deportes Permitidos (Multiselección) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                    Disciplinas Permitidas * ({formData.sportIds.length} seleccionadas)
                  </label>
                  <span className="text-xs font-mono font-bold text-neutral-700">
                    La primera define la imagen de referencia
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
                          className={`min-h-[44px] px-3.5 py-2.5 text-left border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-brand-sport bg-brand-sport/10 text-[#164734] shadow-xs'
                              : 'border-neutral-300 bg-[#FAF8F5] text-neutral-800 hover:border-neutral-500'
                          }`}
                        >
                          <span className="truncate">{sport.name}</span>
                          {isSelected && (
                            <span className="flex items-center gap-1">
                              {isPrimarySport && (
                                <span className="text-xs font-mono font-bold text-white bg-brand-sport px-1.5 py-0.5 rounded-none">
                                  1°
                                </span>
                              )}
                              <Check className="h-4 w-4 text-[#164734]" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.sportIds && (
                  <p className="text-xs text-red-600 font-mono mt-1">{errors.sportIds}</p>
                )}
              </div>

              {/* Tarifas y Duración Base */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Precio Base */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="base-price"
                    className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider block"
                  >
                    Precio Base Estándar ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-xs text-neutral-600 font-mono font-bold">
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
                      className={`w-full bg-[#FAF8F5] border rounded-none pl-8 pr-4 py-3 text-base text-neutral-950 focus:outline-none transition-colors font-mono ${
                        errors.basePrice
                          ? 'border-red-600 focus:border-red-600'
                          : 'border-neutral-300 focus:border-neutral-950'
                      }`}
                    />
                  </div>
                  {errors.basePrice ? (
                    <p className="text-xs text-red-600 font-mono mt-1">{errors.basePrice}</p>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-neutral-700 block">
                      Tarifa de referencia estándar por turno
                    </span>
                  )}
                </div>

                {/* Duración Estándar con Selector de Presets + Step 15 */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="duration-minutes"
                    className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider block"
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
                          className={`min-h-[36px] px-3 py-1.5 text-xs font-mono font-bold transition-all cursor-pointer border ${
                            isPresetActive
                              ? 'border-brand-sport bg-brand-sport text-white shadow-xs'
                              : 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500'
                          }`}
                        >
                          {preset}m
                        </button>
                      )
                    })}
                  </div>

                  {/* Input Numérico con step=15 */}
                  <input
                    id="duration-minutes"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={formData.durationMinutes}
                    onBlur={() => {
                      if (formData.durationMinutes <= 0) {
                        setErrors((prev) => ({
                          ...prev,
                          durationMinutes: 'La duración debe ser mayor a 0 minutos.',
                        }))
                      } else if (formData.durationMinutes % 15 !== 0) {
                        setErrors((prev) => ({
                          ...prev,
                          durationMinutes:
                            'La duración debe ser múltiplo de 15 minutos (ej: 30, 45, 60, 90 min).',
                        }))
                      }
                    }}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setFormData({ ...formData, durationMinutes: Math.max(15, val) })
                      if (val % 15 === 0 && errors.durationMinutes) {
                        setErrors((prev) => ({ ...prev, durationMinutes: '' }))
                      }
                    }}
                    className={`w-full bg-[#FAF8F5] border rounded-none px-4 py-2.5 text-base text-neutral-950 focus:outline-none transition-colors font-mono ${
                      errors.durationMinutes
                        ? 'border-red-600 focus:border-red-600'
                        : 'border-neutral-300 focus:border-neutral-950'
                    }`}
                  />
                  {errors.durationMinutes ? (
                    <p className="text-xs text-red-600 font-mono mt-1">{errors.durationMinutes}</p>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-neutral-700 block">
                      Intervalos múltiplos de 15 min (ej: 30, 45, 60, 90, 120)
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle Personalización por Deporte */}
              {formData.sportIds.length > 1 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 border border-neutral-300 bg-[#FAF8F5]">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-brand-sport" strokeWidth={2} />
                        <span>Precios y duraciones diferenciales por deporte</span>
                      </span>
                      <span className="text-xs font-mono text-neutral-700 block">
                        Permite fijar tarifas o tiempos específicos (ej: Pádel $15.000 / Tenis $10.000)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={customizePricesBySport}
                      onChange={(e) => setCustomizePricesBySport(e.target.checked)}
                      className="h-4 w-4 rounded-none border-neutral-400 text-brand-sport focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {customizePricesBySport && (
                    <div className="space-y-2 border border-neutral-300 p-4 bg-white">
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
                          <div
                            key={sportId}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#FAF8F5] border border-neutral-200"
                          >
                            <span className="text-xs font-bold uppercase text-neutral-900 sm:w-32">
                              {sport?.name ?? 'Deporte'}:
                            </span>

                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs font-mono font-bold text-neutral-700">$</span>
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
                                  className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-sm font-mono text-neutral-950"
                                  placeholder="Precio"
                                />
                              </div>

                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs font-mono font-bold text-neutral-700">Min:</span>
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
                                  className="w-full bg-white border border-neutral-300 px-3 py-1.5 text-sm font-mono text-neutral-950"
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
              <div className="border-b border-neutral-100 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-950">
                    Días y Horarios Operativos
                  </h3>
                  <p className="text-xs font-medium text-neutral-700 mt-0.5">
                    Configurá días habilitados, horario general o franjas tarifarias avanzadas.
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => selectQuickDays('weekdays')}
                    className="min-h-[36px] text-xs font-mono font-bold uppercase bg-neutral-200 hover:bg-neutral-300 text-neutral-950 border border-neutral-300 px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    Lun-Vie
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickDays('all')}
                    className="min-h-[36px] text-xs font-mono font-bold uppercase bg-neutral-200 hover:bg-neutral-300 text-neutral-950 border border-neutral-300 px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickDays('weekend')}
                    className="min-h-[36px] text-xs font-mono font-bold uppercase bg-neutral-200 hover:bg-neutral-300 text-neutral-950 border border-neutral-300 px-3 py-1.5 transition-colors cursor-pointer"
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
                        className={`min-h-[44px] py-2 px-1 text-center border text-xs font-bold uppercase transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                            : 'border-neutral-300 bg-[#FAF8F5] text-neutral-900 hover:border-neutral-500'
                        }`}
                      >
                        <span>{day.short}</span>
                        <span className="text-xs font-mono font-bold">
                          {isSelected ? 'Activo' : 'Cerrado'}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.schedules && (
                  <p className="text-xs text-red-600 font-mono mt-1">{errors.schedules}</p>
                )}
              </div>

              {/* Configuración Simple de Apertura y Cierre con Autodetección de Trasnoche */}
              {!isAdvancedPricingMode && (
                <div className="p-4 sm:p-5 border border-neutral-300 bg-[#FAF8F5] space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <span className="text-xs font-mono uppercase font-bold text-neutral-800">
                      Horario General de Funcionamiento
                    </span>
                    <span className="text-xs font-mono font-semibold text-neutral-700">
                      Aplica a los días seleccionados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="opening-time"
                        className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider flex items-center gap-1.5"
                      >
                        <Clock className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2} />
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
                        className="w-full bg-white border border-neutral-300 rounded-none px-4 py-2.5 text-base text-neutral-950 font-mono focus:outline-none focus:border-neutral-950"
                      />
                      <span className="text-xs font-mono font-semibold text-neutral-700 block">
                        Comienzo de las actividades diarias
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="closing-time"
                        className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider flex items-center gap-1.5"
                      >
                        <Clock className="h-3.5 w-3.5 text-neutral-700" strokeWidth={2} />
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
                        className={`w-full bg-white border rounded-none px-4 py-2.5 text-base text-neutral-950 font-mono focus:outline-none ${
                          errors.closingTime
                            ? 'border-red-600 focus:border-red-600'
                            : 'border-neutral-300 focus:border-neutral-950'
                        }`}
                      />
                      {errors.closingTime ? (
                        <p className="text-xs text-red-600 font-mono mt-1">{errors.closingTime}</p>
                      ) : (
                        <span className="text-xs font-mono font-semibold text-neutral-700 block">
                          Fin de actividades (puede cruzar medianoche)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Panel de Cálculo Operativo y Detección de Trasnoche */}
                  <div
                    className={`border p-3 space-y-1 text-xs transition-colors ${
                      scheduleSummary.crossesMidnight
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-neutral-950 font-bold">
                      {scheduleSummary.crossesMidnight ? (
                        <Clock className="h-4 w-4 text-amber-800 flex-shrink-0" strokeWidth={2} />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-neutral-700 flex-shrink-0" strokeWidth={2} />
                      )}
                      <span className="text-xs font-mono uppercase tracking-wider">
                        {scheduleSummary.crossesMidnight
                          ? 'Turno Trasnoche Activo (Cruce de Medianoche):'
                          : 'Cálculo Operativo:'}
                      </span>
                    </div>

                    <p className="font-mono text-sm text-neutral-900 leading-relaxed pl-5">
                      {scheduleSummary.isSameTime ? (
                        <span className="text-red-600 font-bold">
                          El horario de apertura y cierre no pueden ser idénticos.
                        </span>
                      ) : scheduleSummary.crossesMidnight ? (
                        <>
                          El horario abarca desde las{' '}
                          <strong className="text-neutral-950 font-black">{scheduleSummary.openingTime} hs</strong>{' '}
                          hasta las{' '}
                          <strong className="text-neutral-950 font-black">{scheduleSummary.closingTime} hs</strong>{' '}
                          de la madrugada del día siguiente. Capacidad estimada:{' '}
                          <strong className="text-neutral-950 font-black">
                            {scheduleSummary.shiftCount} turnos diarios
                          </strong>{' '}
                          de {formData.durationMinutes} min.
                        </>
                      ) : (
                        <>
                          Apertura:{' '}
                          <strong className="text-neutral-950 font-black">{scheduleSummary.openingTime} hs</strong>{' '}
                          · Cierre:{' '}
                          <strong className="text-neutral-950 font-black">{scheduleSummary.closingTime} hs</strong>.
                          Capacidad estimada:{' '}
                          <strong className="text-neutral-950 font-black">
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
              <div className="border border-neutral-300 bg-white">
                <button
                  type="button"
                  onClick={handleToggleAdvancedMode}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-brand-sport" strokeWidth={2} />
                      <span>Configuraciones avanzadas de franjas y tarifas</span>
                    </span>
                    <span className="text-xs font-mono text-neutral-700 block">
                      {isAdvancedPricingMode
                        ? 'Modo avanzado activo: podés configurar múltiples turnos, tarifas nocturnas y precios por deporte.'
                        : 'Hacé clic para configurar múltiples franjas por día (diurno/nocturno) o precios por deporte.'}
                    </span>
                  </div>
                  {isAdvancedPricingMode ? (
                    <ChevronUp className="h-5 w-5 text-neutral-700 flex-shrink-0" strokeWidth={2} />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-neutral-700 flex-shrink-0" strokeWidth={2} />
                  )}
                </button>

                {isAdvancedPricingMode && (
                  <div className="p-4 sm:p-6 border-t border-neutral-200 bg-[#FAF8F5] space-y-4">
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
                      <p className="text-xs text-red-600 font-mono mt-1">{errors.pricingTiers}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Barra de Navegación del Stepper y Guardado */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between gap-3">
            {currentStep !== 'infrastructure' ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="min-h-[44px] px-5 py-2.5 border border-neutral-300 bg-white text-neutral-950 text-xs font-bold uppercase tracking-wider hover:border-neutral-950 transition-colors inline-flex items-center gap-2 cursor-pointer"
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
                className="min-h-[48px] px-8 py-3 rounded-full bg-brand-sport text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-sport-hover transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer ml-auto"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            ) : (
              <button
                key="btn-step-submit"
                type="submit"
                disabled={createCourtMutation.isPending}
                className="min-h-[48px] px-8 py-3 rounded-full bg-brand-sport text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-sport-hover transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer ml-auto"
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
