import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { MultiSportLogo } from '@/features/landing/components/MultiSportLogo'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../api/authApi'
import type { LoginPayload } from '../types'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [credentials, setCredentials] = useState<LoginPayload>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => {
      navigate('/admin', { replace: true })
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status
        const problem = error.response.data

        if (status === 401) {
          toast.error('Credenciales inválidas', {
            description: 'El correo electrónico o la contraseña no coinciden.',
          })
          return
        }

        if (status === 403) {
          const detail = problem?.detail || ''
          const isUnverified = problem?.title === 'EmailNoVerificado' || detail.toLowerCase().includes('verificar tu correo')
          if (isUnverified) {
            setUnverifiedEmail(credentials.email)
            toast.error('Correo no verificado', {
              description: 'Debés verificar tu correo electrónico antes de ingresar.',
            })
          } else {
            toast.error('Cuenta suspendida', {
              description: detail || 'La cuenta de tu complejo se encuentra suspendida.',
            })
          }
          return
        }

        if (status === 429) {
          toast.error('Cuenta bloqueada temporalmente', {
            description: problem?.detail || 'Demasiados intentos fallidos. Aguardá 15 minutos.',
          })
          return
        }
      }

      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor. Verificá tu conexión a internet.',
      })
    },
  })

  const resendMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification({ email }),
    onSuccess: () => {
      toast.success('Enlace de activación reenviado', {
        description: 'Revisá tu casilla de correo electrónico (expira en 15 minutos).',
      })
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data
        toast.error('Error al reenviar', {
          description: problem?.detail || 'No se pudo despachar el correo de activación.',
        })
        return
      }
      toast.error('Error de conexión', {
        description: 'Verificá tu conexión a internet.',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUnverifiedEmail(null)
    loginMutation.mutate(credentials)
  }

  const handleResend = () => {
    if (!unverifiedEmail) return
    resendMutation.mutate(unverifiedEmail)
  }

  return (
    <div className="min-h-screen bg-[#17181C] text-[#F2F3F5] flex flex-col justify-between selection:bg-[#D46211] selection:text-white relative overflow-hidden font-body">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#D46211]/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Cabecera / Navegación */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <MultiSportLogo />
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#9497A1] hover:text-[#F2F3F5] transition-colors py-2 px-3 rounded-lg hover:bg-[#22242B] border border-transparent hover:border-[#31343E]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          <span>Volver al inicio</span>
        </Link>
      </header>

      {/* Contenedor Principal: Split-Screen moderno */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-7xl mx-auto rounded-2xl overflow-hidden border border-[#31343E] bg-[#111215] shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Columna Izquierda: Identidad Deportiva & Social Proof (50% en Desktop) */}
          <div className="lg:col-span-6 relative flex flex-col justify-between p-8 sm:p-12 overflow-hidden bg-[#17181C]">
            {/* Gradiente y destellos sutiles de fondo */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#D46211]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#327357]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Estado de red y versión */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22242B]/90 border border-[#31343E] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#327357] animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#F2F3F5] font-semibold">
                  MultiSport Club OS
                </span>
                <span className="text-xs text-[#9497A1] hidden sm:inline">• Red de +140 Complejos</span>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#327357]/20 border border-[#327357]/40 text-[#92D4B3] text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                <span>Pistas Activas</span>
              </div>
            </div>

            {/* Mensaje de Impacto de Marca */}
            <div className="relative z-10 my-auto py-8 max-w-lg">
              <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 rounded bg-[#D46211]/15 border border-[#D46211]/30 text-[#D46211] text-xs font-semibold tracking-wider uppercase">
                <span>Control de Infraestructura</span>
              </div>
              
              <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F2F3F5] tracking-tight uppercase leading-none">
                Poder de Cancha.
                <br />
                <span className="text-[#D46211]">Precisión</span> Total.
              </h2>
              
              <p className="mt-4 text-[#9497A1] text-sm sm:text-base leading-relaxed">
                Orquestación de partidos en tiempo real, gestión de iluminación y cobros instantáneos en la red multideportiva líder.
              </p>
            </div>

            {/* Testimonial Operativo / KPI */}
            <div className="relative z-10 mt-auto pt-4">
              <div className="p-4 sm:p-5 rounded-xl bg-[#22242B]/80 border border-[#31343E] backdrop-blur-md shadow-lg flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[#D46211]">
                    <span className="font-mono font-bold tracking-widest text-[#D46211]">★★★★★</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#92D4B3] bg-[#327357]/20 border border-[#327357]/30 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
                    KPI: 99.98% Uptime
                  </span>
                </div>
                
                <p className="text-xs sm:text-sm text-[#F2F3F5] italic leading-relaxed">
                  “Gestionamos 12 canchas y más de 300 reservas diarias con cero errores operativos.”
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-8 h-8 rounded-lg bg-[#17181C] border border-[#31343E] flex items-center justify-center font-bold text-xs text-[#D46211]">
                    EM
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#F2F3F5] truncate">Esteban Morales</span>
                    <span className="text-[11px] text-[#9497A1] truncate">Director Operativo • Club Central Urbano</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Formulario de Autenticación (50% en Desktop) */}
          <div className="lg:col-span-6 bg-[#1d1e24] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 border-t lg:border-t-0 lg:border-l border-[#31343E]">
            <div className="w-full max-w-[420px] flex flex-col">
              
              {/* Encabezado del Formulario */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-[#D46211] flex items-center justify-center text-white font-bold text-xs">
                    M
                  </div>
                  <span className="font-mono text-xs uppercase text-[#D46211] tracking-widest font-bold">
                    MultiSport Console
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F2F3F5]">
                  Bienvenido de nuevo
                </h1>
                <p className="mt-1.5 text-sm text-[#9497A1] leading-relaxed">
                  Ingresá a la consola de administración de tu complejo
                </p>
              </div>

              {/* Banner de Correo No Verificado */}
              {unverifiedEmail && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-300 mb-1">Activación de cuenta pendiente</p>
                      <p className="text-neutral-300 leading-relaxed mb-3">
                        Tu correo <span className="text-white font-medium">{unverifiedEmail}</span> aún no ha sido verificado.
                      </p>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3 w-3 ${resendMutation.isPending ? 'animate-spin' : ''}`} strokeWidth={2} />
                        <span>{resendMutation.isPending ? 'Reenviando...' : 'Reenviar enlace de activación'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Campo Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium uppercase tracking-wider text-[#9497A1] mb-1.5"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9497A1]">
                      <Mail className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={credentials.email}
                      onChange={(e) =>
                        setCredentials({ ...credentials, email: e.target.value })
                      }
                      placeholder="admin@complejo.com"
                      className="w-full bg-[#111215] border border-[#31343E] rounded-lg pl-10 pr-4 py-2.5 text-base sm:text-sm text-[#F2F3F5] placeholder-[#9497A1]/60 focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium uppercase tracking-wider text-[#9497A1]"
                    >
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        toast.info('Recuperación de contraseña', {
                          description: 'Ingresá a la sección de ayuda para solicitar un token de restablecimiento.',
                        })
                      }}
                      className="text-xs text-[#D46211] hover:text-[#E37A24] transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9497A1]">
                      <Lock className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials({ ...credentials, password: e.target.value })
                      }
                      placeholder="••••••••••••"
                      className="w-full bg-[#111215] border border-[#31343E] rounded-lg pl-10 pr-11 py-2.5 text-base sm:text-sm text-[#F2F3F5] placeholder-[#9497A1]/60 focus:outline-none focus:border-[#D46211] focus:ring-1 focus:ring-[#D46211]/30 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9497A1] hover:text-[#F2F3F5] transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Recordar sesión */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#31343E] bg-[#111215] text-[#D46211] accent-[#D46211] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-xs text-[#9497A1] select-none cursor-pointer hover:text-[#F2F3F5] transition-colors">
                    Recordar mi sesión en este dispositivo
                  </label>
                </div>

                {/* Botón de Submit */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="mt-2 w-full min-h-[48px] rounded-lg bg-[#D46211] hover:bg-[#E37A24] text-white font-semibold flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 shadow-md shadow-[#D46211]/20 cursor-pointer"
                >
                  {loginMutation.isPending ? (
                    <span>Iniciando sesión...</span>
                  ) : (
                    <>
                      <span>Ingresar a la Plataforma</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {/* Separador y Link a Registro */}
              <div className="mt-8 pt-6 border-t border-[#31343E] text-center text-xs text-[#9497A1]">
                ¿Aún no gestionas tu complejo con nosotros?{' '}
                <Link
                  to="/register"
                  className="text-[#D46211] font-semibold hover:text-[#E37A24] hover:underline transition-colors block sm:inline mt-1 sm:mt-0"
                >
                  Registrate aquí
                </Link>
              </div>

              {/* Garantía de Seguridad */}
              <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#9497A1]">
                <ShieldCheck className="h-4 w-4 text-[#327357]" strokeWidth={2} />
                <span>Cifrado TLS 1.3 • Acceso Protegido</span>
              </div>

            </div>
          </div>

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
