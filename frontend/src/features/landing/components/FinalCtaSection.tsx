import React from 'react'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import ctaPadelImg from '@/assets/landing/cta-padel.jpg'

interface FinalCtaSectionProps {
  onOpenDemo: () => void
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onOpenDemo,
}) => {
  return (
    <section className="w-full bg-brand-cream py-20 lg:py-28 text-neutral-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Lado Izquierdo: Copywriting y CTA Directo */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="text-xs font-mono font-bold tracking-widest text-brand-red uppercase">
              EL PRÓXIMO PARTIDO EMPIEZA ACÁ
            </div>

            <h2 className="mt-4 font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[0.95] text-neutral-950">
              Hacé que
              <br />
              <span className="text-brand-red">suceda.</span>
            </h2>

            <p className="mt-6 text-neutral-700 text-base sm:text-lg leading-relaxed max-w-lg">
              Sumate a los complejos deportivos que profesionalizaron su gestión, simplificaron sus reservas y automatizaron sus torneos.
            </p>

            {/* Botones de Acción */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-red text-white font-bold text-base hover:bg-brand-red-hover transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-red/25"
              >
                <span>Solicitar una demo</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              </button>

              <a
                href="https://wa.me/?text=Hola%2C+quisiera+conocer+m%C3%A1s+sobre+MultiSport+para+mi+complejo"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-neutral-400 text-neutral-900 font-semibold text-sm hover:border-neutral-900 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                <span>Hablar por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Lado Derecho: Imagen de Cancha de Pádel */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square shadow-2xl bg-neutral-200">
              <img
                src={ctaPadelImg}
                alt="Detalle de paleta de pádel y red en cancha profesional"
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
