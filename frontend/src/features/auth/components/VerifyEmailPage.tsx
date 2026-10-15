import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Mail, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { MultiSportLogo } from '@/features/landing/components/MultiSportLogo'
import { authApi } from '../api/authApi'

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [resendEmail, setResendEmail] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)
  const hasTriggeredRef = useRef(false)

  const verifyMutation = useMutation({
    mutationFn: (tok: string) => authApi.verifyEmail({ token: tok }),
    onSuccess: () => {
      toast.success('Cuenta activada exitosamente', {
        description: 'Ya podés iniciar sesión con tus credenciales de acceso.',
      })
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data
        toast.error('Verificación fallida', {
          description: problem?.detail || 'El token ha expirado o no es válido.',
        })
        return
      }
      toast.error('Error de verificación', {
        description: 'No se pudo verificar el correo. Revisá tu conexión a internet.',
      })
    },
  })

  const resendMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification({ email }),
    onSuccess: () => {
      setResendSuccess(true)
      toast.success('Nuevo enlace enviado', {
        description: 'Revisá tu casilla de correo para continuar con la activación.',
      })
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response) {
        const problem = error.response.data
        toast.error('Error al reenviar', {
          description: problem?.detail || 'No se pudo enviar el enlace de verificación.',
        })
        return
      }
      toast.error('Error de conexión', {
        description: 'Verificá tu conexión a internet e intentalo nuevamente.',
      })
    },
  })

  useEffect(() => {
    if (token && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      verifyMutation.mutate(token)
    }
  }, [token])

  const handleResendSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail.trim()) {
      toast.error('Correo requerido', {
        description: 'Ingresá el correo electrónico con el que te registraste.',
      })
      return
    }
    resendMutation.mutate(resendEmail.trim())
  }

  return (
    <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col justify-between selection:bg-brand-sport selection:text-white relative overflow-hidden">
      {/* Resplandor deportivo de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-sport/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Cabecera */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <MultiSportLogo />
        </Link>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          <span>Volver al inicio</span>
        </Link>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl rounded-2xl p-6 sm:p-10 shadow-2xl">

          {/* CASO 1: Sin Token en URL */}
          {!token && (
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                <ShieldAlert className="h-8 w-8" strokeWidth={2} />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                Enlace no válido
              </h1>

              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                No se detectó un token de activación en este enlace. Por favor, verificá haber copiado la dirección web completa enviada a tu casilla.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full min-h-[48px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-neutral-700"
              >
                <span>Ir al inicio de sesión</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}

          {/* CASO 2: Verificando (Cargando) */}
          {token && verifyMutation.isPending && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="h-16 w-16 rounded-2xl bg-brand-british/50 border border-brand-sport/40 flex items-center justify-center text-brand-soft mb-6 animate-pulse">
                <Clock className="h-8 w-8 text-brand-sport animate-spin" strokeWidth={2} />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                Verificando cuenta...
              </h1>

              <p className="text-sm text-neutral-400 leading-relaxed">
                Estamos validando tu token criptográfico de activación. Aguardá unos instantes.
              </p>
            </div>
          )}

          {/* CASO 3: Verificación Exitosa */}
          {token && verifyMutation.isSuccess && (
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-brand-british/60 border border-brand-sport/50 flex items-center justify-center text-brand-soft mb-6">
                <CheckCircle2 className="h-8 w-8 text-brand-sport" strokeWidth={2} />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                ¡Cuenta activada con éxito!
              </h1>

              <p className="text-sm text-neutral-400 leading-relaxed mb-8">
                Tu correo electrónico ha sido verificado correctamente. Ahora podés iniciar sesión para administrar tus canchas y turnos.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full min-h-[48px] rounded-xl bg-brand-sport hover:bg-brand-sport-hover text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-sport/25"
              >
                <span>Iniciar Sesión</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )}

          {/* CASO 4: Token Expirado o Inválido */}
          {token && verifyMutation.isError && (
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6">
                <ShieldAlert className="h-8 w-8" strokeWidth={2} />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                Enlace expirado o inválido
              </h1>

              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                Los enlaces de activación son válidos por 15 minutos y se invalidan tras su primer uso. Podés solicitar un nuevo enlace ingresando tu correo a continuación:
              </p>

              {resendSuccess ? (
                <div className="w-full bg-brand-british/40 border border-brand-sport/40 rounded-xl p-4 text-xs text-brand-soft mb-6">
                  Se ha despachado un nuevo enlace de activación a tu casilla. Revisá tu bandeja de entrada o spam.
                </div>
              ) : (
                <form onSubmit={handleResendSubmit} className="w-full flex flex-col gap-3 mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="admin@complejo.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-sport focus:ring-1 focus:ring-brand-sport/30 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resendMutation.isPending}
                    className="w-full min-h-[44px] rounded-xl bg-brand-sport hover:bg-brand-sport-hover text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} strokeWidth={2} />
                    <span>{resendMutation.isPending ? 'Enviando...' : 'Reenviar enlace de activación'}</span>
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full min-h-[44px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-neutral-700"
              >
                <span>Volver al inicio de sesión</span>
              </button>
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
