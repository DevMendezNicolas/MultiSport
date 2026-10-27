import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import { CourtOperationalCards } from '@/features/courts'
import { cn } from '@/lib/utils'

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
  isUpcoming?: boolean
}

export const DashboardOverview: React.FC = () => {
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
      isUpcoming: true,
    },
    {
      to: '/admin/tournaments',
      title: 'Torneos y Eventos',
      description:
        'Organización de competencias, generación de fixtures, zonas y llaves de eliminación directa.',
      actionText: 'Organizar Torneos',
      image: athleteActionImg,
      imageAlt: 'Acción deportiva en cancha y torneos',
      isUpcoming: true,
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 pb-16 bg-[#17181C] text-[#F2F3F5]">
      {/* Grilla Operativa de Canchas del Predio */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#31343E] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-[#F2F3F5]">
              Canchas del Establecimiento
            </h2>
            <p className="text-xs text-[#9497A1] mt-0.5 font-medium">
              Selecciona una cancha para abrir su planilla diaria de turnos y operar en tiempo real
            </p>
          </div>
          <span className="text-xs font-bold text-[#9497A1] bg-[#22242B] border border-[#31343E] px-3 py-1 rounded-lg self-start sm:self-auto">
            Estado en Vivo
          </span>
        </div>

        <CourtOperationalCards />
      </section>

      {/* Grilla de Módulos de Gestión */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#31343E] pb-3">
          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-[#F2F3F5]">
            Módulos del Establecimiento
          </h2>
          <span className="text-xs font-bold text-[#9497A1] bg-[#22242B] border border-[#31343E] px-3 py-1 rounded-lg">
            {modules.length} Módulos Disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <article
              key={module.to}
              className={cn(
                'group relative bg-[#22242B] border border-[#31343E] rounded-xl shadow-md transition-all flex flex-col overflow-hidden',
                module.isUpcoming ? 'border-[#31343E]/40' : 'hover:border-[#D46211]'
              )}
            >
              {/* Overlay y Cinta diagonal de Próximamente */}
              {module.isUpcoming && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-[#17181C]/50 backdrop-blur-[2px] pointer-events-none select-none">
                  <div className="w-[140%] -rotate-6 bg-gradient-to-r from-[#B84E08] via-[#D46211] to-[#B84E08] text-white py-2 px-4 shadow-2xl border-y-2 border-white/30 flex items-center justify-center gap-2">
                    <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                    <span className="font-headline font-black text-xs tracking-widest uppercase text-white drop-shadow">
                      Próximamente
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9497A1] bg-[#17181C]/90 px-3 py-1 rounded-full border border-[#31343E] mt-3 shadow-md">
                    Módulo en desarrollo
                  </span>
                </div>
              )}

              {/* Contenedor del contenido (Difuminado completo si es isUpcoming) */}
              <div
                className={cn(
                  'flex flex-col flex-1 h-full',
                  module.isUpcoming && 'filter blur-[1.5px] opacity-40 grayscale-[20%] pointer-events-none select-none'
                )}
              >
                {/* Fotografía de Cabecera */}
                <div className="relative h-44 w-full overflow-hidden border-b border-[#31343E] bg-[#17181C]">
                  <img
                    src={module.image}
                    alt={module.imageAlt}
                    className={cn(
                      'w-full h-full object-cover transition-transform duration-700',
                      !module.isUpcoming && 'group-hover:scale-105'
                    )}
                    loading="lazy"
                  />
                </div>

                {/* Cuerpo de la Card */}
                <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3
                      className={cn(
                        'text-base font-headline font-bold text-[#F2F3F5] tracking-tight transition-colors',
                        !module.isUpcoming && 'group-hover:text-[#D46211]'
                      )}
                    >
                      {module.title}
                    </h3>
                    <p className="text-xs text-[#9497A1] leading-relaxed font-medium">
                      {module.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    {module.isUpcoming ? (
                      <div className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-between w-full bg-[#17181C] text-[#9497A1] border border-[#31343E]/60 cursor-not-allowed">
                        <span>Próximamente</span>
                        <Clock className="h-4 w-4 text-[#D46211]" strokeWidth={1.75} />
                      </div>
                    ) : (
                      <Link
                        to={module.to}
                        className={cn(
                          'min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-between w-full transition-all cursor-pointer',
                          module.isPrimary
                            ? 'bg-[#327357] text-white hover:bg-[#285E46] shadow-sm'
                            : 'bg-[#17181C] text-[#F2F3F5] hover:bg-[#292A2E] border border-[#31343E]'
                        )}
                      >
                        <span>{module.actionText}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
