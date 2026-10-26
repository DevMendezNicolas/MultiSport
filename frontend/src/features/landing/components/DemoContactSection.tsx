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
        description: 'Un asesor operativo se comunicará con vos a la brevedad.',
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
    <section id="solicitar-demo" className="w-full bg-[#17181C] py-16 lg:py-24 text-[#F2F3F5] border-t border-[#31343E] font-body">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#22242B] border border-[#31343E] p-8 sm:p-12 lg:p-16 rounded-2xl shadow-2xl">
          
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-[#D46211] font-bold block mb-2">
              Demostración Guiada
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F2F3F5] leading-tight">
              Empezá a ordenar tu complejo
            </h2>
            <p className="mt-3 text-[#9497A1] text-sm sm:text-base leading-relaxed">
              Completá tus datos y te mostraremos en vivo cómo automatizar la agenda operativa, señas y torneos en tu predio deportivo.
            </p>
          </div>

          {isSuccess ? (
            <div className="py-12 flex flex-col items-center text-center gap-4 bg-[#111215] border border-[#31343E] rounded-xl p-8">
              <div className="h-16 w-16 rounded-full bg-[#327357]/20 border border-[#327357]/40 text-[#92D4B3] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-[#F2F3F5] font-headline">¡Solicitud recibida!</h3>
              <p className="text-[#9497A1] text-sm max-w-md leading-relaxed">
                Gracias por tu interés en MultiSport. Analizaremos las características de tu predio y nos contactaremos para coordinar una demo de 15 minutos.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 px-6 py-2.5 rounded-lg bg-[#D46211] hover:bg-[#E37A24] text-white font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="demoFullName" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-2">
                    Tu nombre y apellido *
                  </label>
                  <input
                    id="demoFullName"
                    type="text"
                    required
                    placeholder="Ej: Nicolás Méndez"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#111215] border border-[#31343E] rounded-lg text-[#F2F3F5] placeholder-[#9497A1]/60 text-base sm:text-sm focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label htmlFor="demoComplexName" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-2">
                    Nombre del Complejo *
                  </label>
                  <input
                    id="demoComplexName"
                    type="text"
                    required
                    placeholder="Ej: Complejo Los Robles"
                    value={formData.complexName}
                    onChange={(e) => setFormData({ ...formData, complexName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#111215] border border-[#31343E] rounded-lg text-[#F2F3F5] placeholder-[#9497A1]/60 text-base sm:text-sm focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="demoPhone" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-2">
                    WhatsApp o Teléfono *
                  </label>
                  <input
                    id="demoPhone"
                    type="tel"
                    required
                    placeholder="Ej: +54 9 11 5566-7788"
                    value={formData.phoneOrWhatsApp}
                    onChange={(e) => setFormData({ ...formData, phoneOrWhatsApp: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#111215] border border-[#31343E] rounded-lg text-[#F2F3F5] placeholder-[#9497A1]/60 text-base sm:text-sm focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label htmlFor="demoCourtsCount" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-2">
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
                    className="w-full px-4 py-2.5 bg-[#111215] border border-[#31343E] rounded-lg text-[#F2F3F5] text-base sm:text-sm focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
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
                <label htmlFor="demoNotes" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-2">
                  Disciplinas o necesidades particulares (opcional)
                </label>
                <textarea
                  id="demoNotes"
                  rows={3}
                  placeholder="Ej: Gestionamos pádel y fútbol 5, nos interesa la agenda en tiempo real..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#111215] border border-[#31343E] rounded-lg text-[#F2F3F5] placeholder-[#9497A1]/60 text-base sm:text-sm focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs text-[#9497A1]">
                  Respuesta habitual en menos de 2 horas en horario comercial.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[48px] px-8 py-3 bg-[#D46211] hover:bg-[#E37A24] text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-[#D46211]/20 active:scale-[0.99]"
                >
                  <span>{isSubmitting ? 'Enviando...' : 'Coordinar Demostración'}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
