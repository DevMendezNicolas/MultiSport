import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { HeroInteractiveAgenda } from './HeroInteractiveAgenda'

interface HeroSectionProps {
  onOpenDemo: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo }) => {
  return (
    <section className="relative w-full bg-[#17181C] py-16 lg:py-24 overflow-hidden border-b border-[#31343E] font-body">
      {/* Resplandor ambiental superior */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[980px] h-[480px] bg-[#D46211]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera Principal de Impacto */}
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Status Indicator Pill */}
          <div className="inline-flex items-center gap-2 pl-2 pr-3.5 py-1 rounded-full bg-[#22242B] border border-[#31343E] text-[#9497A1] text-xs font-mono tracking-wide shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-[#327357] animate-pulse" />
            <span className="font-semibold text-[#F2F3F5] uppercase tracking-wider">MultiSport OS</span>
            <span className="text-[#9497A1] hidden sm:inline">• Pistas y recintos de alta rotación</span>
          </div>

          {/* Título H1 */}
          <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#F2F3F5] tracking-tight leading-[1.08] text-balance">
            El sistema operativo para tu complejo deportivo
          </h1>

          {/* Bajada */}
          <p className="mt-5 text-base sm:text-lg text-[#9497A1] max-w-2xl text-balance leading-relaxed">
            Reservas en tiempo real, gestión de turnos, cobros y fixtures de torneos en una única plataforma diseñada para la velocidad operativa.
          </p>

          {/* Doble Call To Action */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              to="/register"
              className="min-h-[48px] px-7 rounded-lg bg-[#D46211] hover:bg-[#E37A24] text-white font-semibold text-base inline-flex items-center justify-center gap-2 shadow-md shadow-[#D46211]/20 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>Registrar Complejo</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>

            <a
              href="#agenda-preview"
              className="min-h-[48px] px-6 rounded-lg bg-[#22242B] hover:bg-[#2d303a] border border-[#31343E] text-[#F2F3F5] font-semibold text-base inline-flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-[#D46211]" strokeWidth={1.75} />
              <span>Ver Agenda en Vivo</span>
            </a>
          </div>

          {/* Métricas Flotantes con Iconos de Lucide */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[#9497A1] text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#327357]" strokeWidth={2} />
              <span>Sincronización menor a 120ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#327357]" strokeWidth={2} />
              <span>Control de solapamientos 0.0s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#327357]" strokeWidth={2} />
              <span>Multi-dispositivo en tiempo real</span>
            </div>
          </div>
        </div>

        {/* DEMOSTRACIÓN DE AGENDA OPERATIVA EN VIVO (#agenda-preview) */}
        <HeroInteractiveAgenda onOpenDemo={onOpenDemo} />
      </div>
    </section>
  )
}
