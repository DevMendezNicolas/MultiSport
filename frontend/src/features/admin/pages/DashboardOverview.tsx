import React from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Trophy,
  Settings,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import { useAuth } from '@/features/auth'

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth()

  const quickModules = [
    {
      to: '/admin/bookings',
      title: 'Agenda de Turnos',
      description: 'Grilla horaria de canchas, reservas fijas semanales y turnos eventuales.',
      icon: CalendarPlus,
      actionText: 'Consultar agenda',
    },
    {
      to: '/admin/courts',
      title: 'Canchas e Instalaciones',
      description: 'Superficies deportivas, iluminación, mantenimiento y tarifas por horario.',
      icon: Clock,
      actionText: 'Ver instalaciones',
    },
    {
      to: '/admin/tournaments',
      title: 'Torneos y Eventos',
      description: 'Competencias por ligas, tablas dinámicas y cuadros de playoffs.',
      icon: Trophy,
      actionText: 'Ver competencias',
    },
    {
      to: '/admin/finances',
      title: 'Caja y Pagos',
      description: 'Registro de señas manuales, cobros de turnos y balances diarios.',
      icon: DollarSign,
      actionText: 'Ver movimientos',
    },
    {
      to: '/admin/settings',
      title: 'Configuración del Predio',
      description: 'Datos del establecimiento, alias de cobro y parámetros operativos.',
      icon: Settings,
      actionText: 'Ajustes del sistema',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida y Estado General */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              SISTEMA OPERATIVO // CONECTADO
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {user?.complexName || 'Tu Complejo Deportivo'}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl">
            Panel de control centralizado de tu establecimiento. Desde acá podés consultar la agenda de turnos, administrar canchas, coordinar torneos y revisar la caja.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/bookings"
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-brand-red text-white font-bold hover:bg-brand-red-hover inline-flex items-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-brand-red/20 text-sm"
            >
              <CalendarPlus className="h-4 w-4" strokeWidth={2.5} />
              <span>Ver Agenda de Turnos</span>
            </Link>

            <Link
              to="/admin/courts"
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-neutral-800/80 text-white font-medium hover:bg-neutral-700 inline-flex items-center gap-2 transition-colors border border-neutral-700 text-sm"
            >
              <Clock className="h-4 w-4" strokeWidth={2} />
              <span>Gestionar Canchas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Operativo (Sin identificadores técnicos expuestos) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Administrador */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Administrador Activo</span>
            <ShieldCheck className="h-4 w-4 text-brand-red" strokeWidth={2} />
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-white truncate">{user?.email}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Rol: Administrador General</p>
          </div>
          <div className="pt-2 border-t border-neutral-800/70 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Sesión autenticada</span>
          </div>
        </div>

        {/* Estado Operativo */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Disponibilidad</span>
            <Activity className="h-4 w-4 text-emerald-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-white">Protección Activa</p>
            <p className="text-xs text-neutral-400 mt-0.5">Validación en tiempo real</p>
          </div>
          <div className="pt-2 border-t border-neutral-800/70 text-[11px] font-mono text-neutral-400">
            0 alertas operativas
          </div>
        </div>

        {/* Establecimiento */}
        <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Establecimiento</span>
            <Building2 className="h-4 w-4 text-neutral-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-white truncate">{user?.complexName || 'MultiSport'}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Gestión multideporte unificada</p>
          </div>
          <div className="pt-2 border-t border-neutral-800/70 text-[11px] font-mono text-neutral-400">
            Predio sincronizado
          </div>
        </div>
      </div>

      {/* Módulos de Operación del Complejo (Accesos Directos del Shell) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Módulos del Complejo
            </h2>
            <p className="text-xs text-neutral-400">
              Accesos rápidos a las áreas operativas de tu establecimiento.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase text-neutral-500 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full">
            Accesos Directos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quickModules.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group p-5 rounded-2xl border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-900/60 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-brand-red transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs font-medium text-neutral-400 group-hover:text-white transition-colors">
                  <span>{item.actionText}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-brand-red" strokeWidth={2} />
                </div>
              </Link>
            )
          })}
        </div>

        <p className="text-[11px] font-mono text-neutral-500 pt-2">
          * Accesos directos del shell preparados para la incorporación funcional de cada módulo en etapas posteriores.
        </p>
      </div>
    </div>
  )
}
