import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, CreditCard, MapPin, Phone, SkipForward, Sparkles } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { authApi } from '../api/authApi'
import { useAuth } from '../hooks/useAuth'
import type { UpdateComplexProfilePayload } from '../types'

export const OnboardingWizardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [formData, setFormData] = useState<UpdateComplexProfilePayload>({
    taxId: '',
    cbuAlias: '',
    address: '',
    city: '',
    phone: '',
    logoUrl: null,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateComplexProfilePayload) => authApi.updateComplexProfile(payload),
    onSuccess: () => {
      toast.success('Perfil del complejo configurado', {
        description: 'La información comercial y de contacto ha sido actualizada.',
      })
      navigate('/admin')
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data
        if (error.response.status === 400 && problem?.errors) {
          const firstKey = Object.keys(problem.errors)[0]
          const firstMsg = problem.errors[firstKey]?.[0]
          toast.error('Datos inválidos', {
            description: firstMsg || 'Por favor revisá los campos ingresados.',
          })
          return
        }
      }
      toast.error('Error al guardar datos', {
        description: 'No se pudieron actualizar los datos. Podés configurarlos más tarde en Ajustes.',
      })
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Enviar solo los campos que no estén vacíos
    const cleanedPayload: UpdateComplexProfilePayload = {
      taxId: formData.taxId?.trim() || null,
      cbuAlias: formData.cbuAlias?.trim() || null,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      phone: formData.phone?.trim() || null,
      logoUrl: null,
    }

    updateProfileMutation.mutate(cleanedPayload)
  }

  const handleSkip = () => {
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col justify-between selection:bg-brand-sport selection:text-white relative">
      {/* Resplandor deportivo de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-sport/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-2xl">
          
          {/* Encabezado */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-british/50 border border-brand-sport/40 text-brand-soft text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-brand-sport" strokeWidth={2} />
              <span>Configuración inicial opcional</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Completá el perfil de {user?.complexName || 'tu complejo'}
            </h1>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Estos datos permitirán a tus clientes ubicar el predio y realizar transferencias de señas. Podés completarlos ahora o hacerlo más adelante desde la sección de Configuración.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Sección de Datos de Ubicación y Contacto */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-950/50">
              <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                <Building2 className="h-4 w-4 text-brand-sport" strokeWidth={2} />
                <span>Ubicación y Contacto</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dirección física */}
                <div>
                  <label htmlFor="address" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Dirección física (opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <MapPin className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address || ''}
                      onChange={handleChange}
                      placeholder="Av. San Martín 1234"
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
                    />
                  </div>
                </div>

                {/* Ciudad */}
                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Ciudad o Localidad (opcional)
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city || ''}
                    onChange={handleChange}
                    placeholder="Rosario, Santa Fe"
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
                  />
                </div>

                {/* Teléfono / WhatsApp */}
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Teléfono / WhatsApp oficial (opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Phone className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      placeholder="+54 9 11 2345-6789"
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección de Datos Financieros / Señas */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-950/50">
              <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                <CreditCard className="h-4 w-4 text-brand-sport" strokeWidth={2} />
                <span>Datos de Cobro y Facturación</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CUIT */}
                <div>
                  <label htmlFor="taxId" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    CUIT o Identificación Fiscal (opcional)
                  </label>
                  <input
                    id="taxId"
                    name="taxId"
                    type="text"
                    value={formData.taxId || ''}
                    onChange={handleChange}
                    placeholder="30-71234567-9"
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
                  />
                </div>

                {/* CBU / Alias */}
                <div>
                  <label htmlFor="cbuAlias" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    CBU, CVU o Alias para señas (opcional)
                  </label>
                  <input
                    id="cbuAlias"
                    name="cbuAlias"
                    type="text"
                    value={formData.cbuAlias || ''}
                    onChange={handleChange}
                    placeholder="mi.complejo.alias"
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Acciones del Onboarding */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="w-full sm:w-auto min-h-[44px] px-5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-neutral-700"
              >
                <SkipForward className="h-4 w-4" strokeWidth={2} />
                <span>Omitir por ahora</span>
              </button>

              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-brand-sport hover:bg-brand-sport-hover text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-sport/20 disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <span>Guardando datos...</span>
                ) : (
                  <>
                    <span>Guardar y comenzar</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  )
}
