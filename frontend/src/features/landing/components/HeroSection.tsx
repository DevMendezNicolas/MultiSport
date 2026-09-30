import React from 'react'
import { ArrowUpRight, Play } from 'lucide-react'
import heroCourtImg from '@/assets/landing/hero-court.jpg'
import heroAthletesImg from '@/assets/landing/hero-athletes.jpg'

interface HeroSectionProps {
  onOpenDemo: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo }) => {
  return (
    <section className="relative w-full bg-brand-dark overflow-hidden pt-6 pb-16 sm:py-20 lg:py-24 border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Columna Izquierda: Copywriting y Métricas */}
          <div className="lg:col-span-6 flex flex-col justify-center z-10">
            {/* Kicker */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-6 h-[2px] bg-brand-yellow inline-block" />
              <span className="text-xs font-mono font-bold tracking-widest text-brand-yellow uppercase">
                GESTIÓN DEPORTIVA, SIN LÍMITES
              </span>
            </div>

            {/* Título Principal de Impacto */}
            <h1 className="font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95] text-white">
              Más juego.
              <br />
              <span className="text-brand-yellow">Menos</span>
              <br />
              <span className="text-brand-yellow">caos.</span>
            </h1>

            {/* Bajada */}
            <p className="mt-6 text-neutral-400 text-base sm:text-lg leading-relaxed max-w-lg">
              La plataforma que ordena la operación de tu complejo deportivo para que vos te enfoques en hacerlo crecer.
            </p>

            {/* Acciones CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-yellow text-neutral-950 font-bold text-base hover:bg-brand-yellow-hover transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-yellow/10"
              >
                <span>Quiero una demo</span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              </button>

              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-neutral-200 hover:text-white transition-colors group"
              >
                <div className="h-8 w-8 rounded-full border border-neutral-700 group-hover:border-brand-yellow flex items-center justify-center transition-colors">
                  <Play className="h-3.5 w-3.5 fill-current text-brand-yellow ml-0.5" />
                </div>
                <span className="text-sm font-semibold">Ver cómo funciona</span>
              </a>
            </div>

            {/* Barra Inferior de Métricas */}
            <div className="mt-14 pt-8 border-t border-neutral-800/80 grid grid-cols-3 gap-4 max-w-md">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
                <div className="text-[11px] font-mono font-medium text-neutral-400 tracking-wider uppercase mt-1">
                  EN LA NUBE
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">24/7</div>
                <div className="text-[11px] font-mono font-medium text-neutral-400 tracking-wider uppercase mt-1">
                  DISPONIBLE
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">0</div>
                <div className="text-[11px] font-mono font-medium text-neutral-400 tracking-wider uppercase mt-1">
                  CRUCES
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Composición Gráfica Urbana */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg lg:max-w-none">
              
              {/* Contenedor Fotográfico Principal */}
              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-[4/3] sm:aspect-[16/11] shadow-2xl">
                <img
                  src={heroCourtImg}
                  alt="Cancha de básquet urbana con graffiti"
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
                
                {/* Overlay degradado sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Badge Flotante Superior Derecho */}
                <div className="absolute top-4 right-4 bg-brand-yellow text-neutral-950 p-3 sm:p-4 rounded-lg shadow-lg flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-xl sm:text-2xl font-black leading-none">
                    +30%
                  </span>
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase mt-1">
                    MÁS CONTROL
                  </span>
                </div>
              </div>

              {/* Tarjeta Superpuesta: Collage Pop-Art de Atletas */}
              <div className="absolute -bottom-8 left-4 sm:-left-6 w-44 sm:w-56 aspect-square rounded-xl overflow-hidden border-4 border-brand-dark bg-white shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform">
                <img
                  src={heroAthletesImg}
                  alt="Atletas multidisciplinares estilo pop art"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Firma y Año inferior derecha */}
              <div className="mt-4 flex justify-end">
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
                  MULTISPORT / 2026
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
