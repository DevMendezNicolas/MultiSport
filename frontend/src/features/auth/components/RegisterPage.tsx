import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { MultiSportLogo } from '@/features/landing/components/MultiSportLogo'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../api/authApi'
import type { RegisterComplexPayload } from '../types'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState<RegisterComplexPayload>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos en segundos
  const [resendCooldown, setResendCooldown] = useState(0)

  // Temporizador de expiración de 15 minutos para la pantalla de verificación pendiente
  useEffect(() => {
    if (!registeredEmail || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [registeredEmail, timeLeft])

  // Temporizador para el cooldown de reenvío (60 segundos)
  useEffect(() => {
    if (resendCooldown <= 0) return

    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [resendCooldown])

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterComplexPayload) => register(payload),
    onSuccess: (_, variables) => {
      setRegisteredEmail(variables.email)
      setTimeLeft(15 * 60)
      setResendCooldown(60)
      toast.success('Registro completado', {
        description: 'Hemos enviado un enlace de confirmación a tu correo electrónico.',
      })
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data
        if (error.response.status === 409) {
          toast.error('Conflicto de registro', {
            description: problem?.detail || 'El correo electrónico ya se encuentra registrado.',
          })
          return
        }
        if (error.response.status === 400 && problem?.errors) {
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

  const resendMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification({ email }),
    onSuccess: () => {
      setTimeLeft(15 * 60)
      setResendCooldown(60)
      toast.success('Correo reenviado', {
        description: 'Se ha enviado un nuevo enlace de activación a tu casilla.',
      })
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data
        toast.error('No se pudo reenviar el correo', {
          description: problem?.detail || 'Ocurrió un error al procesar la solicitud.',
        })
        return
      }
      toast.error('Error de conexión', {
        description: 'Verificá tu conexión a internet e intentalo nuevamente.',
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
        description: 'La contraseña debe contener al menos 8 caracteres.',
      })
      return
    }

    registerMutation.mutate(formData)
  }

  const handleResend = () => {
    if (!registeredEmail || resendCooldown > 0 || resendMutation.isPending) return
    resendMutation.mutate(registeredEmail)
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const hasLength = formData.password.length >= 8
  const hasUpper = /[A-Z]/.test(formData.password)
  const hasLower = /[a-z]/.test(formData.password)
  const hasNumber = /[0-9]/.test(formData.password)

  return (
    <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col justify-between selection:bg-brand-sport selection:text-white relative overflow-hidden">
      {/* Resplandor deportivo de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-sport/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Cabecera de navegación */}
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
        <div className="w-full max-w-lg bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-2xl">
          
          {registeredEmail ? (
            /* Vista de Verificación Pendiente */
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-brand-british/60 border border-brand-sport/40 flex items-center justify-center text-brand-soft mb-6">
                <Mail className="h-8 w-8 text-brand-sport" strokeWidth={2} />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                Verificá tu correo electrónico
              </h1>
              
              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                Enviamos un enlace de activación a{' '}
                <span className="font-semibold text-neutral-200">{registeredEmail}</span>.
                Para garantizar la seguridad de tu complejo, hacé clic en el enlace dentro de los próximos 15 minutos.
              </p>

              {/* Indicador de Tiempo Restante */}
              <div className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 mb-6 flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono">Validez del enlace:</span>
                <span className={`text-sm font-mono font-bold ${timeLeft > 120 ? 'text-brand-soft' : 'text-amber-400'}`}>
                  {timeLeft > 0 ? formatCountdown(timeLeft) : 'Expirado'}
                </span>
              </div>

              {/* Acciones */}
              <div className="w-full flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendMutation.isPending}
                  className="w-full min-h-[44px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-700"
                >
                  <RefreshCw className={`h-4 w-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} strokeWidth={2} />
                  <span>
                    {resendCooldown > 0
                      ? `Reenviar en ${resendCooldown}s`
                      : resendMutation.isPending
                      ? 'Reenviando...'
                      : 'Reenviar enlace de activación'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full min-h-[48px] rounded-xl bg-brand-sport hover:bg-brand-sport-hover text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-sport/20"
                >
                  <span>Ir a Iniciar Sesión</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="mt-6 text-xs text-neutral-500">
                ¿No encontrás el correo? Revisá la carpeta de spam o correo no deseado.
              </div>
            </div>
          ) : (
            /* Formulario de Registro Simplificado (4 Campos) */
            <div>
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Registrá tu predio en MultiSport
                </h1>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                  Creá tu cuenta inicial en minutos. Luego podrás configurar datos comerciales y de contacto adicionales de manera opcional.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Nombre del Complejo */}
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Nombre del complejo deportivo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej. Padel & Fútbol San Martín"
                    className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
                  />
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Correo electrónico
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
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Contraseña
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
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-11 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
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

                  {/* Indicador de requisitos de seguridad */}
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                    <span className={`flex items-center gap-1 ${hasLength ? 'text-brand-soft font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> 8+ caract.
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpper ? 'text-brand-soft font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Mayúscula
                    </span>
                    <span className={`flex items-center gap-1 ${hasLower ? 'text-brand-soft font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Minúscula
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-brand-soft font-semibold' : 'text-neutral-500'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Número
                    </span>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Confirmar Contraseña
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
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-11 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
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

                {/* Botón de Envío */}
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="mt-3 w-full min-h-[48px] rounded-xl bg-brand-sport hover:bg-brand-sport-hover text-white font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-brand-sport/20"
                >
                  {registerMutation.isPending ? (
                    <span>Registrando predio...</span>
                  ) : (
                    <>
                      <span>Crear cuenta de complejo</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {/* Pie de Formulario */}
              <div className="mt-8 pt-6 border-t border-neutral-800/80 text-center text-xs text-neutral-400">
                ¿Ya tenés una cuenta registrada?{' '}
                <Link to="/login" className="text-brand-soft font-semibold hover:underline transition-colors">
                  Iniciá sesión acá
                </Link>
              </div>
            </div>
          )}

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
