import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MultiSportLogo } from '@/features/landing/components/MultiSportLogo'
import { useAuth } from '../hooks/useAuth'
import type { LoginPayload } from '../types'
import axios from 'axios'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [credentials, setCredentials] = useState<LoginPayload>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (data) => {
      toast.success('Inicio de sesión exitoso', {
        description: `Bienvenido, ${data.user.complexName}.`,
      })
      navigate('/admin')
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
          toast.error('Cuenta suspendida', {
            description: problem?.detail || 'La cuenta de tu complejo se encuentra suspendida.',
          })
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate(credentials)
  }

  return (
    <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col justify-between selection:bg-brand-yellow selection:text-neutral-950 relative overflow-hidden">
      {/* Resplandor de fondo deportivo sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-yellow/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Cabecera / Navegación de Regreso */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <MultiSportLogo />
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          <span>Volver al inicio</span>
        </Link>
      </header>

      {/* Contenedor Principal Centrado */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md bg-neutral-900/70 border border-neutral-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          {/* Kicker y Título */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-[2px] bg-brand-yellow inline-block" />
              <span className="text-[11px] font-mono font-bold tracking-widest text-brand-yellow uppercase">
                ACCESO ADMINISTRATIVO
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white">
              Bienvenido de nuevo<span className="text-brand-yellow">.</span>
            </h1>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Ingresá con tu cuenta para gestionar turnos, canchas y torneos.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Campo Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="h-4 w-4" strokeWidth={2} />
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
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-neutral-300"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    toast.info('Recuperación de contraseña', {
                      description: 'Ingresá a la sección de ayuda para solicitar un token de reseteo.',
                    })
                  }}
                  className="text-xs text-brand-yellow hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="h-4 w-4" strokeWidth={2} />
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
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-10 pr-11 py-3 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            {/* Recordar sesión */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-brand-yellow focus:ring-brand-yellow/30"
              />
              <label htmlFor="remember" className="text-xs text-neutral-400 select-none cursor-pointer">
                Recordar mi sesión en este dispositivo
              </label>
            </div>

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-2 w-full min-h-[48px] rounded-full bg-brand-yellow text-neutral-950 font-bold hover:bg-brand-yellow-hover flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-brand-yellow/10"
            >
              {loginMutation.isPending ? (
                <span>Iniciando sesión...</span>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Separador y Link a Registro */}
          <div className="mt-8 pt-6 border-t border-neutral-800/80 text-center text-xs text-neutral-400">
            ¿Tu complejo deportivo aún no usa MultiSport?{' '}
            <Link
              to="/register"
              className="text-brand-yellow font-semibold hover:underline transition-colors block sm:inline mt-1 sm:mt-0"
            >
              Registrá tu predio acá
            </Link>
          </div>

        </div>
      </main>

      {/* Pie de Página Minimalista */}
      <footer className="relative z-10 py-6 px-4 text-center text-xs text-neutral-500 font-mono flex items-center justify-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-neutral-600" strokeWidth={2} />
        <span>MultiSport 2026 &bull; Conexión segura TLS &bull; Todos los derechos reservados</span>
      </footer>
    </div>
  )
}
