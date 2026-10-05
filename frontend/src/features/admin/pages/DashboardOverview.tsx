import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/features/auth'

import courtsTriptychImg from '@/assets/home-page/courts-triptych.jpg'
import calendarImg from '@/assets/home-page/calendar.jpg'
import sportsEquipmentImg from '@/assets/home-page/sports-equipment.jpg'
import athleteActionImg from '@/assets/home-page/athlete-action.jpg'
import courtPadelImg from '@/assets/home-page/court-padel.jpg'

interface OperationalModule {
  to: string
  title: string
  category: string
  description: string
  highlights: string
  actionText: string
  image: string
  imageAlt: string
  isPrimary?: boolean
}

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth()

  const modules: OperationalModule[] = [
    {
      to: '/admin/bookings',
      title: 'Administrar Turnos',
      category: 'Agenda y Reservas',
      description:
        'Control de la grilla horaria diaria, reserva de turnos por WhatsApp o mostrador, asignación de turnos fijos semanales y gestión de señas.',
      highlights: 'Grilla interactiva · Turnos fijos · Control de seña',
      actionText: 'Abrir Agenda de Turnos',
      image: calendarImg,
      imageAlt: 'Calendario minimalista de turnos y agenda',
      isPrimary: true,
    },
    {
      to: '/admin/courts',
      title: 'Administrar Canchas',
      category: 'Instalaciones y Predio',
      description:
        'Configuración de superficies deportivas, iluminación artificial, tarifas base por deporte y bloqueos operativos por mantenimiento o clima.',
      highlights: 'Básquet · Fútbol · Pádel · Tenis',
      actionText: 'Gestionar Canchas',
      image: courtsTriptychImg,
      imageAlt: 'Tríptico de canchas deportivas: básquet, fútbol y pádel',
      isPrimary: true,
    },
    {
      to: '/admin/finances',
      title: 'Caja y Cobros',
      category: 'Movimientos de Caja',
      description:
        'Registro append-only de pagos, cobro de saldos restantes en mostrador, liquidaciones diarias y conciliación de transferencias bancarias.',
      highlights: 'Libro contable inmutable · CBU / Efectivo',
      actionText: 'Consultar Caja y Pagos',
      image: sportsEquipmentImg,
      imageAlt: 'Equipamiento deportivo y gestión de activos',
    },
    {
      to: '/admin/tournaments',
      title: 'Torneos y Eventos',
      category: 'Competencias Deportivas',
      description:
        'Organización de competencias relámpago y de fin de semana, armado de zonas, generación de fixtures de partidos y llaves de eliminación directa.',
      highlights: 'Eliminación directa · Fases de grupos · Fixtures',
      actionText: 'Organizar Torneos',
      image: athleteActionImg,
      imageAlt: 'Acción deportiva en cancha y torneos',
    },
    {
      to: '/admin/settings',
      title: 'Configuración del Predio',
      category: 'Parámetros del Complejo',
      description:
        'Horarios de apertura y cierre por día de la semana, datos de contacto comercial, CBU/Alias para señas y catálogo maestro de deportes.',
      highlights: 'Horarios comerciales · Datos bancarios · Políticas',
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
      {/* Encabezado Editorial del Predio */}
      <section className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand-red font-bold">
              PANEL GENERAL DE CONTROL
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950 mt-1 uppercase">
              {user?.complexName || 'MultiSport Club'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-2xl leading-relaxed">
              Centro operativo para la gestión diaria de tu complejo. Consultá la agenda de turnos, configurá instalaciones y gestioná la caja del predio.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
            <span className="text-xs font-mono text-neutral-500 capitalize">
              {todayFormatted}
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-semibold rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Predio Sincronizado</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              Operador: {user?.email}
            </span>
          </div>
        </div>

        {/* Accesos Rápidos Principales */}
        <div className="pt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/admin/bookings"
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-brand-red text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-red-hover transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <span>Ir a la Agenda de Turnos</span>
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>

          <Link
            to="/admin/courts"
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <span>Ver Estado de Canchas</span>
          </Link>
        </div>
      </section>

      {/* Grilla Principal de Módulos Operativos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-neutral-950">
              Módulos Operativos del Establecimiento
            </h2>
            <p className="text-xs text-neutral-600">
              Seleccioná un área para consultar disponibilidad o ingresar operaciones.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold">
            {modules.length} Módulos Activos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <article
              key={module.to}
              className="group bg-white border border-neutral-300 rounded-none shadow-sm hover:border-neutral-950 hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              {/* Fotografía de Cabecera */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden border-b border-neutral-200 bg-neutral-100">
                <img
                  src={module.image}
                  alt={module.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-sm text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold">
                  {module.category}
                </div>
              </div>

              {/* Cuerpo de la Card */}
              <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-neutral-950 tracking-tight group-hover:text-brand-red transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    {module.description}
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="pt-3 border-t border-neutral-200 text-[11px] font-mono text-neutral-500">
                    {module.highlights}
                  </div>

                  <Link
                    to={module.to}
                    className={`min-h-[44px] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center justify-between w-full transition-all ${
                      module.isPrimary
                        ? 'bg-brand-red text-white hover:bg-brand-red-hover shadow-sm'
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
