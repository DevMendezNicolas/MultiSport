import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  AlertCircle,
  Save,
  Check,
  Info,
  Layers,
  Clock,
  DollarSign,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { NumericInput } from '@/components/ui/numeric-input'
import { useCourt, useSports, useUpdateCourt } from '../hooks/useCourts'
import {
  buildTierIntentionKey,
  loadCourtCustomTierIntentions,
  saveCourtCustomTierIntentions,
  type CourtPricingRuleResponse,
  type CourtPricingTierPayload,
  type CourtSportConfigPayload,
  type UpdateCourtPayload,
} from '../types'
import { CourtImagePreview } from '../components/CourtImagePreview'
import { PricingTiersEditor, QUARTER_HOUR_TIME_OPTIONS } from '../components/PricingTiersEditor'

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

export const EditCourtPage: React.FC = () => {
  const { id: courtId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: court, isLoading: isLoadingCourt } = useCourt(courtId || null)
  const { data: sports = [], isLoading: isLoadingSports } = useSports()
  const updateCourtMutation = useUpdateCourt()

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

  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [openingTime, setOpeningTime] = useState<string>('08:00')
  const [closingTime, setClosingTime] = useState<string>('23:00')
  const [isAdvancedPricingMode, setIsAdvancedPricingMode] = useState<boolean>(false)
  const [pricingTiers, setPricingTiers] = useState<CourtPricingTierPayload[]>([])

  const [customizePricesBySport, setCustomizePricesBySport] = useState<boolean>(false)
  const [customSportConfigs, setCustomSportConfigs] = useState<
    Record<string, { basePrice: number; durationMinutes: number }>
  >({})

  const [initialSnapshot, setInitialSnapshot] = useState<string>('')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const normalizeTiersForModality = (
    tiersToNormalize: CourtPricingTierPayload[],
    targetCustomizeBySport: boolean,
    activeSportIds: string[],
    sportConfigsMap: Record<string, { basePrice: number; durationMinutes: number }>,
    fallbackPrice: number,
    fallbackDuration: number,
    activeDays: number[]
  ): CourtPricingTierPayload[] => {
    if (tiersToNormalize.length === 0) return []

    if (targetCustomizeBySport) {
      const hasOnlyGeneral = tiersToNormalize.every((t) => !t.sportId)
      if (hasOnlyGeneral) {
        const expanded: CourtPricingTierPayload[] = []
        for (const tier of tiersToNormalize) {
          for (const sportId of activeSportIds) {
            const cfg = sportConfigsMap[sportId]
            expanded.push({
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
        return expanded
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

      for (const sportId of activeSportIds) {
        if (!filtered.some((t) => t.sportId === sportId)) {
          const cfg = sportConfigsMap[sportId]
          for (const dayId of activeDays) {
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

  useEffect(() => {
    if (!court) return

    const formatTime = (t: string) => (t ? t.substring(0, 5) : '00:00')
    const ruleSignature = (r: CourtPricingRuleResponse) =>
      `${r.dayOfWeek}_${formatTime(r.startTime)}_${formatTime(r.endTime)}_${r.price}_${r.durationMinutes}`

    const firstSport = court.sports[0]
    const refPrice = firstSport?.basePrice || court.basePrice || 20000
    const refDuration = firstSport?.durationMinutes || court.durationMinutes || 60
    const refRulesSig = (firstSport?.pricingRules || [])
      .map(ruleSignature)
      .sort()
      .join('|')

    const sportConfigsMap: Record<string, { basePrice: number; durationMinutes: number }> = {}
    let isCustomModality = false

    court.sports.forEach((s) => {
      sportConfigsMap[s.sportId] = {
        basePrice: s.basePrice,
        durationMinutes: s.durationMinutes,
      }
      if (s.basePrice !== refPrice || s.durationMinutes !== refDuration) {
        isCustomModality = true
      }
      const currentRulesSig = (s.pricingRules || [])
        .map(ruleSignature)
        .sort()
        .join('|')
      if (currentRulesSig !== refRulesSig) {
        isCustomModality = true
      }
    })

    if (court.sports.length <= 1) {
      isCustomModality = false
    }

    // SCRUM-50: Combinar metadatos de intención en localStorage con heurística de comparación contra tarifa base
    const savedIntentions = loadCourtCustomTierIntentions(court.id)

    const extractedTiers: CourtPricingTierPayload[] = []
    if (!isCustomModality) {
      const baseRules = firstSport?.pricingRules || []
      baseRules.forEach((r) => {
        const startTime = formatTime(r.startTime)
        const endTime = formatTime(r.endTime)
        const key = buildTierIntentionKey({
          dayOfWeek: r.dayOfWeek,
          startTime,
          endTime,
          sportId: undefined,
        })
        const stored = savedIntentions[key]
        const isPriceCustom = stored ? stored.isPriceCustom : r.price !== refPrice
        const isDurationCustom = stored
          ? stored.isDurationCustom
          : r.durationMinutes !== refDuration

        extractedTiers.push({
          dayOfWeek: r.dayOfWeek,
          startTime,
          endTime,
          price: r.price,
          durationMinutes: r.durationMinutes,
          sportId: undefined,
          isPriceCustom,
          isDurationCustom,
        })
      })
    } else {
      for (const s of court.sports) {
        for (const r of s.pricingRules) {
          const startTime = formatTime(r.startTime)
          const endTime = formatTime(r.endTime)
          const key = buildTierIntentionKey({
            dayOfWeek: r.dayOfWeek,
            startTime,
            endTime,
            sportId: s.sportId,
          })
          const stored = savedIntentions[key]
          const isPriceCustom = stored ? stored.isPriceCustom : r.price !== s.basePrice
          const isDurationCustom = stored
            ? stored.isDurationCustom
            : r.durationMinutes !== s.durationMinutes

          extractedTiers.push({
            dayOfWeek: r.dayOfWeek,
            startTime,
            endTime,
            price: r.price,
            durationMinutes: r.durationMinutes,
            sportId: s.sportId,
            isPriceCustom,
            isDurationCustom,
          })
        }
      }
    }

    const uniqueDays = Array.from(new Set(extractedTiers.map((t) => t.dayOfWeek))).sort(
      (a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)
    )

    const initialDays = uniqueDays.length > 0 ? uniqueDays : [1, 2, 3, 4, 5]
    const firstTierStart = extractedTiers[0]?.startTime || '08:00'
    const firstTierEnd = extractedTiers[0]?.endTime || '23:00'

    // Determinar si la cancha tiene un horario uniforme sin personalizaciones por franja
    const slotCountByDaySport = new Map<string, number>()
    let hasMultipleSlotsPerDay = false
    for (const t of extractedTiers) {
      const k = `${t.dayOfWeek}_${t.sportId || 'general'}`
      const nextCount = (slotCountByDaySport.get(k) || 0) + 1
      slotCountByDaySport.set(k, nextCount)
      if (nextCount > 1) {
        hasMultipleSlotsPerDay = true
      }
    }

    const hasDifferentSchedulesAcrossTiers = extractedTiers.some(
      (t) => t.startTime !== firstTierStart || t.endTime !== firstTierEnd
    )
    const hasCustomPriceOrDuration = extractedTiers.some(
      (t) => t.isPriceCustom || t.isDurationCustom
    )

    const shouldStartInAdvancedMode =
      hasMultipleSlotsPerDay || hasDifferentSchedulesAcrossTiers || hasCustomPriceOrDuration

    setSelectedDays(initialDays)
    setOpeningTime(firstTierStart)
    setClosingTime(firstTierEnd)
    setIsAdvancedPricingMode(shouldStartInAdvancedMode)
    setPricingTiers(extractedTiers)
    setCustomSportConfigs(sportConfigsMap)
    setCustomizePricesBySport(isCustomModality)

    const sportIds = court.sports.map((s) => s.sportId)
    const initialForm = {
      name: court.name,
      surfaceType: court.surfaceType,
      isCovered: court.isCovered,
      hasLighting: court.hasLighting,
      basePrice: refPrice,
      durationMinutes: refDuration,
      sportIds,
    }

    setFormData(initialForm)

    const snapshotObj = {
      formData: initialForm,
      selectedDays: initialDays,
      pricingTiers: extractedTiers,
      customSportConfigs: sportConfigsMap,
      customizePricesBySport: isCustomModality,
    }
    setInitialSnapshot(JSON.stringify(snapshotObj))
  }, [court])

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false
    const currentSnapshotObj = {
      formData,
      selectedDays,
      pricingTiers,
      customSportConfigs,
      customizePricesBySport,
    }
    return JSON.stringify(currentSnapshotObj) !== initialSnapshot
  }, [formData, selectedDays, pricingTiers, customSportConfigs, customizePricesBySport, initialSnapshot])

  // Determinar si las franjas actuales tienen múltiples horarios por día o distintos horarios entre días
  const hasComplexSchedule = useMemo(() => {
    if (pricingTiers.length === 0) return false
    const counts = new Map<string, number>()
    for (const t of pricingTiers) {
      const k = `${t.dayOfWeek}_${t.sportId || 'general'}`
      const c = (counts.get(k) || 0) + 1
      counts.set(k, c)
      if (c > 1) return true
    }
    const refStart = pricingTiers[0].startTime
    const refEnd = pricingTiers[0].endTime
    return pricingTiers.some((t) => t.startTime !== refStart || t.endTime !== refEnd)
  }, [pricingTiers])

  const customizedTiersCount = useMemo(
    () => pricingTiers.filter((t) => t.isPriceCustom || t.isDurationCustom).length,
    [pricingTiers]
  )

  const handleBasePriceChange = (nextBasePrice: number) => {
    setFormData((prev) => ({ ...prev, basePrice: nextBasePrice }))
    // SCRUM-50: Propagar el nuevo precio base en tiempo real a todas las franjas que no fueron personalizadas manualmente
    setPricingTiers((prev) =>
      prev.map((tier) => (tier.isPriceCustom ? tier : { ...tier, price: nextBasePrice }))
    )
    if (errors.basePrice) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.basePrice
        return copy
      })
    }
  }

  const handleBaseDurationChange = (nextDuration: number) => {
    setFormData((prev) => ({ ...prev, durationMinutes: nextDuration }))
    // SCRUM-50: Propagar la nueva duración base en tiempo real a todas las franjas que no fueron personalizadas manualmente
    setPricingTiers((prev) =>
      prev.map((tier) =>
        tier.isDurationCustom ? tier : { ...tier, durationMinutes: nextDuration }
      )
    )
    if (errors.durationMinutes) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.durationMinutes
        return copy
      })
    }
  }

  const handleSportBasePriceChange = (sportId: string, nextSportPrice: number) => {
    const config = customSportConfigs[sportId] || {
      basePrice: formData.basePrice,
      durationMinutes: formData.durationMinutes,
    }
    setCustomSportConfigs((prev) => ({
      ...prev,
      [sportId]: { ...config, basePrice: nextSportPrice },
    }))
    // SCRUM-50: Propagar a las franjas de ese deporte que no tengan precio personalizado
    setPricingTiers((prev) =>
      prev.map((tier) =>
        tier.sportId === sportId && !tier.isPriceCustom
          ? { ...tier, price: nextSportPrice }
          : tier
      )
    )
    if (errors.customSports) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.customSports
        return copy
      })
    }
  }

  const handleSportDurationChange = (sportId: string, nextSportDuration: number) => {
    const config = customSportConfigs[sportId] || {
      basePrice: formData.basePrice,
      durationMinutes: formData.durationMinutes,
    }
    setCustomSportConfigs((prev) => ({
      ...prev,
      [sportId]: { ...config, durationMinutes: nextSportDuration },
    }))
    // SCRUM-50: Propagar a las franjas de ese deporte que no tengan duración personalizada
    setPricingTiers((prev) =>
      prev.map((tier) =>
        tier.sportId === sportId && !tier.isDurationCustom
          ? { ...tier, durationMinutes: nextSportDuration }
          : tier
      )
    )
    if (errors.customSports) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.customSports
        return copy
      })
    }
  }

  const handleGeneralOpeningTimeChange = (nextOpening: string) => {
    setOpeningTime(nextOpening)
    if (!hasComplexSchedule) {
      setPricingTiers((prev) => prev.map((t) => ({ ...t, startTime: nextOpening })))
    }
    if (errors.tiers) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.tiers
        return copy
      })
    }
  }

  const handleGeneralClosingTimeChange = (nextClosing: string) => {
    setClosingTime(nextClosing)
    if (!hasComplexSchedule) {
      setPricingTiers((prev) => prev.map((t) => ({ ...t, endTime: nextClosing })))
    }
    if (errors.tiers) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.tiers
        return copy
      })
    }
  }

  const syncDaysWithTiers = (nextDays: number[]) => {
    setSelectedDays(nextDays)
    setPricingTiers((prev) => {
      const kept = prev.filter((t) => nextDays.includes(t.dayOfWeek))
      const added: CourtPricingTierPayload[] = []

      for (const dayId of nextDays) {
        const hasDay = kept.some((t) => t.dayOfWeek === dayId)
        if (!hasDay) {
          if (customizePricesBySport && formData.sportIds.length > 0) {
            for (const sportId of formData.sportIds) {
              const cfg = customSportConfigs[sportId]
              added.push({
                dayOfWeek: dayId,
                startTime: openingTime,
                endTime: closingTime,
                price: cfg?.basePrice ?? formData.basePrice,
                durationMinutes: cfg?.durationMinutes ?? formData.durationMinutes,
                sportId,
                isPriceCustom: false,
                isDurationCustom: false,
              })
            }
          } else {
            added.push({
              dayOfWeek: dayId,
              startTime: openingTime,
              endTime: closingTime,
              price: formData.basePrice,
              durationMinutes: formData.durationMinutes,
              sportId: undefined,
              isPriceCustom: false,
              isDurationCustom: false,
            })
          }
        }
      }

      return [...kept, ...added]
    })
  }

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true)
    } else {
      navigate('/admin/courts')
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    navigate('/admin/courts')
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
    setPricingTiers((prev) =>
      normalizeTiersForModality(
        prev,
        nextChecked,
        formData.sportIds,
        nextConfigs,
        formData.basePrice,
        formData.durationMinutes,
        selectedDays
      )
    )
  }

  const handleToggleSport = (sportId: string) => {
    const exists = formData.sportIds.includes(sportId)
    const nextSports = exists
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

    const effectiveCustomize = nextSports.length > 1 ? customizePricesBySport : false
    if (nextSports.length <= 1 && customizePricesBySport) {
      setCustomizePricesBySport(false)
    }

    setFormData((prev) => ({ ...prev, sportIds: nextSports }))
    setPricingTiers((prev) =>
      normalizeTiersForModality(
        prev,
        effectiveCustomize,
        nextSports,
        nextConfigs,
        formData.basePrice,
        formData.durationMinutes,
        selectedDays
      )
    )

    if (errors.sportIds) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.sportIds
        return copy
      })
    }
  }

  const handleToggleDay = (dayId: number) => {
    const exists = selectedDays.includes(dayId)
    if (exists) {
      if (selectedDays.length <= 1) {
        toast.error('Debe seleccionar al menos un día operativo')
        return
      }
      syncDaysWithTiers(selectedDays.filter((d) => d !== dayId))
    } else {
      const nextDays = [...selectedDays, dayId].sort(
        (a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)
      )
      syncDaysWithTiers(nextDays)
    }
  }

  const handleSelectAllDays = () => {
    syncDaysWithTiers([1, 2, 3, 4, 5, 6, 0])
  }

  const handleSelectWeekdays = () => {
    syncDaysWithTiers([1, 2, 3, 4, 5])
  }

  const handleSelectWeekends = () => {
    syncDaysWithTiers([6, 0])
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la cancha es obligatorio'
    } else if (formData.name.length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres'
    }

    if (!formData.surfaceType) {
      newErrors.surfaceType = 'La superficie es obligatoria'
    }

    if (formData.sportIds.length === 0) {
      newErrors.sportIds = 'Debe seleccionar al menos un deporte'
    }

    if (!customizePricesBySport) {
      if (!formData.basePrice || formData.basePrice <= 0) {
        newErrors.basePrice = 'El precio base debe ser mayor a $0'
      }

      if (
        !formData.durationMinutes ||
        formData.durationMinutes < 30 ||
        formData.durationMinutes > 480 ||
        formData.durationMinutes % 15 !== 0
      ) {
        newErrors.durationMinutes = 'La duración debe estar entre 30 y 480 min en múltiplos de 15'
      }
    } else {
      for (const sportId of formData.sportIds) {
        const cfg = customSportConfigs[sportId]
        const sportName = sports.find((s) => s.id === sportId)?.name || 'Deporte'
        if (!cfg || !cfg.basePrice || cfg.basePrice <= 0) {
          newErrors.customSports = `El precio de ${sportName} debe ser mayor a $0`
          break
        }
        if (
          !cfg.durationMinutes ||
          cfg.durationMinutes < 30 ||
          cfg.durationMinutes > 480 ||
          cfg.durationMinutes % 15 !== 0
        ) {
          newErrors.customSports = `La duración de ${sportName} debe ser múltiplo de 15 min`
          break
        }
      }
    }

    if (selectedDays.length === 0) {
      newErrors.days = 'Debe seleccionar al menos un día operativo'
    }

    const activeDayTiers = pricingTiers.filter((t) => selectedDays.includes(t.dayOfWeek))

    if (activeDayTiers.length === 0) {
      newErrors.tiers = 'Debe configurar al menos una franja horaria'
    } else if (activeDayTiers.some((t) => !t.price || t.price <= 0)) {
      newErrors.tiers = 'Todas las franjas horarias deben tener un precio mayor a $0'
    } else if (activeDayTiers.some((t) => t.startTime === t.endTime)) {
      newErrors.tiers = 'El horario de inicio y fin de una franja no pueden ser idénticos'
    } else if (customizePricesBySport) {
      if (activeDayTiers.some((t) => !t.sportId)) {
        newErrors.tiers =
          'En modalidad de tarifas personalizadas, cada franja debe estar asociada a un deporte'
      } else if (
        !formData.sportIds.every((sId) => activeDayTiers.some((t) => t.sportId === sId))
      ) {
        newErrors.tiers =
          'Cada deporte seleccionado debe contar con al menos una franja horaria configurada'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Por favor corrige los errores del formulario')
      return
    }

    if (!courtId) return

    const customSportPrices: CourtSportConfigPayload[] | undefined = customizePricesBySport
      ? formData.sportIds.map((sportId) => {
          const custom = customSportConfigs[sportId]
          return {
            sportId,
            basePrice: custom ? custom.basePrice : formData.basePrice,
            durationMinutes: custom ? custom.durationMinutes : formData.durationMinutes,
          }
        })
      : undefined

    // SCRUM-50: Siempre enviar las franjas reales sincronizadas (nunca sobrescribir horarios con un fijo 08:00-23:00)
    const effectivePricingTiers: CourtPricingTierPayload[] = pricingTiers
      .filter((t) => selectedDays.includes(t.dayOfWeek))
      .map((t) => ({
        ...t,
        sportId: customizePricesBySport ? t.sportId || formData.sportIds[0] : undefined,
      }))

    const effectiveRootBasePrice: number =
      customizePricesBySport && customSportPrices && customSportPrices.length > 0
        ? (customSportPrices[0].basePrice ?? formData.basePrice)
        : formData.basePrice

    const effectiveRootDuration: number =
      customizePricesBySport && customSportPrices && customSportPrices.length > 0
        ? (customSportPrices[0].durationMinutes ?? formData.durationMinutes)
        : formData.durationMinutes

    const payload: UpdateCourtPayload = {
      name: formData.name.trim(),
      surfaceType: formData.surfaceType,
      isCovered: formData.isCovered,
      hasLighting: formData.hasLighting,
      basePrice: effectiveRootBasePrice,
      durationMinutes: effectiveRootDuration,
      sportIds: formData.sportIds,
      pricingTiers: effectivePricingTiers,
      customSportPrices,
    }

    try {
      await updateCourtMutation.mutateAsync({ id: courtId, payload })
      saveCourtCustomTierIntentions(courtId, effectivePricingTiers)
      toast.success('Cancha actualizada correctamente', {
        description: `Se guardaron todos los cambios de "${formData.name}".`,
      })
      navigate('/admin/courts')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data

        if (error.response.status === 409) {
          toast.error('Conflicto con turnos existentes', {
            description:
              problem?.detail ||
              'Existen reservas futuras confirmadas en los horarios o disciplinas modificados.',
          })
          return
        }

        if (error.response.status === 400 && problem?.errors) {
          const detail = Object.values(problem.errors).flat().join(' ')
          toast.error('Error de validación', {
            description: detail,
          })
          return
        }
      }

      toast.error('Error al actualizar cancha', {
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

  if (isLoadingCourt || isLoadingSports) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-10 bg-[#22242B] animate-pulse rounded-xl border border-[#31343E]" />
        <div className="h-32 bg-[#22242B] animate-pulse rounded-xl border border-[#31343E]" />
        <div className="h-64 bg-[#22242B] animate-pulse rounded-xl border border-[#31343E]" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F2F3F5]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#31343E] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#9497A1] mb-1">
            <Link to="/admin/courts" className="hover:text-emerald-400 transition-colors">
              Canchas
            </Link>
            <span>/</span>
            <span className="text-[#F2F3F5]">Modificar Cancha</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F2F3F5] uppercase tracking-tight font-headline">
            Modificar: {court?.name || 'Cancha'}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleAttemptClose}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 border border-[#31343E] bg-[#22242B] rounded-xl text-xs font-bold uppercase tracking-wider text-[#F2F3F5] hover:bg-[#2d3039] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          <span>Volver a Canchas</span>
        </button>
      </div>

      <div className="bg-[#16181D] border border-[#31343E] rounded-xl p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="h-5 w-5 text-[#327357] mt-0.5 shrink-0" strokeWidth={2} />
        <div className="text-xs text-[#9497A1] leading-relaxed font-mono font-medium">
          <strong className="text-[#F2F3F5]">Protección de Integridad:</strong> Las modificaciones en tarifas aplican exclusivamente a nuevas reservas. Los turnos futuros agendados conservan su precio original pactado. Si modificás horarios o quitás disciplinas con turnos confirmados existentes, la operación será rechazada automáticamente.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
          {errors.general && (
            <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-xl text-red-300 text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" strokeWidth={2} />
              <span>{errors.general}</span>
            </div>
          )}

          {/* 1. IDENTIFICACIÓN Y SUPERFICIE */}
          <section className="bg-[#16181D] border border-[#31343E] rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-[#31343E] pb-3">
              <Layers className="h-5 w-5 text-[#327357]" strokeWidth={2} />
              <h2 className="text-base font-black uppercase tracking-tight text-[#F2F3F5] font-headline">
                Identificación y Superficie
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="courtName" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#9497A1] mb-1.5">
                  Nombre de la Cancha *
                </label>
                <input
                  id="courtName"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) {
                      setErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.name
                        return copy
                      })
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border bg-[#22242B] text-[#F2F3F5] focus:outline-hidden ${
                    errors.name ? 'border-red-500' : 'border-[#31343E] focus:border-[#258653]'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1 font-mono">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="surfaceType" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#9497A1] mb-1.5">
                  Tipo de Superficie *
                </label>
                <select
                  id="surfaceType"
                  value={formData.surfaceType}
                  onChange={(e) => setFormData({ ...formData, surfaceType: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl border border-[#31343E] bg-[#22242B] text-[#F2F3F5] focus:outline-hidden focus:border-[#258653] cursor-pointer"
                >
                  {SURFACE_OPTIONS.map((surf) => (
                    <option key={surf} value={surf} className="bg-[#22242B] text-[#F2F3F5]">
                      {surf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3.5 border border-[#31343E] bg-[#22242B] rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isCovered}
                  onChange={(e) => setFormData({ ...formData, isCovered: e.target.checked })}
                  className="h-4 w-4 rounded border-[#31343E] bg-[#16181D] text-[#258653] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-[#F2F3F5] block">Cancha Techada</span>
                  <span className="text-xs font-medium text-[#9497A1]">Protección contra lluvia o intemperie</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 border border-[#31343E] bg-[#22242B] rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.hasLighting}
                  onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
                  className="h-4 w-4 rounded border-[#31343E] bg-[#16181D] text-[#258653] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-[#F2F3F5] block">Iluminación Artificial</span>
                  <span className="text-xs font-medium text-[#9497A1]">Apta para turnos nocturnos</span>
                </div>
              </label>
            </div>
          </section>

          {/* 2. DEPORTES COMPATIBLES */}
          <section className="bg-[#16181D] border border-[#31343E] rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#31343E] pb-3">
              <h2 className="text-base font-black uppercase tracking-tight text-[#F2F3F5] font-headline">
                Deportes Compatibles *
              </h2>
              <span className="text-xs font-medium text-[#9497A1]">Seleccioná al menos una disciplina</span>
            </div>

            {errors.sportIds && <p className="text-xs text-red-400 font-mono">{errors.sportIds}</p>}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sports.map((sport) => {
                const isSelected = formData.sportIds.includes(sport.id)
                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => handleToggleSport(sport.id)}
                    className={`min-h-[44px] p-3.5 rounded-xl border text-left transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#258653] bg-[#258653]/15 text-emerald-400'
                        : 'border-[#31343E] bg-[#22242B] hover:bg-[#2d3039] text-[#9497A1]'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">{sport.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />}
                  </button>
                )
              })}
            </div>

            {formData.sportIds.length > 1 && (
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3.5 border border-[#31343E] bg-[#22242B] rounded-xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customizePricesBySport}
                    onChange={(e) => handleToggleCustomizePricesBySport(e.target.checked)}
                    className="h-4 w-4 rounded border-[#31343E] bg-[#16181D] text-[#258653] focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#F2F3F5] block">
                      Personalizar precios, duraciones y franjas según el deporte
                    </span>
                    <span className="text-xs font-medium text-[#9497A1]">
                      Cada disciplina tendrá su propio precio base, duración y franjas horarias específicas
                    </span>
                  </div>
                </label>
              </div>
            )}
          </section>

          {/* 3. TARIFAS Y DURACIONES BASE */}
          <section className="bg-[#16181D] border border-[#31343E] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#31343E] pb-3">
              <div>
                <h2 className="text-base font-black uppercase tracking-tight text-[#F2F3F5] font-headline">
                  {customizePricesBySport ? 'Tarifas y Duraciones por Deporte' : 'Tarifa y Duración Base'}
                </h2>
                <p className="text-xs text-[#9497A1] mt-0.5">
                  Al modificar estos valores generales se actualizan automáticamente todas las franjas que no hayan sido personalizadas individualmente.
                </p>
              </div>
            </div>

            {!customizePricesBySport ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="basePrice" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#9497A1] mb-1.5">
                    Precio Base ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-[#327357]" strokeWidth={2} />
                    <NumericInput
                      id="basePrice"
                      value={formData.basePrice}
                      onChange={handleBasePriceChange}
                      placeholder="Ej: 20000"
                      className={`w-full pl-9 pr-3.5 py-2.5 text-base sm:text-sm rounded-xl border bg-[#22242B] focus:outline-hidden font-mono font-bold text-[#F2F3F5] ${
                        errors.basePrice
                          ? 'border-red-500'
                          : 'border-[#31343E] focus:border-[#258653]'
                      }`}
                    />
                  </div>
                  {errors.basePrice && (
                    <p className="text-xs text-red-400 mt-1 font-mono">{errors.basePrice}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="durationMinutes" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#9497A1] mb-1.5">
                    Duración del Turno (min) *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-[#327357]" strokeWidth={2} />
                    <NumericInput
                      id="durationMinutes"
                      value={formData.durationMinutes}
                      onChange={handleBaseDurationChange}
                      placeholder="Ej: 60"
                      className={`w-full pl-9 pr-3.5 py-2.5 text-base sm:text-sm rounded-xl border bg-[#22242B] focus:outline-hidden font-mono font-bold text-[#F2F3F5] ${
                        errors.durationMinutes
                          ? 'border-red-500'
                          : 'border-[#31343E] focus:border-[#258653]'
                      }`}
                    />
                  </div>
                  {errors.durationMinutes && (
                    <p className="text-xs text-red-400 mt-1 font-mono">{errors.durationMinutes}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.sportIds.map((sportId) => {
                  const sport = sports.find((s) => s.id === sportId)
                  const config = customSportConfigs[sportId] || {
                    basePrice: formData.basePrice,
                    durationMinutes: formData.durationMinutes,
                  }
                  return (
                    <div key={sportId} className="p-4 bg-[#22242B] border border-[#31343E] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <span className="text-xs font-bold uppercase text-[#F2F3F5]">{sport?.name || sportId}</span>
                      <div>
                        <span className="text-[11px] font-mono uppercase font-bold text-[#9497A1] block mb-1">Precio Base ($)</span>
                        <NumericInput
                          value={config.basePrice}
                          onChange={(val) => handleSportBasePriceChange(sportId, val)}
                          placeholder="Ej: 20000"
                          className="w-full px-3 py-2 text-base sm:text-sm rounded-lg border border-[#31343E] bg-[#16181D] font-mono font-bold text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase font-bold text-[#9497A1] block mb-1">Duración (min)</span>
                        <NumericInput
                          value={config.durationMinutes}
                          onChange={(val) => handleSportDurationChange(sportId, val)}
                          placeholder="Ej: 60"
                          className="w-full px-3 py-2 text-base sm:text-sm rounded-lg border border-[#31343E] bg-[#16181D] font-mono font-bold text-[#F2F3F5] focus:outline-hidden focus:border-[#258653]"
                        />
                      </div>
                    </div>
                  )
                })}
                {errors.customSports && (
                  <p className="text-xs text-red-400 font-mono">{errors.customSports}</p>
                )}
              </div>
            )}
          </section>

          {/* 4. DÍAS OPERATIVOS, HORARIO GENERAL Y FRANJAS AVANZADAS */}
          <section className="bg-[#16181D] border border-[#31343E] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#31343E] pb-3">
              <div>
                <h2 className="text-base font-black uppercase tracking-tight text-[#F2F3F5] font-headline">
                  Días Operativos y Horarios
                </h2>
                <p className="text-xs text-[#9497A1] mt-0.5">
                  Definí los días activos y el horario general, o desplegá las franjas avanzadas para personalizar un día o turno puntual.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="min-h-[36px] text-xs font-mono font-bold uppercase px-3 py-1.5 bg-[#22242B] hover:bg-[#2d3039] text-[#F2F3F5] border border-[#31343E] rounded-lg transition-colors cursor-pointer"
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={handleSelectWeekdays}
                  className="min-h-[36px] text-xs font-mono font-bold uppercase px-3 py-1.5 bg-[#22242B] hover:bg-[#2d3039] text-[#F2F3F5] border border-[#31343E] rounded-lg transition-colors cursor-pointer"
                >
                  Lun-Vie
                </button>
                <button
                  type="button"
                  onClick={handleSelectWeekends}
                  className="min-h-[36px] text-xs font-mono font-bold uppercase px-3 py-1.5 bg-[#22242B] hover:bg-[#2d3039] text-[#F2F3F5] border border-[#31343E] rounded-lg transition-colors cursor-pointer"
                >
                  Sáb-Dom
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.id)
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleToggleDay(day.id)}
                    className={`min-h-[44px] py-2 text-center text-xs font-mono font-bold uppercase transition-colors cursor-pointer border rounded-xl ${
                      isSelected
                        ? 'bg-[#258653] border-[#258653] text-white shadow-xs'
                        : 'bg-[#22242B] border-[#31343E] text-[#9497A1] hover:text-[#F2F3F5] hover:bg-[#2d3039]'
                    }`}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>

            {!isAdvancedPricingMode && !hasComplexSchedule && (
              <div className="p-4 sm:p-5 border border-[#31343E] bg-[#1E2027] rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#31343E] pb-2">
                  <span className="text-xs font-mono uppercase font-bold text-[#F2F3F5]">
                    Horario General de Funcionamiento
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#9497A1]">
                    Aplica a todos los días activos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-opening-time"
                      className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider flex items-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                      <span>Horario de Apertura *</span>
                    </label>
                    <select
                      id="edit-opening-time"
                      value={openingTime}
                      onChange={(e) => handleGeneralOpeningTimeChange(e.target.value)}
                      className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] font-mono focus:outline-hidden focus:border-[#258653] cursor-pointer"
                    >
                      {QUARTER_HOUR_TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-[#16181D]">
                          {t} hs
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-closing-time"
                      className="text-xs font-mono uppercase font-bold text-[#9497A1] tracking-wider flex items-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
                      <span>Horario de Cierre *</span>
                    </label>
                    <select
                      id="edit-closing-time"
                      value={closingTime}
                      onChange={(e) => handleGeneralClosingTimeChange(e.target.value)}
                      className="w-full bg-[#16181D] border border-[#31343E] rounded-xl px-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] font-mono focus:outline-hidden focus:border-[#258653] cursor-pointer"
                    >
                      {QUARTER_HOUR_TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} className="bg-[#16181D]">
                          {t} hs
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-[#31343E] rounded-xl bg-[#1E2027] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAdvancedPricingMode((prev) => !prev)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#22242B] transition-colors cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F2F3F5] flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#327357]" strokeWidth={2} />
                    <span>Configuraciones avanzadas de franjas y tarifas por día</span>
                    {customizedTiersCount > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-[#258653]/15 px-2 py-0.5 rounded-md border border-[#327357]/30">
                        {customizedTiersCount} personalizada(s)
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-mono text-[#9497A1] block">
                    {isAdvancedPricingMode
                      ? 'Podés ajustar horarios o precios de días/franjas específicas manteniendo el resto vinculado al valor general.'
                      : 'Desplegá esta sección solo si necesitás personalizar el horario o tarifa de un día o franja particular.'}
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
                    selectedDays={selectedDays}
                    sportIds={formData.sportIds}
                    sports={sports}
                    tiers={pricingTiers}
                    onChange={(updated) => {
                      setPricingTiers(updated)
                      if (errors.tiers) {
                        setErrors((prev) => {
                          const copy = { ...prev }
                          delete copy.tiers
                          return copy
                        })
                      }
                    }}
                    defaultPrice={formData.basePrice}
                    defaultDuration={formData.durationMinutes}
                    customizePricesBySport={customizePricesBySport}
                    customSportConfigs={customSportConfigs}
                  />
                </div>
              )}
            </div>

            {errors.tiers && <p className="text-xs text-red-400 font-mono">{errors.tiers}</p>}
          </section>

          {showDiscardConfirm ? (
            <div className="p-5 bg-red-950/20 border border-red-800/50 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span className="text-sm font-black uppercase tracking-tight font-headline">
                  ¿Descartar modificaciones sin guardar?
                </span>
              </div>
              <p className="text-xs text-[#9497A1] leading-relaxed font-mono">
                Tenés cambios pendientes en la configuración de la cancha. Si salís ahora, se perderán las modificaciones realizadas.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F2F3F5] bg-[#22242B] border border-[#31343E] hover:bg-[#2d3039] rounded-xl cursor-pointer"
                >
                  Continuar Editando
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer shadow-md"
                >
                  Descartar y Salir
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#31343E]">
              <button
                type="button"
                onClick={handleAttemptClose}
                disabled={updateCourtMutation.isPending}
                className="min-h-[44px] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#9497A1] hover:text-[#F2F3F5] bg-[#22242B] border border-[#31343E] hover:bg-[#2d3039] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={updateCourtMutation.isPending}
                className="min-h-[44px] px-8 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#258653] hover:bg-[#1E6E44] rounded-xl shadow-md transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" strokeWidth={2} />
                <span>{updateCourtMutation.isPending ? 'Guardando...' : 'Guardar Modificaciones'}</span>
              </button>
            </div>
          )}
        </form>

        <div className="lg:col-span-5 sticky top-24">
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
    </div>
  )
}
