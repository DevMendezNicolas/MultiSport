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
import { NumericInput } from '@/components/ui/numeric-input'
import { useCreateCourt, useSports } from '../hooks/useCourts'
import {
  saveCourtCustomTierIntentions,
  type CreateCourtPayload,
  type CourtPricingTierPayload,
  type CourtSportConfigPayload,
} from '../types'
import { CourtImagePreview } from './CourtImagePreview'
import { PricingTiersEditor, QUARTER_HOUR_TIME_OPTIONS } from './PricingTiersEditor'

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

  const [currentStep, setCurrentStep] = useState<CourtCreationStep>('infrastructure')
  const [completedSteps, setCompletedSteps] = useState<Set<CourtCreationStep>>(new Set())

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

  const [customizePricesBySport, setCustomizePricesBySport] = useState<boolean>(false)
  const [customSportConfigs, setCustomSportConfigs] = useState<
    Record<string, { basePrice: number; durationMinutes: number }>
  >({})

  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0])
  const [openingTime, setOpeningTime] = useState<string>('08:00')
  const [closingTime, setClosingTime] = useState<string>('23:00')

  const [isAdvancedPricingMode, setIsAdvancedPricingMode] = useState<boolean>(false)
  const [customPricingTiers, setCustomPricingTiers] = useState<CourtPricingTierPayload[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const normalizeTiersForModality = (
    tiersToNormalize: CourtPricingTierPayload[],
    targetCustomizeBySport: boolean,
    activeSportIds: string[],
    sportConfigsMap: Record<string, { basePrice: number; durationMinutes: number }>,
    fallbackPrice: number,
    fallbackDuration: number
  ): CourtPricingTierPayload[] => {
    if (tiersToNormalize.length === 0) return []

    if (targetCustomizeBySport) {
      // Convertir cualquier franja general en franjas específicas por cada deporte activo
      const result: CourtPricingTierPayload[] = []
      const hasOnlyGeneral = tiersToNormalize.every((t) => !t.sportId)

      if (hasOnlyGeneral) {
        for (const tier of tiersToNormalize) {
          for (const sportId of activeSportIds) {
            const cfg = sportConfigsMap[sportId]
            result.push({
              dayOfWeek: tier.dayOfWeek,
              startTime: tier.startTime,
              endTime: tier.endTime,
              price: tier.isPriceCustom
                ? tier.price
                : (cfg?.basePrice ?? fallbackPrice),
              durationMinutes: tier.isDurationCustom
                ? tier.durationMinutes
                : (cfg?.durationMinutes ?? fallbackDuration),
              sportId,
              isPriceCustom: tier.isPriceCustom,
              isDurationCustom: tier.isDurationCustom,
            })
          }
        }
        return result
      }

      const filtered = tiersToNormalize
        .filter((t) => t.sportId && activeSportIds.includes(t.sportId))
        .map((t) => {
          const targetSport = t.sportId || activeSportIds[0]
          const cfg = sportConfigsMap[targetSport]
          return {
            ...t,
            sportId: targetSport,
            price: t.isPriceCustom ? t.price : (cfg?.basePrice ?? fallbackPrice),
            durationMinutes: t.isDurationCustom
              ? t.durationMinutes
              : (cfg?.durationMinutes ?? fallbackDuration),
          }
        })

      // Asegurar que todo deporte activo tenga al menos una franja
      for (const sportId of activeSportIds) {
        if (!filtered.some((t) => t.sportId === sportId)) {
          const cfg = sportConfigsMap[sportId]
          for (const dayId of selectedDays) {
            filtered.push({
              dayOfWeek: dayId,
              startTime: openingTime,
              endTime: closingTime,
              price: cfg?.basePrice ?? fallbackPrice,
              durationMinutes: cfg?.durationMinutes ?? fallbackDuration,
              sportId,
              isPriceCustom: false,
              isDurationCustom: false,
            })
          }
        }
      }

      return filtered
    } else {
      // Colapsar a modalidad Precio Base: todas las franjas con sportId = undefined sin duplicados horarios
      const seenSlots = new Set<string>()
      const collapsed: CourtPricingTierPayload[] = []

      for (const tier of tiersToNormalize) {
        const key = `${tier.dayOfWeek}_${tier.startTime}_${tier.endTime}`
        if (seenSlots.has(key)) continue
        seenSlots.add(key)
        collapsed.push({
          dayOfWeek: tier.dayOfWeek,
          startTime: tier.startTime,
          endTime: tier.endTime,
          price: tier.isPriceCustom
            ? tier.price
            : (fallbackPrice > 0 ? fallbackPrice : tier.price),
          durationMinutes: tier.isDurationCustom
            ? tier.durationMinutes
            : (fallbackDuration > 0 ? fallbackDuration : tier.durationMinutes),
          sportId: undefined,
          isPriceCustom: tier.isPriceCustom,
          isDurationCustom: tier.isDurationCustom,
        })
      }

      return collapsed
    }
  }

  const handleBasePriceChange = (nextBasePrice: number) => {
    setFormData((prev) => ({
      ...prev,
      basePrice: nextBasePrice,
    }))
    // SCRUM-50: Propagar el nuevo precio base en tiempo real a todas las franjas que no tengan precio personalizado
    setCustomPricingTiers((prev) =>
      prev.map((tier) => (tier.isPriceCustom ? tier : { ...tier, price: nextBasePrice }))
    )
    if (errors.basePrice) setErrors((prev) => ({ ...prev, basePrice: '' }))
  }

  const handleBaseDurationChange = (nextDuration: number) => {
    setFormData((prev) => ({
      ...prev,
      durationMinutes: nextDuration,
    }))
    // SCRUM-50: Propagar la nueva duración base en tiempo real a todas las franjas que no tengan duración personalizada
    setCustomPricingTiers((prev) =>
      prev.map((tier) =>
        tier.isDurationCustom ? tier : { ...tier, durationMinutes: nextDuration }
      )
    )
    if (nextDuration >= 30 && nextDuration % 15 === 0 && errors.durationMinutes) {
      setErrors((prev) => ({ ...prev, durationMinutes: '' }))
    }
  }

  const handleSportBasePriceChange = (sportId: string, nextSportPrice: number) => {
    const currentConfig = customSportConfigs[sportId] || {
      basePrice: formData.basePrice,
      durationMinutes: formData.durationMinutes,
    }
    setCustomSportConfigs((prev) => ({
      ...prev,
      [sportId]: { ...currentConfig, basePrice: nextSportPrice },
    }))
    // SCRUM-50: Propagar a las franjas de ese deporte que no tengan precio personalizado
    setCustomPricingTiers((prev) =>
      prev.map((tier) =>
        tier.sportId === sportId && !tier.isPriceCustom
          ? { ...tier, price: nextSportPrice }
          : tier
      )
    )
    if (errors.customSports) {
      setErrors((prev) => ({ ...prev, customSports: '' }))
    }
  }

  const handleSportDurationChange = (sportId: string, nextSportDuration: number) => {
    const currentConfig = customSportConfigs[sportId] || {
      basePrice: formData.basePrice,
      durationMinutes: formData.durationMinutes,
    }
    setCustomSportConfigs((prev) => ({
      ...prev,
      [sportId]: { ...currentConfig, durationMinutes: nextSportDuration },
    }))
    // SCRUM-50: Propagar a las franjas de ese deporte que no tengan duración personalizada
    setCustomPricingTiers((prev) =>
      prev.map((tier) =>
        tier.sportId === sportId && !tier.isDurationCustom
          ? { ...tier, durationMinutes: nextSportDuration }
          : tier
      )
    )
    if (errors.customSports) {
      setErrors((prev) => ({ ...prev, customSports: '' }))
    }
  }

  const handleToggleCustomizePricesBySport = (nextChecked: boolean) => {
    const nextConfigs = { ...customSportConfigs }
    if (nextChecked) {
      for (const sportId of formData.sportIds) {
        if (!nextConfigs[sportId]) {
          nextConfigs[sportId] = {
            basePrice: formData.basePrice > 0 ? formData.basePrice : 20000,
            durationMinutes: formData.durationMinutes >= 30 ? formData.durationMinutes : 60,
          }
        }
      }
      setCustomSportConfigs(nextConfigs)
    }

    setCustomizePricesBySport(nextChecked)
    setCustomPricingTiers((prev) =>
      normalizeTiersForModality(
        prev,
        nextChecked,
        formData.sportIds,
        nextConfigs,
        formData.basePrice,
        formData.durationMinutes
      )
    )
    setErrors((prev) => ({
      ...prev,
      basePrice: '',
      durationMinutes: '',
      customSports: '',
      pricingTiers: '',
    }))
  }

  const toggleSport = (sportId: string) => {
    const exists = formData.sportIds.includes(sportId)
    const nextSportIds = exists
      ? formData.sportIds.filter((id) => id !== sportId)
      : [...formData.sportIds, sportId]

    const nextConfigs = { ...customSportConfigs }
    if (!exists && !nextConfigs[sportId]) {
      nextConfigs[sportId] = {
        basePrice: formData.basePrice > 0 ? formData.basePrice : 20000,
        durationMinutes: formData.durationMinutes >= 30 ? formData.durationMinutes : 60,
      }
      setCustomSportConfigs(nextConfigs)
    }

    const effectiveCustomize = nextSportIds.length > 1 ? customizePricesBySport : false
    if (nextSportIds.length <= 1 && customizePricesBySport) {
      setCustomizePricesBySport(false)
    }

    setFormData((prev) => ({ ...prev, sportIds: nextSportIds }))
    setCustomPricingTiers((prev) =>
      normalizeTiersForModality(
        prev,
        effectiveCustomize,
        nextSportIds,
        nextConfigs,
        formData.basePrice,
        formData.durationMinutes
      )
    )

    if (errors.sportIds) {
      setErrors((prev) => ({ ...prev, sportIds: '' }))
    }
  }

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
          isPriceCustom: false,
          isDurationCustom: false,
        }))
      )
    }

    return selectedDays.map((dayId) => ({
      dayOfWeek: dayId,
      startTime: openingTime,
      endTime: closingTime,
      price: formData.basePrice,
      durationMinutes: formData.durationMinutes,
      sportId: undefined,
      isPriceCustom: false,
      isDurationCustom: false,
    }))
  }

  const handleToggleAdvancedMode = () => {
    const nextState = !isAdvancedPricingMode
    setIsAdvancedPricingMode(nextState)

    if (nextState) {
      if (customPricingTiers.length === 0) {
        setCustomPricingTiers(generateSimpleTiers())
      } else {
        setCustomPricingTiers((prev) =>
          normalizeTiersForModality(
            prev,
            customizePricesBySport,
            formData.sportIds,
            customSportConfigs,
            formData.basePrice,
            formData.durationMinutes
          )
        )
      }
    }
  }

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
      delete newErrors.customSports

      if (formData.sportIds.length === 0) {
        newErrors.sportIds = 'Debe seleccionar al menos una disciplina deportiva para esta cancha.'
      }

      if (!customizePricesBySport) {
        if (!formData.basePrice || formData.basePrice <= 0) {
          newErrors.basePrice = 'El precio base debe ser mayor a $0.'
        }

        if (!formData.durationMinutes || formData.durationMinutes < 30 || formData.durationMinutes > 480) {
          newErrors.durationMinutes = 'La duración debe estar entre 30 y 480 minutos.'
        } else if (formData.durationMinutes % 15 !== 0) {
          newErrors.durationMinutes =
            'La duración debe ser múltiplo de 15 minutos (ej: 30, 45, 60, 90 min).'
        }
      } else {
        for (const sportId of formData.sportIds) {
          const cfg = customSportConfigs[sportId]
          const sportName = sports.find((s) => s.id === sportId)?.name || 'Deporte'
          if (!cfg || !cfg.basePrice || cfg.basePrice <= 0) {
            newErrors.customSports = `El precio de ${sportName} debe ser mayor a $0.`
            break
          }
          if (
            !cfg.durationMinutes ||
            cfg.durationMinutes < 30 ||
            cfg.durationMinutes > 480 ||
            cfg.durationMinutes % 15 !== 0
          ) {
            newErrors.customSports = `La duración de ${sportName} debe estar entre 30 y 480 min (múltiplo de 15).`
            break
          }
        }
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
        } else if (customPricingTiers.some((t) => t.startTime === t.endTime)) {
          newErrors.pricingTiers = 'Existen franjas horarias con horario de inicio y fin idénticos.'
        } else if (customPricingTiers.some((t) => !t.price || t.price <= 0)) {
          newErrors.pricingTiers = 'Todas las franjas horarias deben tener un precio mayor a $0.'
        } else if (
          customPricingTiers.some((t) => {
            const dur = t.durationMinutes ?? formData.durationMinutes
            return !dur || dur < 30 || dur > 480 || dur % 15 !== 0
          })
        ) {
          newErrors.pricingTiers =
            'Todas las franjas deben tener una duración entre 30 y 480 min en múltiplos de 15.'
        } else if (customizePricesBySport) {
          if (customPricingTiers.some((t) => !t.sportId)) {
            newErrors.pricingTiers =
              'En modalidad de tarifas personalizadas, cada franja debe tener un deporte asignado.'
          } else if (
            !formData.sportIds.every((sId) => customPricingTiers.some((t) => t.sportId === sId))
          ) {
            newErrors.pricingTiers =
              'Cada deporte seleccionado debe contar con al menos una franja horaria configurada.'
          }
        }
      }
    }

    setErrors(newErrors)
    const stepFields: Record<CourtCreationStep, string[]> = {
      infrastructure: ['name', 'surfaceType'],
      sports_pricing: ['sportIds', 'basePrice', 'durationMinutes', 'customSports'],
      schedule: ['schedules', 'closingTime', 'pricingTiers'],
    }

    const currentStepHasErrors = stepFields[step].some((field) => Boolean(newErrors[field]))
    return !currentStepHasErrors
  }

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

    const rawTiers: CourtPricingTierPayload[] = isAdvancedPricingMode
      ? customPricingTiers
      : generateSimpleTiers()

    const effectiveTiers: CourtPricingTierPayload[] = rawTiers.map((t) => ({
      ...t,
      sportId: customizePricesBySport ? t.sportId || formData.sportIds[0] : undefined,
    }))

    const customSportPricesPayload: CourtSportConfigPayload[] | undefined = customizePricesBySport
      ? formData.sportIds.map((sportId) => ({
          sportId,
          basePrice: customSportConfigs[sportId]?.basePrice ?? formData.basePrice,
          durationMinutes: customSportConfigs[sportId]?.durationMinutes ?? formData.durationMinutes,
        }))
      : undefined

    const effectiveRootBasePrice: number =
      customizePricesBySport && customSportPricesPayload && customSportPricesPayload.length > 0
        ? (customSportPricesPayload[0].basePrice ?? formData.basePrice)
        : formData.basePrice

    const effectiveRootDuration: number =
      customizePricesBySport && customSportPricesPayload && customSportPricesPayload.length > 0
        ? (customSportPricesPayload[0].durationMinutes ?? formData.durationMinutes)
        : formData.durationMinutes

    const payload: CreateCourtPayload = {
      name: formData.name.trim(),
      surfaceType: formData.surfaceType,
      isCovered: formData.isCovered,
      hasLighting: formData.hasLighting,
      basePrice: effectiveRootBasePrice,
      durationMinutes: effectiveRootDuration,
      sportIds: formData.sportIds,
      pricingTiers: effectiveTiers,
      customSportPrices: customSportPricesPayload,
    }

    try {
      const createdCourt = await createCourtMutation.mutateAsync(payload)
      if (createdCourt?.id) {
        saveCourtCustomTierIntentions(createdCourt.id, effectiveTiers)
      }
      toast.success('Cancha creada exitosamente', {
        description: `Se registró "${formData.name.trim()}" con ${formData.sportIds.length} disciplina(s) y ${effectiveTiers.length} franja(s) de disponibilidad configurada(s).`,
      })

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

  const firstSport = useMemo(() => {
    if (formData.sportIds.length === 0) return undefined
    return sports.find((s) => s.id === formData.sportIds[0])
  }, [sports, formData.sportIds])

  const previewBasePrice = useMemo(() => {
    if (customizePricesBySport && formData.sportIds.length > 0) {
      return customSportConfigs[formData.sportIds[0]]?.basePrice ?? formData.basePrice
    }
    return formData.basePrice
  }, [customizePricesBySport, formData.sportIds, customSportConfigs, formData.basePrice])

  const previewDuration = useMemo(() => {
    if (customizePricesBySport && formData.sportIds.length > 0) {
      return customSportConfigs[formData.sportIds[0]]?.durationMinutes ?? formData.durationMinutes
    }
    return formData.durationMinutes
  }, [customizePricesBySport, formData.sportIds, customSportConfigs, formData.durationMinutes])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 bg-[#16181D] border border-[#31343E] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-[#F2F3F5]">
        <div className="border-b border-[#31343E] pb-4">
          <h2 className="text-xl sm:text-2xl font-black text-[#F2F3F5] uppercase tracking-tight font-headline">
            Registrar Nueva Cancha
          </h2>
          <p className="text-sm text-[#9497A1] mt-1 leading-relaxed font-medium">
            Ingresá las características físicas, disciplinas admitidas, días habilitados y tarifas operativas.
          </p>
        </div>

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
                  Definí las disciplinas que se juegan en este espacio y la modalidad tarifaria.
                </p>
              </div>

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

              {/* Selector de Modalidad (Precio Base vs Tarifas Personalizadas por Deporte) */}
              {formData.sportIds.length > 1 && (
                <div className="pt-1">
                  <label className="flex items-center justify-between p-3.5 border border-[#31343E] bg-[#22242B] rounded-xl cursor-pointer select-none">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                        <span>Tarifas y duraciones personalizadas por deporte</span>
                      </span>
                      <span className="text-xs font-mono text-[#9497A1] block">
                        Cada disciplina tendrá su propio precio, duración y franjas horarias específicas
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={customizePricesBySport}
                      onChange={(e) => handleToggleCustomizePricesBySport(e.target.checked)}
                      className="h-4 w-4 rounded border-[#31343E] bg-[#16181D] text-[#258653] focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {/* MODALIDAD A: PRECIO BASE GENERAL */}
              {!customizePricesBySport ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                      <NumericInput
                        id="base-price"
                        value={formData.basePrice}
                        onChange={handleBasePriceChange}
                        placeholder="Ej: 20000"
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
                        Se propaga automáticamente a las franjas generales
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="duration-minutes"
                      className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider block"
                    >
                      Duración Estándar (minutos) *
                    </label>

                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      {DURATION_PRESETS.map((preset) => {
                        const isPresetActive = formData.durationMinutes === preset
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleBaseDurationChange(preset)}
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

                    <NumericInput
                      id="duration-minutes"
                      value={formData.durationMinutes}
                      onChange={handleBaseDurationChange}
                      placeholder="Ej: 60"
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
              ) : (
                /* MODALIDAD B: TARIFAS PERSONALIZADAS POR DEPORTE */
                <div className="space-y-3 border border-[#31343E] rounded-xl p-4 bg-[#1E2027]">
                  <span className="text-xs font-mono uppercase font-bold text-[#F2F3F5] block">
                    Configuración individual por disciplina deportiva:
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
                          <div className="flex items-center gap-1.5 flex-1">
                            <span className="text-xs font-mono font-bold text-[#327357]">$</span>
                            <NumericInput
                              value={currentConfig.basePrice}
                              onChange={(val) => handleSportBasePriceChange(sportId, val)}
                              className="w-full bg-[#22242B] border border-[#31343E] rounded-lg px-3 py-1.5 text-base sm:text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
                              placeholder="Precio ($)"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 flex-1">
                            <span className="text-xs font-mono font-bold text-[#9497A1]">Min:</span>
                            <NumericInput
                              value={currentConfig.durationMinutes}
                              onChange={(val) => handleSportDurationChange(sportId, val)}
                              className="w-full bg-[#22242B] border border-[#31343E] rounded-lg px-3 py-1.5 text-base sm:text-sm font-mono text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
                              placeholder="Ej: 60"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {errors.customSports && (
                    <p className="text-xs text-red-400 font-mono mt-1">{errors.customSports}</p>
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
                      <select
                        id="opening-time"
                        value={openingTime}
                        onChange={(e) => {
                          setOpeningTime(e.target.value)
                          if (errors.closingTime) {
                            setErrors((prev) => ({ ...prev, closingTime: '' }))
                          }
                        }}
                        className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] font-mono focus:outline-hidden focus:border-[#258653] cursor-pointer"
                      >
                        {QUARTER_HOUR_TIME_OPTIONS.map((t) => (
                          <option key={t} value={t} className="bg-[#16181D]">
                            {t} hs
                          </option>
                        ))}
                      </select>
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
                      <select
                        id="closing-time"
                        value={closingTime}
                        onChange={(e) => {
                          setClosingTime(e.target.value)
                          if (errors.closingTime) {
                            setErrors((prev) => ({ ...prev, closingTime: '' }))
                          }
                        }}
                        className={`w-full bg-[#16181D] border rounded-xl px-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] font-mono focus:outline-hidden cursor-pointer ${
                          errors.closingTime
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#31343E] focus:border-[#258653]'
                        }`}
                      >
                        {QUARTER_HOUR_TIME_OPTIONS.map((t) => (
                          <option key={t} value={t} className="bg-[#16181D]">
                            {t} hs
                          </option>
                        ))}
                      </select>
                      {errors.closingTime ? (
                        <p className="text-xs text-red-400 font-mono mt-1">{errors.closingTime}</p>
                      ) : (
                        <span className="text-[11px] font-mono text-[#9497A1] block">
                          Fin de actividades (puede cruzar medianoche)
                        </span>
                      )}
                    </div>
                  </div>

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
                          de {previewDuration} min.
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
                          de {previewDuration} min.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

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
                        ? 'Modo avanzado activo: podés configurar múltiples franjas horarias y tarifas diferenciadas.'
                        : 'Hacé clic para configurar múltiples franjas por día (diurno/nocturno).'}
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
                      defaultPrice={previewBasePrice}
                      defaultDuration={previewDuration}
                      customizePricesBySport={customizePricesBySport}
                      customSportConfigs={customSportConfigs}
                    />
                    {errors.pricingTiers && (
                      <p className="text-xs text-red-400 font-mono mt-1">{errors.pricingTiers}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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

      <div className="lg:col-span-5 sticky top-6">
        <CourtImagePreview
          firstSportName={firstSport?.name}
          surfaceType={formData.surfaceType}
          isCovered={formData.isCovered}
          hasLighting={formData.hasLighting}
          durationMinutes={previewDuration}
          basePrice={previewBasePrice}
        />
      </div>
    </div>
  )
}
