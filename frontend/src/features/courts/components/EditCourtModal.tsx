import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  AlertCircle,
  Save,
  Calendar,
  DollarSign,
  Check,
  Info,
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

interface EditCourtModalProps {
  courtId: string | null
  isOpen: boolean
  onClose: () => void
}

export const EditCourtModal: React.FC<EditCourtModalProps> = ({
  courtId,
  isOpen,
  onClose,
}) => {
  const { data: court, isLoading: isLoadingCourt } = useCourt(courtId)
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

    const initialSportIds = court.sports.map((s) => s.sportId)
    const initialSportConfigs: Record<string, { basePrice: number; durationMinutes: number }> = {}
    let hasDifferentSportPrices = false

    court.sports.forEach((s) => {
      initialSportConfigs[s.sportId] = {
        basePrice: s.basePrice,
        durationMinutes: s.durationMinutes,
      }
      if (s.basePrice !== court.basePrice || s.durationMinutes !== court.durationMinutes) {
        hasDifferentSportPrices = true
      }
    })

    const initialFormData = {
      name: court.name,
      surfaceType: court.surfaceType,
      isCovered: court.isCovered,
      hasLighting: court.hasLighting,
      basePrice: court.basePrice,
      durationMinutes: court.durationMinutes,
      sportIds: initialSportIds,
    }

    setFormData(initialFormData)
    setSelectedDays(uniqueDays.length > 0 ? uniqueDays : [1, 2, 3, 4, 5])
    setPricingTiers(extractedTiers)
    setCustomizePricesBySport(hasDifferentSportPrices)
    setCustomSportConfigs(initialSportConfigs)
    setErrors({})
    setShowDiscardConfirm(false)

    // Snapshot para detectar cambios no guardados
    const snapshot = JSON.stringify({
      formData: initialFormData,
      selectedDays: uniqueDays,
      pricingTiers: extractedTiers,
      customSportConfigs: initialSportConfigs,
      customizePricesBySport: hasDifferentSportPrices,
    })
    setInitialSnapshot(snapshot)
  }, [court])

  // Comprobar si hay cambios sin guardar
  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false
    const currentSnapshot = JSON.stringify({
      formData,
      selectedDays,
      pricingTiers,
      customSportConfigs,
      customizePricesBySport,
    })
    return currentSnapshot !== initialSnapshot
  }, [formData, selectedDays, pricingTiers, customSportConfigs, customizePricesBySport, initialSnapshot])

  // Manejo de cierre seguro (Alternativa A)
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    onClose()
  }

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

    if (errors.sportIds) setErrors((prev) => ({ ...prev, sportIds: '' }))
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
  }

  const selectQuickDays = (type: 'weekdays' | 'all' | 'weekend') => {
    if (type === 'weekdays') {
      setSelectedDays([1, 2, 3, 4, 5])
    } else if (type === 'all') {
      setSelectedDays([1, 2, 3, 4, 5, 6, 0])
    } else {
      setSelectedDays([6, 0])
    }
  }

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

    if (pricingTiers.length === 0) {
      newErrors.pricingTiers = 'Debe configurar al menos una franja horaria de disponibilidad.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courtId || !validate()) return

    const customSportPricesPayload: CourtSportConfigPayload[] | undefined = customizePricesBySport
      ? formData.sportIds.map((sportId) => ({
          sportId,
          basePrice: customSportConfigs[sportId]?.basePrice ?? formData.basePrice,
          durationMinutes: customSportConfigs[sportId]?.durationMinutes ?? formData.durationMinutes,
        }))
      : undefined

    const payload: UpdateCourtPayload = {
      name: formData.name.trim(),
      surfaceType: formData.surfaceType,
      isCovered: formData.isCovered,
      hasLighting: formData.hasLighting,
      basePrice: formData.basePrice,
      durationMinutes: formData.durationMinutes,
      sportIds: formData.sportIds,
      pricingTiers: pricingTiers,
      customSportPrices: customSportPricesPayload,
    }

    try {
      await updateCourtMutation.mutateAsync({ id: courtId, payload })
      toast.success('Cancha modificada exitosamente', {
        description: `Se actualizaron los datos y reglas de disponibilidad de "${formData.name.trim()}".`,
      })
      onClose()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status
        const problem = error.response.data

        if (status === 409) {
          toast.error('Conflicto al modificar la cancha', {
            description: problem?.detail || 'No se puede modificar la cancha debido a conflictos con horarios o reservas futuras.',
          })
          if (problem?.title?.toLowerCase().includes('nombre')) {
            setErrors((prev) => ({ ...prev, name: 'Nombre ya en uso en este complejo.' }))
          } else {
            setErrors((prev) => ({ ...prev, general: problem?.detail || 'Conflicto operativo.' }))
          }
          return
        }

        if (status === 400 && problem?.errors) {
          toast.error('Datos inválidos en el formulario')
          const serverErrors: Record<string, string> = {}
          Object.keys(problem.errors).forEach((key) => {
            serverErrors[key.toLowerCase()] = problem.errors[key][0]
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

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        // Safe backdrop click (Alternativa A)
        if (e.target === e.currentTarget) {
          handleAttemptClose()
        }
      }}
    >
      <div className="bg-white border border-neutral-300 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header Sticky */}
        <div className="bg-white border-b border-neutral-200 p-5 sm:p-6 flex items-center justify-between sticky top-0 z-20">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand-red font-bold">
              MODIFICACIÓN OPERATIVA
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950 uppercase tracking-tight mt-0.5">
              Modificar Cancha: {court?.name || 'Cargando...'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleAttemptClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors p-2 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>

        {/* Banner Informativo sobre Reservas Futuras e Inmutabilidad */}
        <div className="bg-[#FAF8F5] border-b border-neutral-200 px-5 sm:px-6 py-3 flex items-start gap-3">
          <Info className="h-4 w-4 text-neutral-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
          <p className="text-xs text-neutral-600 leading-relaxed font-mono">
            <strong>Atención:</strong> Las modificaciones en tarifas o duraciones aplican exclusivamente a nuevas reservas. Los turnos futuros agendados conservan su precio original pactado. Si modificás horarios o quitás disciplinas, el sistema bloqueará el cambio si existen turnos confirmados que queden desamparados.
          </p>
        </div>

        {/* Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoadingCourt || isLoadingSports ? (
            <div className="space-y-4 py-8">
              <div className="h-10 bg-neutral-100 animate-pulse border border-neutral-200" />
              <div className="h-28 bg-neutral-100 animate-pulse border border-neutral-200" />
              <div className="h-40 bg-neutral-100 animate-pulse border border-neutral-200" />
            </div>
          ) : (
            <form id="edit-court-form" onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* SECCIÓN 1: FÍSICOS Y DEPORTES */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 tracking-wider">
                  01. Identificación y Superficie
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-court-name" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                      Nombre de Cancha *
                    </label>
                    <input
                      id="edit-court-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                      }}
                      className={`w-full bg-[#FAF8F5] border rounded-none px-4 py-2.5 text-base text-neutral-950 focus:outline-none transition-colors ${
                        errors.name ? 'border-red-600' : 'border-neutral-300 focus:border-neutral-950'
                      }`}
                    />
                    {errors.name && <p className="text-xs text-red-600 font-mono mt-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-surface-type" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                      Tipo de Superficie *
                    </label>
                    <select
                      id="edit-surface-type"
                      value={formData.surfaceType}
                      onChange={(e) => setFormData({ ...formData, surfaceType: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none px-4 py-2.5 text-base text-neutral-950 focus:outline-none focus:border-neutral-950 transition-colors"
                    >
                      {SURFACE_OPTIONS.map((surface) => (
                        <option key={surface} value={surface}>
                          {surface}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Deportes Permitidos */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider block">
                    Disciplinas Deportivas Admitidas * ({formData.sportIds.length} activas)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sports.map((sport) => {
                      const isSelected = formData.sportIds.includes(sport.id)
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
                          {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </button>
                      )
                    })}
                  </div>
                  {errors.sportIds && <p className="text-xs text-red-600 font-mono mt-1">{errors.sportIds}</p>}
                </div>

                {/* Características Físicas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-3 p-3 border border-neutral-200 bg-[#FAF8F5] min-h-[44px]">
                    <input
                      id="edit-is-covered"
                      type="checkbox"
                      checked={formData.isCovered}
                      onChange={(e) => setFormData({ ...formData, isCovered: e.target.checked })}
                      className="h-4 w-4 rounded-none border-neutral-400 text-brand-red focus:ring-0"
                    />
                    <label htmlFor="edit-is-covered" className="text-xs font-bold uppercase tracking-wider text-neutral-800 cursor-pointer select-none">
                      Techada
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 border border-neutral-200 bg-[#FAF8F5] min-h-[44px]">
                    <input
                      id="edit-has-lighting"
                      type="checkbox"
                      checked={formData.hasLighting}
                      onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
                      className="h-4 w-4 rounded-none border-neutral-400 text-brand-red focus:ring-0"
                    />
                    <label htmlFor="edit-has-lighting" className="text-xs font-bold uppercase tracking-wider text-neutral-800 cursor-pointer select-none">
                      Con Iluminación
                    </label>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: TARIFAS Y DURACIÓN BASE */}
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4 w-4" strokeWidth={2} />
                  <span>02. Tarifas Base y Duración de Turnos</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-base-price" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                      Precio Base ($) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs text-neutral-400 font-mono">$</span>
                      <input
                        id="edit-base-price"
                        type="number"
                        min="0"
                        step="500"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: Math.max(0, Number(e.target.value)) })}
                        className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none pl-8 pr-4 py-2.5 text-base text-neutral-950 font-mono focus:outline-none focus:border-neutral-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-duration-minutes" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                      Duración Turno (min) *
                    </label>
                    <input
                      id="edit-duration-minutes"
                      type="number"
                      min="15"
                      max="360"
                      step="5"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: Math.max(1, Number(e.target.value)) })}
                      className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none px-4 py-2.5 text-base text-neutral-950 font-mono focus:outline-none focus:border-neutral-950"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: FRANJAS HORARIAS Y DISPONIBILIDAD */}
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4" strokeWidth={2} />
                    <span>03. Días y Horarios de Disponibilidad</span>
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
                    Días Habilitados ({selectedDays.length} activos)
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
                </div>

                {/* Editor Integral de Franjas */}
                <div className="p-4 sm:p-5 border border-neutral-300 bg-[#FAF8F5] space-y-3">
                  <PricingTiersEditor
                    tiers={pricingTiers}
                    onChange={(updated) => {
                      setPricingTiers(updated)
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
              </div>
            </form>
          )}
        </div>

        {/* Footer Sticky */}
        <div className="bg-white border-t border-neutral-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1">
                Tenés cambios sin guardar
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              form="edit-court-form"
              disabled={updateCourtMutation.isPending}
              className="min-h-[44px] px-7 py-2 rounded-full bg-brand-red text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-red-hover transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="h-4 w-4" strokeWidth={2} />
              <span>{updateCourtMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>

        {/* Modal de confirmación para descartar cambios (Alternativa A) */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-300 p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                <h4 className="text-sm font-black uppercase text-neutral-950">
                  ¿Descartar modificaciones?
                </h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-mono">
                Tenés cambios no guardados en la configuración de la cancha. Si cerrás ahora, se perderán todas las modificaciones realizadas.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="min-h-[40px] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
                >
                  Continuar Editando
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="min-h-[40px] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700"
                >
                  Descartar y Salir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
