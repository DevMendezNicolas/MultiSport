import React, { useState } from 'react'
import { X, CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { LeadFormData } from '../types/landing.types'

interface DemoRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    complexName: '',
    phoneOrWhatsApp: '',
    courtsCount: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulación de envío exitoso
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      toast.success('Solicitud enviada correctamente', {
        description: 'Un asesor deportivo se comunicará con vos a la brevedad.',
      })
    }, 700)
  }

  const handleReset = () => {
    setIsSuccess(false)
    setFormData({
      fullName: '',
      complexName: '',
      phoneOrWhatsApp: '',
      courtsCount: '',
      notes: '',
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      {/* Contenedor Modal / Bottom Sheet */}
      <div
        className="w-full sm:max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl p-6 text-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-brand-red font-semibold">
              Demostración Guiada
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mt-1">
              Empezá a ordenar tu complejo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-11 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Contenido */}
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
            </div>
            <h4 className="text-2xl font-bold">¡Solicitud recibida!</h4>
            <p className="text-neutral-400 text-sm max-w-sm">
              Gracias por tu interés en MultiSport. Analizaremos las necesidades
              de tu complejo y te escribiremos para coordinar una demo de 15
              minutos.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 px-6 py-3 rounded-full bg-brand-red text-white font-bold hover:bg-brand-red-hover transition-colors shadow-md shadow-brand-red/20"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4 overflow-y-auto">
            <p className="text-xs text-neutral-400">
              Completá los datos y te mostraremos cómo automatizar turnos, señas
              y torneos en tu predio.
            </p>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Tu nombre y apellido *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Ej. Lucas García"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nombre del complejo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.complexName}
                  onChange={(e) =>
                    setFormData({ ...formData, complexName: e.target.value })
                  }
                  placeholder="Ej. La Cantera Fútbol"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Cantidad de canchas *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={formData.courtsCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      courtsCount: e.target.value ? parseInt(e.target.value) : '',
                    })
                  }
                  placeholder="Ej. 4"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Teléfono / WhatsApp de contacto *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneOrWhatsApp}
                onChange={(e) =>
                  setFormData({ ...formData, phoneOrWhatsApp: e.target.value })
                }
                placeholder="Ej. +54 9 11 3456-7890"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                ¿Qué disciplinas tienen? (Opcional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Ej. Fútbol 5, Pádel, Tenis"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 w-full min-h-[48px] rounded-full bg-brand-red text-white font-bold hover:bg-brand-red-hover flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-brand-red/20"
            >
              {isSubmitting ? (
                <span>Enviando solicitud...</span>
              ) : (
                <>
                  <span>Solicitar demo ahora</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
