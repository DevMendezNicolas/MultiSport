import React, { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useCreateCourt, useSports } from '../hooks/useCourts'
import type { CreateCourtPayload } from '../types'
import { CourtImagePreview } from './CourtImagePreview'

const SURFACE_OPTIONS = [
  'Césped Sintético',
  'Césped Natural',
  'Cemento / Hormigón',
  'Parquet / Madera',
  'Polvo de Ladrillo',
  'Cristal / Blindex',
] as const

interface CreateCourtFormProps {
  onSuccess?: () => void
}

export const CreateCourtForm: React.FC<CreateCourtFormProps> = ({ onSuccess }) => {
  const { data: sports = [], isLoading: isLoadingSports } = useSports()
  const createCourtMutation = useCreateCourt()

  const [formData, setFormData] = useState<CreateCourtPayload>({
    name: '',
    surfaceType: SURFACE_OPTIONS[0],
    isCovered: false,
    hasLighting: true,
    bufferMinutes: 0,
    basePrice: 20000,
    durationMinutes: 60,
    sportIds: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Deporte primario seleccionado (para la resolucion dinamica de la imagen)
  const firstSport = React.useMemo(() => {
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
    if (errors.sportIds) {
      setErrors((prev) => ({ ...prev, sportIds: '' }))
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createCourtMutation.mutateAsync(formData)
      toast.success('Cancha creada exitosamente', {
        description: `Se registró "${formData.name.trim()}" con ${formData.sportIds.length} deporte(s) asignado(s).`,
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
      setErrors({})
      onSuccess?.()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status
        const problem = error.response.data

        if (status === 409) {
          toast.error('Nombre de cancha duplicado', {
            description: problem?.detail || 'Ya existe una cancha con ese nombre en tu predio.',
          })
          setErrors((prev) => ({ ...prev, name: 'Nombre ya en uso en este complejo.' }))
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
            Ingresá las características físicas, superficie y los deportes habilitados para este espacio.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Nombre de la Cancha */}
          <div className="space-y-1.5">
            <label htmlFor="court-name" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
              Nombre o Identificador de Cancha *
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

          {/* 2. Deportes Admitidos (Multiselección) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                Deportes Permitidos * ({formData.sportIds.length} seleccionados)
              </label>
              <span className="text-[11px] font-mono text-neutral-500">
                El 1° seleccionado define la foto
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

          {/* 3. Tipo de Superficie */}
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

          {/* 4. Precio Base y Duración del Turno (Configurable en minutos) */}
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
                Tarifa única que aplica a los deportes asociados
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="duration-minutes" className="text-xs font-mono uppercase font-bold text-neutral-800 tracking-wider">
                Duración del Turno (minutos) *
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
                Configuración libre en minutos (ej: 60, 75, 90)
              </span>
            </div>
          </div>

          {/* 5. Características Físicas y Buffer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-200">
            {/* Techada */}
            <div className="flex items-center gap-3 p-3 border border-neutral-200 bg-[#FAF8F5]">
              <input
                id="is-covered"
                type="checkbox"
                checked={formData.isCovered}
                onChange={(e) => setFormData({ ...formData, isCovered: e.target.checked })}
                className="h-4 w-4 rounded-none border-neutral-400 text-brand-red focus:ring-0"
              />
              <label htmlFor="is-covered" className="text-xs font-bold uppercase tracking-wider text-neutral-800 cursor-pointer select-none">
                Cancha Techada
              </label>
            </div>

            {/* Iluminación */}
            <div className="flex items-center gap-3 p-3 border border-neutral-200 bg-[#FAF8F5]">
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

            {/* Buffer */}
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

          {/* Botón de Envío Ergonómico */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-500">
              * Datos protegidos bajo el complejo autenticado
            </span>

            <button
              type="submit"
              disabled={createCourtMutation.isPending}
              className="min-h-[48px] px-8 py-3 rounded-full bg-brand-red text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-red-hover transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
            >
              <span>{createCourtMutation.isPending ? 'Guardando Cancha...' : 'Crear Cancha'}</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>

      {/* Columna Derecha: Previsualización Dinámica */}
      <div className="lg:col-span-5">
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
