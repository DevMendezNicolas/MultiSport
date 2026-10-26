import React from 'react'
import { ArrowRight, MessageCircle } from 'lucide-react'
import ctaPadelImg from '@/assets/landing/cta-padel.jpg'

interface FinalCtaSectionProps {
  onOpenDemo: () => void
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onOpenDemo,
}) => {
  return (
    <section className="w-full bg-[#17181C] py-16 lg:py-24 text-[#F2F3F5] border-b border-[#31343E] overflow-hidden font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Lado Izquierdo: Copywriting y CTA Directo */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="text-xs font-mono font-bold tracking-widest text-[#D46211] uppercase">
              EL PRÓXIMO PARTIDO EMPIEZA ACÁ
            </div>

            <h2 className="mt-3 font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-[#F2F3F5]">
              Hacé que
              <br />
              <span className="text-[#D46211]">suceda.</span>
            </h2>

            <p className="mt-5 text-[#9497A1] text-base sm:text-lg leading-relaxed max-w-lg">
              Sumate a los complejos deportivos que profesionalizaron su gestión, eliminaron los turnos dobles y automatizaron sus torneos.
            </p>

            {/* Botones de Acción */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#D46211] text-white font-semibold text-base hover:bg-[#E37A24] transition-all transform active:scale-95 shadow-md shadow-[#D46211]/20 cursor-pointer"
              >
                <span>Solicitar una demo</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>

              <a
                href="https://wa.me/?text=Hola%2C+quisiera+conocer+m%C3%A1s+sobre+MultiSport+para+mi+complejo"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#22242B] border border-[#31343E] text-[#F2F3F5] font-semibold text-sm hover:bg-[#292A2E] hover:border-[#D46211]/50 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-[#327357]" strokeWidth={2} />
                <span>Hablar por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Lado Derecho: Imagen de Cancha de Pádel */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square shadow-2xl border border-[#31343E] bg-[#111215]">
              <img
                src={ctaPadelImg}
                alt="Detalle de pala y pelotas de pádel en cancha profesional"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
