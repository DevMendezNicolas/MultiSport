import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, CheckCircle2, Clock, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '@/features/auth'

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/5 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              SISTEMA OPERATIVO CONECTADO
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {user?.complexName || 'Tu Complejo'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-400 leading-relaxed">
            Bienvenido al panel de control de tu predio deportivo. Desde acá podés consultar la agenda de turnos, gestionar canchas, bloquear horarios por mantenimiento y registrar pagos.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/bookings"
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-brand-yellow text-neutral-950 font-bold hover:bg-brand-yellow-hover inline-flex items-center gap-2 transition-all transform active:scale-[0.98] shadow-md shadow-brand-yellow/10 text-sm"
            >
              <CalendarPlus className="h-4 w-4" strokeWidth={2.5} />
              <span>Ver Agenda de Turnos</span>
            </Link>

            <Link
              to="/admin/courts"
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-neutral-800 text-white font-medium hover:bg-neutral-700 inline-flex items-center gap-2 transition-colors border border-neutral-700 text-sm"
            >
              <Clock className="h-4 w-4" strokeWidth={2} />
              <span>Gestionar Canchas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Operativo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Identificador</span>
            <ShieldCheck className="h-4 w-4 text-brand-yellow" strokeWidth={2} />
          </div>
          <p className="text-lg font-bold text-white truncate">{user?.email}</p>
          <p className="text-xs text-neutral-500 font-mono">Rol activo: {user?.role}</p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Complejo ID</span>
            <Users className="h-4 w-4 text-emerald-400" strokeWidth={2} />
          </div>
          <p className="text-sm font-mono text-neutral-300 truncate" title={user?.complexId}>
            {user?.complexId}
          </p>
          <p className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Predio sincronizado</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Seguridad JWT</span>
            <Clock className="h-4 w-4 text-blue-400" strokeWidth={2} />
          </div>
          <p className="text-lg font-bold text-white">Sesión Protegida</p>
          <p className="text-xs text-neutral-400">Rotación automática y HttpOnly activado</p>
        </div>
      </div>
    </div>
  )
}
