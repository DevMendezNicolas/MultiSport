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
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useCourt, useSports, useUpdateCourt } from '../hooks/useCourts'
import type {
  CourtPricingRuleResponse,
  CourtPricingTierPayload,
  CourtSportConfigPayload,
  UpdateCourtPayload,
} from '../types'
import { PricingTiersEditor } from '../components/PricingTiersEditor'

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

  // Form State
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
  const [pricingTiers, setPricingTiers] = useState<CourtPricingTierPayload[]>([])

  const [customizePricesBySport, setCustomizePricesBySport] = useState<boolean>(false)
  const [customSportConfigs, setCustomSportConfigs] = useState<
    Record<string, { basePrice: number; durationMinutes: number }>
  >({})

  const [initialSnapshot, setInitialSnapshot] = useState<string>('')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Extraer reglas y pre-cargar el formulario cuando court esté disponible
  useEffect(() => {
    if (!court) return

    const formatTime = (t: string) => (t ? t.substring(0, 5) : '00:00')

    // Extraer reglas existentes mapeadas a CourtPricingTierPayload
    const extractedTiers: CourtPricingTierPayload[] = []
    const allSportsCount = court.sports.length

    if (allSportsCount <= 1) {
      const singleSportRules = court.sports[0]?.pricingRules || []
      singleSportRules.forEach((r) => {
        extractedTiers.push({
          dayOfWeek: r.dayOfWeek,
          startTime: formatTime(r.startTime),
          endTime: formatTime(r.endTime),
          price: r.price,
          durationMinutes: r.durationMinutes,
          sportId: undefined,
        })
      })
    } else {
      const ruleKey = (r: CourtPricingRuleResponse) =>
        `${r.dayOfWeek}_${formatTime(r.startTime)}_${formatTime(r.endTime)}_${r.price}_${r.durationMinutes}`

      const keyCounts = new Map<string, number>()
      for (const s of court.sports) {
        for (const r of s.pricingRules) {
          const k = ruleKey(r)
          keyCounts.set(k, (keyCounts.get(k) || 0) + 1)
        }
      }

      const processedKeys = new Set<string>()
      for (const s of court.sports) {
        for (const r of s.pricingRules) {
          const k = ruleKey(r)
          if (processedKeys.has(k)) continue

          if (keyCounts.get(k) === allSportsCount) {
            extractedTiers.push({
              dayOfWeek: r.dayOfWeek,
              startTime: formatTime(r.startTime),
              endTime: formatTime(r.endTime),
              price: r.price,
              durationMinutes: r.durationMinutes,
              sportId: undefined,
            })
            processedKeys.add(k)
          } else {
            extractedTiers.push({
              dayOfWeek: r.dayOfWeek,
              startTime: formatTime(r.startTime),
              endTime: formatTime(r.endTime),
              price: r.price,
              durationMinutes: r.durationMinutes,
              sportId: s.sportId,
            })
          }
        }
      }
    }

    const uniqueDays = Array.from(new Set(extractedTiers.map((t) => t.dayOfWeek))).sort(
      (a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)
    )

    const initialDays = uniqueDays.length > 0 ? uniqueDays : [1, 2, 3, 4, 5]
    setSelectedDays(initialDays)
    setPricingTiers(extractedTiers)

    // Configurar customSportConfigs
    const sportConfigsMap: Record<string, { basePrice: number; durationMinutes: number }> = {}
    let hasDivergent = false
    const firstSport = court.sports[0]
    const refPrice = firstSport?.basePrice || 20000
    const refDuration = firstSport?.durationMinutes || 60

    court.sports.forEach((s) => {
      sportConfigsMap[s.sportId] = {
        basePrice: s.basePrice,
        durationMinutes: s.durationMinutes,
      }
      if (s.basePrice !== refPrice || s.durationMinutes !== refDuration) {
        hasDivergent = true
      }
    })

    setCustomSportConfigs(sportConfigsMap)
    setCustomizePricesBySport(hasDivergent)

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

    // Snapshot para detectar cambios no guardados
    const snapshotObj = {
      formData: initialForm,
      selectedDays: initialDays,
      pricingTiers: extractedTiers,
      customSportConfigs: sportConfigsMap,
      customizePricesBySport: hasDivergent,
    }
    setInitialSnapshot(JSON.stringify(snapshotObj))
  }, [court])

  // Calcular si hay cambios pendientes
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

  const handleToggleSport = (sportId: string) => {
    setFormData((prev) => {
      const exists = prev.sportIds.includes(sportId)
      const nextSports = exists
        ? prev.sportIds.filter((id) => id !== sportId)
        : [...prev.sportIds, sportId]
      return { ...prev, sportIds: nextSports }
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
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy.sportIds
        return copy
      })
    }
  }

  const handleToggleDay = (dayId: number) => {
    setSelectedDays((prev) => {
      const exists = prev.includes(dayId)
      if (exists) {
        if (prev.length <= 1) {
          toast.error('Debe seleccionar al menos un día operativo')
          return prev
        }
        return prev.filter((d) => d !== dayId)
      } else {
        return [...prev, dayId].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      }
    })
  }

  const handleSelectAllDays = () => {
    setSelectedDays([1, 2, 3, 4, 5, 6, 0])
  }

  const handleSelectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5])
  }

  const handleSelectWeekends = () => {
    setSelectedDays([6, 0])
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

    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'El precio base debe ser mayor a 0'
    }

    if (![30, 45, 60, 90, 120].includes(formData.durationMinutes)) {
      newErrors.durationMinutes = 'La duración debe ser 30, 45, 60, 90 o 120 min'
    }

    if (selectedDays.length === 0) {
      newErrors.days = 'Debe seleccionar al menos un día operativo'
    }

    // Validar overlapping en franjas horarias por día y deporte
    const timeToMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    const tiersByDayAndSport: Record<string, CourtPricingTierPayload[]> = {}
    for (const tier of pricingTiers) {
      const sportKey = tier.sportId || 'ALL'
      const key = `${tier.dayOfWeek}_${sportKey}`
      if (!tiersByDayAndSport[key]) tiersByDayAndSport[key] = []
      tiersByDayAndSport[key].push(tier)
    }

    for (const [, tiers] of Object.entries(tiersByDayAndSport)) {
      for (let i = 0; i < tiers.length; i++) {
        for (let j = i + 1; j < tiers.length; j++) {
          const t1 = tiers[i]
          const t2 = tiers[j]
          const s1 = timeToMinutes(t1.startTime)
          const e1 = timeToMinutes(t1.endTime)
          const s2 = timeToMinutes(t2.startTime)
          const e2 = timeToMinutes(t2.endTime)

          if (s1 < e2 && s2 < e1) {
            newErrors.tiers = 'Existen franjas horarias superpuestas para el mismo día y deporte.'
            break
          }
        }
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

    // Construir customSportPrices payload si aplica
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

    const payload: UpdateCourtPayload = {
      name: formData.name.trim(),
      surfaceType: formData.surfaceType,
      isCovered: formData.isCovered,
      hasLighting: formData.hasLighting,
      basePrice: formData.basePrice,
      durationMinutes: formData.durationMinutes,
      sportIds: formData.sportIds,
      pricingTiers,
      customSportPrices,
    }

    try {
      await updateCourtMutation.mutateAsync({ id: courtId, payload })
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
          const serverErrors: Record<string, string> = {}
          Object.entries(problem.errors).forEach(([k, msgs]) => {
            const field = k.charAt(0).toLowerCase() + k.slice(1)
            serverErrors[field] = (msgs as string[])[0]
          })
          setErrors(serverErrors)
          return
        }
      }

      toast.error('Error al actualizar cancha', {
        description: 'Ocurrió un error inesperado al procesar la solicitud.',
      })
    }
  }

  if (isLoadingCourt || isLoadingSports) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-10 bg-neutral-100 animate-pulse border border-neutral-200" />
        <div className="h-32 bg-neutral-100 animate-pulse border border-neutral-200" />
        <div className="h-64 bg-neutral-100 animate-pulse border border-neutral-200" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Barra de Navegación Superior y Migas de Pan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            <Link to="/admin/courts" className="hover:text-brand-sport transition-colors">
              Canchas
            </Link>
            <span>/</span>
            <span className="text-neutral-900">Modificar Cancha</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Modificar: {court?.name || 'Cancha'}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleAttemptClose}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          <span>Volver a Canchas</span>
        </button>
      </div>

      {/* Banner Informativo sobre Reservas Futuras e Inmutabilidad */}
      <div className="bg-[#FAF8F5] border border-neutral-200 p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="h-5 w-5 text-neutral-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
        <div className="text-xs text-neutral-600 leading-relaxed font-mono">
          <strong className="text-neutral-900">Protección de Integridad:</strong> Las modificaciones en tarifas aplican exclusivamente a nuevas reservas. Los turnos futuros agendados conservan su precio original pactado. Si modificás horarios o quitás disciplinas con turnos confirmados existentes, la operación será rechazada automáticamente.
        </div>
      </div>

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
            <span>{errors.general}</span>
          </div>
        )}

        {/* 1. IDENTIFICACIÓN Y SUPERFICIE */}
        <section className="bg-white border border-neutral-200 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Layers className="h-5 w-5 text-brand-sport" strokeWidth={2} />
            <h2 className="text-base font-black uppercase tracking-tight text-neutral-950">
              Identificación y Superficie
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="courtName" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
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
                className={`w-full px-3.5 py-2.5 text-base border bg-white focus:outline-none ${
                  errors.name ? 'border-red-500' : 'border-neutral-300 focus:border-brand-sport'
                }`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="surfaceType" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Tipo de Superficie *
              </label>
              <select
                id="surfaceType"
                value={formData.surfaceType}
                onChange={(e) => setFormData({ ...formData, surfaceType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-base border border-neutral-300 bg-white focus:outline-none focus:border-brand-sport"
              >
                {SURFACE_OPTIONS.map((surf) => (
                  <option key={surf} value={surf}>
                    {surf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Características Adicionales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-3 p-3.5 border border-neutral-200 bg-neutral-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isCovered}
                onChange={(e) => setFormData({ ...formData, isCovered: e.target.checked })}
                className="h-4 w-4 rounded-none border-neutral-300 text-brand-sport focus:ring-brand-sport"
              />
              <div>
                <span className="text-xs font-bold text-neutral-900 block">Cancha Techada</span>
                <span className="text-[11px] text-neutral-500">Protección contra lluvia o intemperie</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 border border-neutral-200 bg-neutral-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.hasLighting}
                onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
                className="h-4 w-4 rounded-none border-neutral-300 text-brand-sport focus:ring-brand-sport"
              />
              <div>
                <span className="text-xs font-bold text-neutral-900 block">Iluminación Artificial</span>
                <span className="text-[11px] text-neutral-500">Apta para turnos nocturnos</span>
              </div>
            </label>
          </div>
        </section>

        {/* 2. DEPORTES COMPATIBLES */}
        <section className="bg-white border border-neutral-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="text-base font-black uppercase tracking-tight text-neutral-950">
              Deportes Compatibles *
            </h2>
            <span className="text-xs text-neutral-500">Seleccioná al menos una disciplina</span>
          </div>

          {errors.sportIds && <p className="text-xs text-red-600">{errors.sportIds}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sports.map((sport) => {
              const isSelected = formData.sportIds.includes(sport.id)
              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => handleToggleSport(sport.id)}
                  className={`p-3.5 border text-left transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-brand-sport bg-brand-soft/20 text-neutral-950'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold uppercase">{sport.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-brand-sport" strokeWidth={2.5} />}
                </button>
              )
            })}
          </div>

          {/* Opción de precios diferenciados por deporte */}
          {formData.sportIds.length > 1 && (
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3.5 border border-neutral-200 bg-[#FAF8F5] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={customizePricesBySport}
                  onChange={(e) => setCustomizePricesBySport(e.target.checked)}
                  className="h-4 w-4 rounded-none border-neutral-300 text-brand-sport focus:ring-brand-sport"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">
                    Personalizar precios y duraciones base según el deporte
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Permite fijar tarifas y duraciones específicas para cada disciplina
                  </span>
                </div>
              </label>
            </div>
          )}
        </section>

        {/* 3. TARIFAS Y DURACIONES BASE */}
        <section className="bg-white border border-neutral-200 p-6 space-y-6">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="text-base font-black uppercase tracking-tight text-neutral-950">
              Tarifa y Duración Base
            </h2>
          </div>

          {!customizePricesBySport ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="basePrice" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Precio Base ($) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-neutral-400" strokeWidth={2} />
                  <input
                    id="basePrice"
                    type="number"
                    min="1"
                    step="500"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full pl-9 pr-3.5 py-2.5 text-base border border-neutral-300 bg-white focus:outline-none focus:border-brand-sport font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="durationMinutes" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Duración del Turno *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" strokeWidth={2} />
                  <select
                    id="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full pl-9 pr-3.5 py-2.5 text-base border border-neutral-300 bg-white focus:outline-none focus:border-brand-sport"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={90}>90 minutos (1 hora y media)</option>
                    <option value={120}>120 minutos (2 horas)</option>
                  </select>
                </div>
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
                  <div key={sportId} className="p-4 bg-neutral-50 border border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <span className="text-xs font-bold uppercase text-neutral-900">{sport?.name || sportId}</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Precio Base ($)</span>
                      <input
                        type="number"
                        min="1"
                        step="500"
                        value={config.basePrice}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCustomSportConfigs((prev) => ({
                            ...prev,
                            [sportId]: { ...config, basePrice: val },
                          }))
                        }}
                        className="w-full px-3 py-2 text-base border border-neutral-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Duración</span>
                      <select
                        value={config.durationMinutes}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCustomSportConfigs((prev) => ({
                            ...prev,
                            [sportId]: { ...config, durationMinutes: val },
                          }))
                        }}
                        className="w-full px-3 py-2 text-base border border-neutral-300 bg-white"
                      >
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>60 minutos</option>
                        <option value={90}>90 minutos</option>
                        <option value={120}>120 minutos</option>
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 4. DÍAS Y FRANJAS HORARIAS DINÁMICAS */}
        <section className="bg-white border border-neutral-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 pb-3">
            <h2 className="text-base font-black uppercase tracking-tight text-neutral-950">
              Días Operativos y Franjas Horarias
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllDays}
                className="text-[11px] font-bold uppercase px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={handleSelectWeekdays}
                className="text-[11px] font-bold uppercase px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              >
                Lun-Vie
              </button>
              <button
                type="button"
                onClick={handleSelectWeekends}
                className="text-[11px] font-bold uppercase px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              >
                Sáb-Dom
              </button>
            </div>
          </div>

          {/* Selector de Días */}
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day.id)
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => handleToggleDay(day.id)}
                  className={`py-2 text-center text-xs font-bold uppercase transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {day.short}
                </button>
              )
            })}
          </div>

          {/* Editor de Franjas y Reglas Escalonadas */}
          <PricingTiersEditor
            selectedDays={selectedDays}
            sportIds={formData.sportIds}
            sports={sports}
            tiers={pricingTiers}
            onChange={setPricingTiers}
            defaultPrice={formData.basePrice}
            defaultDuration={formData.durationMinutes}
          />
        </section>

        {/* Barra de Acciones Fija Inferior */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200">
          <button
            type="button"
            onClick={handleAttemptClose}
            disabled={updateCourtMutation.isPending}
            className="min-h-[44px] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={updateCourtMutation.isPending}
            className="min-h-[44px] px-8 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-brand-sport hover:bg-brand-sport-hover transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" strokeWidth={2} />
            <span>{updateCourtMutation.isPending ? 'Guardando...' : 'Guardar Modificaciones'}</span>
          </button>
        </div>
      </form>

      {/* Diálogo de Confirmación para Descartar Cambios (AlertDialog Compacto) */}
      {showDiscardConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white border border-neutral-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600 border-b border-neutral-200 pb-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
              <h3 className="text-base font-black uppercase text-neutral-950">
                ¿Descartar modificaciones?
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed font-mono">
              Tenés cambios no guardados en la configuración de la cancha. Si salís ahora, se perderán todas las modificaciones realizadas.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="min-h-[40px] px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 border border-neutral-300 hover:bg-neutral-50 cursor-pointer"
              >
                Continuar Editando
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="min-h-[40px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 cursor-pointer"
              >
                Descartar y Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
