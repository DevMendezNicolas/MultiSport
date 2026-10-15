import React, { useState } from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { LeadFormData } from '../types/landing.types'

export const DemoContactSection: React.FC = () => {
  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    complexName: '',
    phoneOrWhatsApp: '',
    courtsCount: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      toast.success('Solicitud enviada correctamente', {
        description: 'Un asesor deportivo se comunicará con vos a la brevedad.',
      })
    }, 600)
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
  }

  return (
    <section id="solicitar-demo" className="w-full bg-brand-dark py-20 lg:py-28 text-white border-t border-neutral-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-900 border border-neutral-800 p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-brand-yellow font-bold block mb-2">
              Demostración Guiada
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              Empezá a ordenar tu complejo
            </h2>
            <p className="mt-3 text-neutral-400 text-sm sm:text-base leading-relaxed">
              Completá tus datos y te mostraremos en vivo cómo automatizar la agenda operativa, señas y torneos en tu predio deportivo.
            </p>
          </div>

          {isSuccess ? (
            <div className="py-12 flex flex-col items-center text-center gap-4 bg-neutral-950/50 border border-neutral-800 p-8">
              <div className="h-16 w-16 rounded-full bg-brand-yellow/10 text-brand-yellow flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-black uppercase text-white">¡Solicitud recibida!</h3>
              <p className="text-neutral-400 text-sm max-w-md leading-relaxed">
                Gracias por tu interés en MultiSport. Analizaremos las características de tu complejo y nos contactaremos para coordinar una demo personalizada de 15 minutos.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 px-8 py-3.5 bg-brand-yellow text-neutral-950 font-bold uppercase text-xs tracking-wider hover:bg-brand-yellow-hover transition-colors cursor-pointer"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="demoFullName" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Tu nombre y apellido *
                  </label>
                  <input
                    id="demoFullName"
                    type="text"
                    required
                    placeholder="Ej: Nicolás Méndez"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 text-base focus:outline-none focus:border-brand-yellow"
                  />
                </div>

                <div>
                  <label htmlFor="demoComplexName" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Nombre del Complejo *
                  </label>
                  <input
                    id="demoComplexName"
                    type="text"
                    required
                    placeholder="Ej: Complejo Los Robles"
                    value={formData.complexName}
                    onChange={(e) => setFormData({ ...formData, complexName: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 text-base focus:outline-none focus:border-brand-yellow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="demoPhone" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    WhatsApp o Teléfono *
                  </label>
                  <input
                    id="demoPhone"
                    type="tel"
                    required
                    placeholder="Ej: +54 9 11 5566-7788"
                    value={formData.phoneOrWhatsApp}
                    onChange={(e) => setFormData({ ...formData, phoneOrWhatsApp: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 text-base focus:outline-none focus:border-brand-yellow"
                  />
                </div>

                <div>
                  <label htmlFor="demoCourtsCount" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Cantidad de Canchas
                  </label>
                  <select
                    id="demoCourtsCount"
                    value={formData.courtsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        courtsCount: e.target.value ? Number(e.target.value) : '',
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-white text-base focus:outline-none focus:border-brand-yellow"
                  >
                    <option value="">Seleccionar cantidad...</option>
                    <option value={2}>1 a 2 canchas</option>
                    <option value={4}>3 a 5 canchas</option>
                    <option value={8}>6 a 10 canchas</option>
                    <option value={12}>Más de 10 canchas</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="demoNotes" className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                  Disciplinas o necesidades particulares (opcional)
                </label>
                <textarea
                  id="demoNotes"
                  rows={3}
                  placeholder="Ej: Tenemos pádel y fútbol 5, queremos automatizar señas..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 text-base focus:outline-none focus:border-brand-yellow"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-neutral-400">
                  Respuesta habitual en menos de 2 horas en horario comercial.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[48px] px-8 py-3.5 bg-brand-yellow text-neutral-950 font-bold uppercase text-xs tracking-wider hover:bg-brand-yellow-hover transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Enviando...' : 'Coordinar Demostración'}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
