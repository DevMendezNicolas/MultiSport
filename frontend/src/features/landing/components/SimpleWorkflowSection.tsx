import React from 'react'
import { Check, ArrowRight } from 'lucide-react'
import workflowPitchImg from '@/assets/landing/workflow-pitch.jpg'

interface SimpleWorkflowSectionProps {
  onOpenDemo: () => void
}

const checkpoints = [
  'Disponibilidad y reservas en tiempo real',
  'Señas y pagos conciliados por cancha',
  'Fixtures y tablas automáticas para torneos',
]

export const SimpleWorkflowSection: React.FC<SimpleWorkflowSectionProps> = ({
  onOpenDemo,
}) => {
  return (
    <section id="como-funciona" className="w-full bg-[#17181C] py-16 lg:py-24 text-[#F2F3F5] border-b border-[#31343E] overflow-hidden font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Columna Izquierda: Fotografía de Cancha Limpia (Sin insignias superpuestas decorativas) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/11] border border-[#31343E] shadow-2xl bg-[#111215]">
              <img
                src={workflowPitchImg}
                alt="Cancha de césped sintético en complejo deportivo"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Columna Derecha: Copywriting y Checklist */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Kicker */}
            <div className="text-xs font-mono font-bold tracking-widest text-[#D46211] uppercase">
              FLUJO OPERATIVO AGIL
            </div>

            {/* Título Principal */}
            <h2 className="mt-3 font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] text-[#F2F3F5]">
              Del turno al torneo,{' '}
              <span className="text-[#D46211]">sin fricción.</span>
            </h2>

            {/* Descripción */}
            <p className="mt-5 text-[#9497A1] text-base sm:text-lg leading-relaxed max-w-lg">
              Configurá tus canchas, definí tus reglas tarifarias y empezá a gestionar. MultiSport se integra a la dinámica real de tu mostrador.
            </p>

            {/* Checklist */}
            <div className="mt-6 flex flex-col gap-3">
              {checkpoints.map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#327357]/20 border border-[#327357]/40 text-[#92D4B3] flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-[#F2F3F5]">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            {/* Enlace CTA */}
            <div className="mt-8">
              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#22242B] hover:bg-[#292A2E] border border-[#31343E] text-[#F2F3F5] hover:text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                <span>Solicitar Demostración</span>
                <ArrowRight className="h-4 w-4 text-[#D46211]" strokeWidth={2} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
