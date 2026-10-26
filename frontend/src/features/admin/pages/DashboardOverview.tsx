import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Plus } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { CourtOperationalCards } from '@/features/courts'

import courtsTriptychImg from '@/assets/home-page/courts-triptych.jpg'
import sportsEquipmentImg from '@/assets/home-page/sports-equipment.jpg'
import athleteActionImg from '@/assets/home-page/athlete-action.jpg'
import courtPadelImg from '@/assets/home-page/court-padel.jpg'

interface OperationalModule {
  to: string
  title: string
  description: string
  actionText: string
  image: string
  imageAlt: string
  isPrimary?: boolean
}

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth()

  const modules: OperationalModule[] = [
    {
      to: '/admin/courts',
      title: 'Administrar Canchas',
      description:
        'Configuración de superficies deportivas, esquemas tarifarios, iluminación y bloqueos operativos.',
      actionText: 'Gestionar Canchas',
      image: courtsTriptychImg,
      imageAlt: 'Tríptico de canchas deportivas: básquet, fútbol y pádel',
      isPrimary: true,
    },
    {
      to: '/admin/finances',
      title: 'Caja y Cobros',
      description:
        'Cobro en mostrador, registro de pagos con transferencia o efectivo y conciliaciones diarias.',
      actionText: 'Consultar Caja y Pagos',
      image: sportsEquipmentImg,
      imageAlt: 'Equipamiento deportivo y gestión de activos',
    },
    {
      to: '/admin/tournaments',
      title: 'Torneos y Eventos',
      description:
        'Organización de competencias, generación de fixtures, zonas y llaves de eliminación directa.',
      actionText: 'Organizar Torneos',
      image: athleteActionImg,
      imageAlt: 'Acción deportiva en cancha y torneos',
    },
    {
      to: '/admin/settings',
      title: 'Configuración del Predio',
      description:
        'Horarios comerciales de apertura y cierre, datos bancarios para señas y catálogo de deportes.',
      actionText: 'Configurar Predio',
      image: courtPadelImg,
      imageAlt: 'Instalaciones cubiertas y parámetros del predio',
    },
  ]

  const [todayFormatted] = React.useState(() => {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  })

  return (
    <div className="space-y-8 pb-12">
      {/* Encabezado Principal del Predio */}
      <section className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950 uppercase">
              {user?.complexName || 'MultiSport Club'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-700 mt-1.5 capitalize font-semibold">
              {todayFormatted}
            </p>
          </div>

          {/* Accesos Rápidos Principales */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/courts?tab=create"
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-brand-sport text-white text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-brand-sport-hover transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>Nueva Cancha</span>
            </Link>

            <Link
              to="/admin/courts"
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-neutral-950 text-white text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Clock className="h-4 w-4" strokeWidth={2} />
              <span>Ver Estado de Canchas</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Grilla Operativa de Canchas del Predio */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-300 pb-3">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950">
              Canchas del Establecimiento
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5 font-medium">
              Selecciona una cancha para abrir su schedule diario y gestionar turnos en tiempo real
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-800 bg-neutral-200/90 px-3 py-1 rounded-md self-start sm:self-auto">
            Estado en Vivo
          </span>
        </div>

        <CourtOperationalCards />
      </section>

      {/* Grilla de Módulos de Gestión */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
          <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950">
            Módulos del Establecimiento
          </h2>
          <span className="text-xs font-bold text-neutral-800 bg-neutral-200/90 px-3 py-1 rounded-md">
            {modules.length} Módulos Disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <article
              key={module.to}
              className="group bg-white border border-neutral-300 rounded-none shadow-sm hover:border-neutral-950 hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              {/* Fotografía de Cabecera Limpia */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden border-b border-neutral-200 bg-neutral-100">
                <img
                  src={module.image}
                  alt={module.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Cuerpo de la Card */}
              <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-neutral-950 tracking-tight group-hover:text-brand-sport transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                    {module.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    to={module.to}
                    className={`min-h-[44px] px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider inline-flex items-center justify-between w-full transition-all ${
                      module.isPrimary
                        ? 'bg-brand-sport text-white hover:bg-brand-sport-hover shadow-sm'
                        : 'bg-neutral-950 text-white hover:bg-neutral-800'
                    }`}
                  >
                    <span>{module.actionText}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
