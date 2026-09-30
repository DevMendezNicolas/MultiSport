import React from 'react'
import { Calendar, Trophy, Users } from 'lucide-react'
import type { OperationFeature } from '../types/landing.types'

const operationFeatures: OperationFeature[] = [
  {
    id: 'agenda',
    number: '01',
    title: 'Agenda sin cruces',
    description:
      'Visualizá todas tus canchas en simultáneo y olvidate de las reservas duplicadas.',
    iconName: 'calendar',
  },
  {
    id: 'torneos',
    number: '02',
    title: 'Torneos en automático',
    description:
      'Fixtures, llaves y tablas de posiciones listos en segundos, no en horas.',
    iconName: 'trophy',
  },
  {
    id: 'comunidad',
    number: '03',
    title: 'Comunidad conectada',
    description:
      'Tus jugadores consultan sus partidos y horarios sin llenar tu WhatsApp.',
    iconName: 'users',
  },
]

export const OperationsSection: React.FC = () => {
  return (
    <section id="funciones" className="w-full bg-brand-dark py-20 lg:py-28 border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Lado Izquierdo: Copywriting */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="text-xs font-mono font-bold tracking-widest text-brand-yellow uppercase">
              LA OPERACIÓN, ORDENADA
            </div>
            
            <h2 className="mt-4 font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[1.05] text-white">
              Todo bajo
              <br />
              <span className="text-brand-yellow">control.</span>
            </h2>

            <p className="mt-6 text-neutral-400 text-base sm:text-lg leading-relaxed max-w-md">
              Una herramienta pensada para quienes viven el deporte desde adentro. Simple de usar, potente para crecer.
            </p>
          </div>

          {/* Lado Derecho: Lista de Características 01, 02, 03 */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-neutral-800">
            {operationFeatures.map((feature) => (
              <div
                key={feature.id}
                className="py-8 first:pt-0 last:pb-0 flex items-start justify-between gap-6 group"
              >
                <div className="flex items-start gap-6">
                  {/* Número Monospace */}
                  <span className="text-xs sm:text-sm font-mono font-bold text-brand-yellow pt-1">
                    {feature.number}
                  </span>

                  {/* Textos */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-brand-yellow transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Ícono Lucide */}
                <div className="pt-1 text-brand-yellow flex-shrink-0">
                  {feature.iconName === 'calendar' && (
                    <Calendar className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
                  )}
                  {feature.iconName === 'trophy' && (
                    <Trophy className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
                  )}
                  {feature.iconName === 'users' && (
                    <Users className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
