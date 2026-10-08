import React, { useState, useMemo } from 'react'
import { ArrowRight, Check, Calendar, Clock, DollarSign, SlidersHorizontal, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useCreateCourt, useSports } from '../hooks/useCourts'
import type { CreateCourtPayload, CourtDaySchedulePayload, CourtSportConfigPayload } from '../types'
import { CourtImagePreview } from './CourtImagePreview'

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

interface DayScheduleFormState {
  firstShiftStart: string
  lastShiftStart: string
  priceOverride?: number
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
    bufferMinutes: number
    basePrice: number
    durationMinutes: number
    sportIds: string[]
  }>({
    name: '',
    surfaceType: SURFACE_OPTIONS[0],
    isCovered: false,
    hasLighting: true,
    bufferMinutes: 0,
    basePrice: 20000,
    durationMinutes: 60,
    sportIds: [],
  })

  // 2. Disponibilidad temporal (días seleccionados)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Lun-Vie por defecto
  const [applySameScheduleToAllDays, setApplySameScheduleToAllDays] = useState(true)
  const [defaultSchedule, setDefaultSchedule] = useState<DayScheduleFormState>({
    firstShiftStart: '08:00',
    lastShiftStart: '22:00',
  })
  const [perDaySchedules, setPerDaySchedules] = useState<Record<number, DayScheduleFormState>>({
    1: { firstShiftStart: '08:00', lastShiftStart: '22:00' },
    2: { firstShiftStart: '08:00', lastShiftStart: '22:00' },
    3: { firstShiftStart: '08:00', lastShiftStart: '22:00' },
    4: { firstShiftStart: '08:00', lastShiftStart: '22:00' },
    5: { firstShiftStart: '08:00', lastShiftStart: '22:00' },
    6: { firstShiftStart: '09:00', lastShiftStart: '21:00' },
    0: { firstShiftStart: '09:00', lastShiftStart: '21:00' },
  })

  // 3. Personalización económica por deporte
  const [customizePricesBySport, setCustomizePricesBySport] = useState(false)
  const [customSportConfigs, setCustomSportConfigs] = useState<Record<string, { basePrice: number; durationMinutes: number }>>({})

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Deporte primario seleccionado (para la vista previa editorial)
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

    // Inicializar configuración personalizada si se activa para ese deporte
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

  // Cálculo visual de finalización de turnos
  const scheduleSummary = useMemo(() => {
    const parseMins = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }

    const formatMins = (mins: number) => {
      const normalized = mins % 1440
      const h = Math.floor(normalized / 60).toString().padStart(2, '0')
      const m = (normalized % 60).toString().padStart(2, '0')
      const isNextDay = mins >= 1440
      return { time: `${h}:${m}`, isNextDay }
    }

    const start = parseMins(defaultSchedule.firstShiftStart)
    let lastStart = parseMins(defaultSchedule.lastShiftStart)
    if (lastStart < start) lastStart += 1440

    const end = lastStart + formData.durationMinutes
    const formattedEnd = formatMins(end)

    const spanMins = end - start
    const shiftCount = Math.max(1, Math.floor(spanMins / formData.durationMinutes))

    return {
      firstShift: defaultSchedule.firstShiftStart,
      lastShift: defaultSchedule.lastShiftStart,
      effectiveEnd: formattedEnd.time,
      isNextDay: formattedEnd.isNextDay,
      shiftCount,
    }
  }, [defaultSchedule, formData.durationMinutes])

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Generar el payload de schedules según la modalidad seleccionada
    const normalizeTime = (t: string) => (t.length === 5 ? `${t}:00` : t)

    const schedulesPayload: CourtDaySchedulePayload[] = selectedDays.map((dayId) => {
      const schedule = applySameScheduleToAllDays ? defaultSchedule : perDaySchedules[dayId] || defaultSchedule
      return {
        dayOfWeek: dayId,
        firstShiftStart: normalizeTime(schedule.firstShiftStart),
        lastShiftStart: normalizeTime(schedule.lastShiftStart),
        priceOverride: schedule.priceOverride,
      }
    })

    // Generar customSportPrices solo si el switch está activado
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
      bufferMinutes: formData.bufferMinutes,
      basePrice: formData.basePrice,
      durationMinutes: formData.durationMinutes,
      sportIds: formData.sportIds,
      schedules: schedulesPayload,
      customSportPrices: customSportPricesPayload,
    }

    try {
      await createCourtMutation.mutateAsync(payload)
      toast.success('Cancha creada exitosamente', {
        description: `Se registró "${formData.name.trim()}" con ${formData.sportIds.length} deporte(s) y disponibilidad semanal asignada.`,
      })
      // Reset form
      setFormData({
        name: '',
        surfaceType: SURFACE_OPTIONS[0],
        isCovered: false,
        hasLighting: true,
        bufferMinutes: 0,
        basePrice: 20000,
        durationMinutes: 60,
        sportIds: [],
      })
      setSelectedDays([1, 2, 3, 4, 5])
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

            {/* Características Físicas y Buffer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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

              <div className="space-y-1">
                <label htmlFor="buffer-minutes" className="text-[11px] font-mono uppercase font-bold text-neutral-700 block">
                  Colchón / Buffer (min)
                </label>
                <input
                  id="buffer-minutes"
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  value={formData.bufferMinutes}
                  onChange={(e) => setFormData({ ...formData, bufferMinutes: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-[#FAF8F5] border border-neutral-200 rounded-none px-3 py-2 text-sm text-neutral-950 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DISPONIBILIDAD TEMPORAL (DÍAS Y HORARIOS) */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4" strokeWidth={2} />
                <span>02. Días y Horarios Operativos</span>
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

            {/* Modalidad de horarios: Unificado vs Por Día */}
            <div className="flex items-center justify-between p-3 border border-neutral-200 bg-[#FAF8F5]">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block">
                  Aplicar mismo horario a todos los días seleccionados
                </span>
                <span className="text-[11px] font-mono text-neutral-500 block">
                  Desactivá si tu complejo abre o cierra en horas distintas según el día
                </span>
              </div>
              <input
                type="checkbox"
                checked={applySameScheduleToAllDays}
                onChange={(e) => setApplySameScheduleToAllDays(e.target.checked)}
                className="h-4 w-4 rounded-none border-neutral-400 text-brand-red focus:ring-0"
              />
            </div>

            {/* Configuración de Horario Unificado */}
            {applySameScheduleToAllDays ? (
              <div className="p-4 border border-neutral-200 bg-white space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="first-shift" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" strokeWidth={2} />
                      <span>Primer Turno (Inicio) *</span>
                    </label>
                    <input
                      id="first-shift"
                      type="time"
                      value={defaultSchedule.firstShiftStart}
                      onChange={(e) => setDefaultSchedule({ ...defaultSchedule, firstShiftStart: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none px-4 py-2.5 text-base text-neutral-950 font-mono focus:outline-none focus:border-neutral-950"
                    />
                    <span className="text-[10px] font-mono text-neutral-500 block">
                      Apertura de la cancha
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="last-shift" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-500" strokeWidth={2} />
                      <span>Último Turno (Inicio) *</span>
                    </label>
                    <input
                      id="last-shift"
                      type="time"
                      value={defaultSchedule.lastShiftStart}
                      onChange={(e) => setDefaultSchedule({ ...defaultSchedule, lastShiftStart: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none px-4 py-2.5 text-base text-neutral-950 font-mono focus:outline-none focus:border-neutral-950"
                    />
                    <span className="text-[10px] font-mono text-neutral-500 block">
                      Hora a la que arranca el último turno
                    </span>
                  </div>
                </div>

                {/* Cálculo Visual Asistido */}
                <div className="bg-[#FAF8F5] border border-neutral-200 p-3 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-900 font-bold">
                    <AlertCircle className="h-3.5 w-3.5 text-brand-red flex-shrink-0" strokeWidth={2} />
                    <span>Cálculo Operativo de Disponibilidad:</span>
                  </div>
                  <p className="font-mono text-[11px] text-neutral-600 leading-relaxed pl-5">
                    Primer turno: <strong className="text-neutral-950">{scheduleSummary.firstShift} hs</strong> · Último turno: <strong className="text-neutral-950">{scheduleSummary.lastShift} hs</strong> (finaliza a las <strong className="text-neutral-950">{scheduleSummary.effectiveEnd} hs</strong>{scheduleSummary.isNextDay ? ' del día siguiente' : ''}). Capacidad: <strong className="text-neutral-950">{scheduleSummary.shiftCount} turnos diarios</strong> de {formData.durationMinutes} min.
                  </p>
                </div>
              </div>
            ) : (
              /* Configuración Personalizada por Día */
              <div className="space-y-2 border border-neutral-200 p-4 bg-white">
                <span className="text-xs font-mono uppercase font-bold text-neutral-800 block mb-2">
                  Horarios específicos para cada día seleccionado:
                </span>
                {selectedDays.map((dayId) => {
                  const dayMeta = DAYS_OF_WEEK.find((d) => d.id === dayId)
                  const currentSchedule = perDaySchedules[dayId] || defaultSchedule

                  return (
                    <div key={dayId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#FAF8F5] border border-neutral-200">
                      <span className="text-xs font-bold uppercase text-neutral-900 w-24">
                        {dayMeta?.name}:
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[10px] font-mono text-neutral-500">1°:</span>
                          <input
                            type="time"
                            value={currentSchedule.firstShiftStart}
                            onChange={(e) => {
                              const val = e.target.value
                              setPerDaySchedules((prev) => ({
                                ...prev,
                                [dayId]: { ...currentSchedule, firstShiftStart: val },
                              }))
                            }}
                            className="w-full bg-white border border-neutral-300 px-2 py-1.5 text-sm font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[10px] font-mono text-neutral-500">Últ:</span>
                          <input
                            type="time"
                            value={currentSchedule.lastShiftStart}
                            onChange={(e) => {
                              const val = e.target.value
                              setPerDaySchedules((prev) => ({
                                ...prev,
                                [dayId]: { ...currentSchedule, lastShiftStart: val },
                              }))
                            }}
                            className="w-full bg-white border border-neutral-300 px-2 py-1.5 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: TARIFAS Y DURACIÓN (SIMPLE POR DEFECTO / CONFIGURABLE) */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4" strokeWidth={2} />
                <span>03. Tarifas y Duración de Turno</span>
              </h3>
            </div>

            {/* Valores Generales / Base */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="base-price" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                  Precio Base del Turno ($) *
                </label>
                <input
                  id="base-price"
                  type="number"
                  min="0"
                  step="500"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-[#FAF8F5] border border-neutral-300 rounded-none px-4 py-3 text-base text-neutral-950 focus:outline-none focus:border-neutral-950 transition-colors font-mono"
                />
                <span className="text-[10px] font-mono text-neutral-500 block">
                  Tarifa de referencia estándar
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
                      <span>Personalizar precio o duración por deporte</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 block">
                      Permite fijar tarifas o tiempos diferenciales (ej: Pádel $15.000 / Tenis $10.000)
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

          {/* Botón de Envío Ergonómico */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-neutral-500">
              * Creación atómica protegida con transacciones en base de datos
            </span>

            <button
              type="submit"
              disabled={createCourtMutation.isPending}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-full bg-brand-red text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-red-hover transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-sm"
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
          bufferMinutes={formData.bufferMinutes}
          durationMinutes={formData.durationMinutes}
          basePrice={formData.basePrice}
        />
      </div>
    </div>
  )
}
