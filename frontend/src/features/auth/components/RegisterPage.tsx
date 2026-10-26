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
    <div className="min-h-screen bg-[#17181C] text-[#F2F3F5] flex flex-col justify-between selection:bg-[#D46211] selection:text-white relative overflow-hidden font-body">
      {/* Resplandor deportivo de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D46211]/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Cabecera de navegación */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <MultiSportLogo />
        </Link>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#9497A1] hover:text-[#F2F3F5] transition-colors py-2 px-3 rounded-lg hover:bg-[#22242B] border border-transparent hover:border-[#31343E]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          <span>Ya tengo cuenta</span>
        </Link>
      </header>

      {/* Contenedor Principal Centrado */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-lg bg-[#22242B] border border-[#31343E] backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-2xl">
          
          {registeredEmail ? (
            /* Vista de Verificación Pendiente */
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#327357]/20 border border-[#327357]/40 flex items-center justify-center text-[#92D4B3] mb-6">
                <Mail className="h-8 w-8 text-[#327357]" strokeWidth={1.75} />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#F2F3F5] mb-2 font-headline">
                Verificá tu correo electrónico
              </h1>
              
              <p className="text-sm text-[#9497A1] leading-relaxed mb-6">
                Enviamos un enlace de activación a{' '}
                <span className="font-semibold text-[#F2F3F5]">{registeredEmail}</span>.
                Para garantizar la seguridad de tu complejo, hacé clic en el enlace dentro de los próximos 15 minutos.
              </p>

              {/* Indicador de Tiempo Restante */}
              <div className="w-full bg-[#111215] border border-[#31343E] rounded-xl p-4 mb-6 flex items-center justify-between">
                <span className="text-xs text-[#9497A1] font-mono">Validez del enlace:</span>
                <span className={`text-sm font-mono font-bold ${timeLeft > 120 ? 'text-[#92D4B3]' : 'text-[#D46211]'}`}>
                  {timeLeft > 0 ? formatCountdown(timeLeft) : 'Expirado'}
                </span>
              </div>

              {/* Acciones */}
              <div className="w-full flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendMutation.isPending}
                  className="w-full min-h-[44px] rounded-lg bg-[#111215] hover:bg-[#1d1e24] text-[#F2F3F5] text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#31343E]"
                >
                  <RefreshCw className={`h-4 w-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} strokeWidth={1.75} />
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
                  className="w-full min-h-[48px] rounded-lg bg-[#D46211] hover:bg-[#E37A24] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#D46211]/20 cursor-pointer"
                >
                  <span>Ir a Iniciar Sesión</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="mt-6 text-xs text-[#9497A1]">
                ¿No encontrás el correo? Revisá la carpeta de spam o correo no deseado.
              </div>
            </div>
          ) : (
            /* Formulario de Registro */
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-[#D46211] flex items-center justify-center text-white font-bold text-xs">
                    M
                  </div>
                  <span className="font-mono text-xs uppercase text-[#D46211] tracking-widest font-bold">
                    Registro de Complejo
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F2F3F5] font-headline">
                  Registrá tu predio en MultiSport
                </h1>
                <p className="mt-2 text-sm text-[#9497A1] leading-relaxed">
                  Creá tu cuenta inicial en minutos. Luego podrás configurar datos comerciales y canchas de manera personalizada.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Nombre del Complejo */}
                <div>
                  <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-1.5">
                    Nombre del complejo deportivo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej. Pádel & Fútbol San Martín"
                    className="w-full bg-[#111215] border border-[#31343E] rounded-lg px-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] placeholder-[#9497A1]/60 focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                  />
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9497A1]">
                      <Mail className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@complejo.com"
                      className="w-full bg-[#111215] border border-[#31343E] rounded-lg pl-10 pr-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] placeholder-[#9497A1]/60 focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9497A1]">
                      <Lock className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-[#111215] border border-[#31343E] rounded-lg pl-10 pr-11 py-2.5 text-base sm:text-sm text-[#F2F3F5] placeholder-[#9497A1]/60 focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9497A1] hover:text-[#F2F3F5] transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                    </button>
                  </div>

                  {/* Indicador de requisitos de seguridad */}
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                    <span className={`flex items-center gap-1 ${hasLength ? 'text-[#92D4B3] font-semibold' : 'text-[#9497A1]'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> 8+ caract.
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpper ? 'text-[#92D4B3] font-semibold' : 'text-[#9497A1]'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Mayúscula
                    </span>
                    <span className={`flex items-center gap-1 ${hasLower ? 'text-[#92D4B3] font-semibold' : 'text-[#9497A1]'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Minúscula
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-[#92D4B3] font-semibold' : 'text-[#9497A1]'}`}>
                      <Check className="h-3 w-3" strokeWidth={2} /> Número
                    </span>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-1.5">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9497A1]">
                      <Lock className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repetí tu contraseña"
                      className="w-full bg-[#111215] border border-[#31343E] rounded-lg pl-10 pr-11 py-2.5 text-base sm:text-sm text-[#F2F3F5] placeholder-[#9497A1]/60 focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9497A1] hover:text-[#F2F3F5] transition-colors"
                      aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>

                {/* Botón de Envío */}
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="mt-3 w-full min-h-[48px] rounded-lg bg-[#D46211] hover:bg-[#E37A24] text-white font-semibold flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 shadow-md shadow-[#D46211]/20 cursor-pointer"
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
              <div className="mt-8 pt-6 border-t border-[#31343E] text-center text-xs text-[#9497A1]">
                ¿Ya tenés una cuenta registrada?{' '}
                <Link to="/login" className="text-[#D46211] font-semibold hover:text-[#E37A24] hover:underline transition-colors">
                  Iniciá sesión acá
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Pie de Página */}
      <footer className="relative z-10 py-6 px-4 text-center text-xs text-[#9497A1] font-mono flex items-center justify-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-[#327357]" strokeWidth={2} />
        <span>MultiSport 2026 &bull; Conexión segura TLS &bull; Todos los derechos reservados</span>
      </footer>
    </div>
  )
}
