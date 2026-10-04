import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, Check, Eye, EyeOff, Lock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MultiSportLogo } from '@/features/landing/components/MultiSportLogo'
import { useAuth } from '../hooks/useAuth'
import type { RegisterComplexPayload } from '../types'
import axios from 'axios'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState<RegisterComplexPayload>({
    name: '',
    taxId: '',
    cbuAlias: '',
    address: '',
    phone: '',
    city: '',
    logoUrl: null,
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterComplexPayload) => register(payload),
    onSuccess: (data) => {
      toast.success('¡Registro exitoso!', {
        description: `Bienvenido, ${data.user.complexName}. Tu predio ha sido registrado correctamente.`,
      })
      navigate('/admin')
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data
        if (error.response.status === 409) {
          toast.error('Conflicto de registro', {
            description: problem.detail || 'El email o CUIT ya se encuentra registrado.',
          })
          return
        }
        if (error.response.status === 400 && problem.errors) {
          const firstErrorKey = Object.keys(problem.errors)[0]
          const firstErrorMsg = problem.errors[firstErrorKey]?.[0]
          toast.error('Datos inválidos', {
            description: firstErrorMsg || 'Por favor revisá los campos del formulario.',
          })
          return
        }
      }
      toast.error('Error de registro', {
        description: 'No se pudo completar el registro. Intentalo nuevamente.',
      })
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Validación de contraseñas', {
        description: 'Las contraseñas ingresadas no coinciden.',
      })
      return
    }

    if (formData.password.length < 8) {
      toast.error('Contraseña débil', {
        description: 'La contraseña debe tener al menos 8 caracteres.',
      })
      return
    }

    registerMutation.mutate(formData)
  }

  const hasLength = formData.password.length >= 8
  const hasUpper = /[A-Z]/.test(formData.password)
  const hasLower = /[a-z]/.test(formData.password)
  const hasNumber = /[0-9]/.test(formData.password)

  return (
    <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col justify-between selection:bg-brand-red selection:text-white relative overflow-hidden">
      {/* Resplandor deportivo de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-red/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Cabecera / Navegación */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <MultiSportLogo />
        </Link>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          <span>Ya tengo cuenta</span>
        </Link>
      </header>

      {/* Contenedor Principal Centrado */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-2xl">
          
          {/* Kicker y Encabezado */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-[2px] bg-brand-red inline-block" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-brand-red uppercase">
                ALTA DE COMPLEJO DEPORTIVO
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Registrá tu predio en MultiSport<span className="text-brand-red">.</span>
            </h1>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Completá los datos de tu establecimiento y creá la cuenta administradora general para gestionar turnos y canchas.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* SECCIÓN 1: DATOS DEL ESTABLECIMIENTO */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-950/50">
              <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                <Building2 className="h-4 w-4 text-brand-red" strokeWidth={2} />
                <span>1. Datos del Establecimiento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Comercial */}
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Nombre del complejo comercial *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej. Padel & Fútbol San Martín"
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                  />
                </div>

                {/* CUIT */}
                <div>
                  <label htmlFor="taxId" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    CUIT / Identificación fiscal *
                  </label>
                  <input
                    id="taxId"
                    name="taxId"
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={handleChange}
                    placeholder="30-71234567-9"
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                  />
                </div>

                {/* CBU / Alias */}
                <div>
                  <label htmlFor="cbuAlias" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    CBU, CVU o Alias para señas *
                  </label>
                  <input
                    id="cbuAlias"
                    name="cbuAlias"
                    type="text"
                    required
                    value={formData.cbuAlias}
                    onChange={handleChange}
                    placeholder="complejo.padel.alias"
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label htmlFor="address" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Dirección física *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <MapPin className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Av. San Martín 1234"
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                    />
                  </div>
                </div>

                {/* Ciudad */}
                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Ciudad o Localidad *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Rosario, Santa Fe"
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                  />
                </div>

                {/* Teléfono */}
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Teléfono / WhatsApp oficial del predio *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Phone className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+54 9 11 2345-6789"
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CUENTA ADMINISTRADORA */}
            <div className="border border-neutral-800 rounded-xl p-5 bg-neutral-950/50">
              <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                <Mail className="h-4 w-4 text-brand-red" strokeWidth={2} />
                <span>2. Cuenta Administradora de Acceso</span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Correo electrónico de inicio de sesión *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@complejo.com"
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Lock className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-11 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                    </button>
                  </div>

                  {/* Indicador de requisitos */}
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                    <span className={`flex items-center gap-1 ${hasLength ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> 8+ caract.
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Mayúscula
                    </span>
                    <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Minúscula
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Número
                    </span>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Lock className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repetí tu contraseña"
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-11 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="mt-2 w-full min-h-[48px] rounded-full bg-brand-red text-white font-bold hover:bg-brand-red-hover flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-brand-red/20"
            >
              {registerMutation.isPending ? (
                <span>Registrando predio...</span>
              ) : (
                <>
                  <span>Completar registro de predio</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Pie de Formulario */}
          <div className="mt-8 pt-6 border-t border-neutral-800/80 text-center text-xs text-neutral-400">
            ¿Ya tenés una cuenta registrada para tu complejo?{' '}
            <Link to="/login" className="text-brand-red font-semibold hover:underline transition-colors">
              Iniciá sesión acá
            </Link>
          </div>

        </div>
      </main>

      {/* Pie de Página */}
      <footer className="relative z-10 py-6 px-4 text-center text-xs text-neutral-500 font-mono flex items-center justify-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-neutral-600" strokeWidth={2} />
        <span>MultiSport 2026 &bull; Conexión segura TLS &bull; Todos los derechos reservados</span>
      </footer>
    </div>
  )
}
