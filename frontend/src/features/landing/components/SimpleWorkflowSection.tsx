import React from 'react'
import { Check, ArrowUpRight } from 'lucide-react'
import workflowPitchImg from '@/assets/landing/workflow-pitch.jpg'

interface SimpleWorkflowSectionProps {
  onOpenDemo: () => void
}

const checkpoints = [
  'Reservas fijas y eventuales',
  'Señas y pagos registrados',
  'Fixtures y tablas automáticas',
]

export const SimpleWorkflowSection: React.FC<SimpleWorkflowSectionProps> = ({
  onOpenDemo,
}) => {
  return (
    <section id="como-funciona" className="w-full bg-brand-cream py-20 lg:py-28 text-neutral-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Columna Izquierda: Fotografía de Cancha con Badge */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square lg:aspect-[5/4] shadow-2xl bg-neutral-200">
              <img
                src={workflowPitchImg}
                alt="Cancha de fútbol urbano en complejo deportivo"
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Badge Amarillo: 01 CARGÁ TU COMPLEJO */}
              <div className="absolute bottom-6 left-6 bg-brand-yellow text-neutral-950 p-4 rounded-xl shadow-xl flex flex-col justify-center min-w-[140px]">
                <span className="text-3xl font-black leading-none">01</span>
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase mt-1">
                  CARGÁ TU COMPLEJO
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Copywriting y Checklist */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Kicker */}
            <div className="text-xs font-mono font-bold tracking-widest text-amber-700 uppercase">
              ASÍ DE SIMPLE
            </div>

            {/* Título Principal */}
            <h2 className="mt-4 font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-neutral-950">
              Del turno al
              <br />
              torneo,{' '}
              <span className="text-amber-500">sin</span>
              <br />
              <span className="text-amber-500">vueltas.</span>
            </h2>

            {/* Descripción */}
            <p className="mt-6 text-neutral-700 text-base sm:text-lg leading-relaxed max-w-lg">
              Configurá tus espacios, definí tus reglas y empezá a gestionar. MultiSport se adapta a la forma en que ya trabajás.
            </p>

            {/* Checklist */}
            <div className="mt-8 flex flex-col gap-3.5">
              {checkpoints.map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-amber-400/20 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-neutral-900">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            {/* Enlace Subrayado CTA */}
            <div className="mt-10">
              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-950 border-b-2 border-neutral-950 pb-1 hover:text-amber-600 hover:border-amber-600 transition-colors"
              >
                <span>CONOCÉ LA PLATAFORMA</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
