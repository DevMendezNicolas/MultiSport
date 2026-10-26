import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, CheckCircle2, DollarSign, ShieldCheck, TrendingUp, Zap } from 'lucide-react'

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

        {/* PREVIEW DE AGENDA OPERATIVA EN VIVO (#agenda-preview) */}
        <div className="mt-14 relative w-full" id="agenda-preview">
          
          {/* Barra Superior de Estado y KPIs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#22242B] border border-[#31343E] px-3.5 py-2 rounded-lg shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#327357] animate-ping" />
                <span className="text-sm font-semibold text-[#F2F3F5]">Viernes, 24 de Octubre</span>
                <span className="text-xs text-[#9497A1]">| En directo</span>
              </div>

              {/* Leyenda de estados */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-[#9497A1] font-mono">
                <span className="w-2.5 h-2.5 rounded bg-[#327357] inline-block" /> Confirmado
                <span className="w-2.5 h-2.5 rounded bg-[#D46211] inline-block ml-2" /> Seña Pendiente
                <span className="w-2.5 h-2.5 rounded bg-[#111215] border border-[#31343E] inline-block ml-2" /> Libre
              </div>
            </div>

            {/* Tarjetas KPI compactas */}
            <div className="flex items-center gap-3">
              <div className="bg-[#22242B] border border-[#31343E] px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#17181C] border border-[#31343E] flex items-center justify-center text-[#327357]">
                  <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-[#9497A1] uppercase">Ocupación Hoy</p>
                  <p className="text-sm font-bold text-[#F2F3F5]">
                    94% <span className="text-[#327357] text-xs font-normal">▲ 12%</span>
                  </p>
                </div>
              </div>

              <div className="bg-[#22242B] border border-[#31343E] px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#17181C] border border-[#31343E] flex items-center justify-center text-[#D46211]">
                  <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-[#9497A1] uppercase">Señas Recibidas</p>
                  <p className="text-sm font-bold text-[#F2F3F5] font-mono">$342.000</p>
                </div>
              </div>
            </div>

          </div>

          {/* Schedule Matrix Container */}
          <div className="bg-[#22242B] border border-[#31343E] rounded-xl shadow-2xl overflow-hidden p-4 sm:p-5">
            
            {/* Window Top Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 bg-[#17181C] border border-[#31343E] rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#D46211]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#327357]" />
                <span className="ml-2 text-xs sm:text-sm font-medium text-[#F2F3F5]">
                  Control Maestro • Sede Principal Las Lomas
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#9497A1]">
                <span className="px-2 py-0.5 rounded bg-[#22242B] border border-[#31343E] text-[#F2F3F5]">
                  Auto-Sync On
                </span>
                <span className="hidden sm:inline">UTC-3</span>
              </div>
            </div>

            {/* RIESGO 2: Scroll Horizontal Contenido (no desborda el viewport móvil) */}
            <div className="overflow-x-auto no-scrollbar pb-1">
              <div className="min-w-[980px] flex flex-col space-y-2">
                
                {/* Timeline Header Row */}
                <div className="grid grid-cols-[180px_repeat(10,1fr)] gap-2 pb-1 text-center text-xs font-mono text-[#9497A1] uppercase">
                  <div className="text-left pl-2">Pista / Horario</div>
                  <div>08:00</div>
                  <div>09:30</div>
                  <div>11:00</div>
                  <div>14:00</div>
                  <div>15:30</div>
                  <div>17:00</div>
                  <div>18:30</div>
                  <div>20:00</div>
                  <div>21:30</div>
                  <div>23:00</div>
                </div>

                {/* Fila 1: Pádel 1 Cristal */}
                <div className="grid grid-cols-[180px_repeat(10,1fr)] gap-2 items-center">
                  <div className="bg-[#17181C] border border-[#31343E] px-3 py-2.5 rounded-lg flex flex-col justify-center">
                    <span className="text-xs font-semibold text-[#F2F3F5]">Pádel 1 Cristal</span>
                    <span className="text-[10px] text-[#9497A1] truncate">Césped Texturado • Cubierta</span>
                  </div>
                  {/* Slots */}
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">G. Valdez</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">L. Gómez</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                  <div className="bg-[#D46211] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#D46211]/60">
                    <span className="text-xs font-semibold truncate leading-tight">M. Soria</span>
                    <span className="text-[10px] text-white/90">Seña Pendiente</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Academia Jr</span>
                    <span className="text-[10px] text-white/80 font-mono">$22.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Clase Torneo</span>
                    <span className="text-[10px] text-white/80 font-mono">$24.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">P. Rossi</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">J. Morales</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">R. Alvarez</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                </div>

                {/* Fila 2: Pádel 2 Panorámica */}
                <div className="grid grid-cols-[180px_repeat(10,1fr)] gap-2 items-center">
                  <div className="bg-[#17181C] border border-[#31343E] px-3 py-2.5 rounded-lg flex flex-col justify-center">
                    <span className="text-xs font-semibold text-[#F2F3F5]">Pádel 2 Panorámica</span>
                    <span className="text-[10px] text-[#9497A1] truncate">World Padel Grade • Vidrio 12mm</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">C. Bianchi</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">D. Ruiz</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                  <div className="bg-[#D46211] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#D46211]/60">
                    <span className="text-xs font-semibold truncate leading-tight">T. Ramos</span>
                    <span className="text-[10px] text-white/90">Seña Pendiente</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">S. Miller</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">M. Benítez</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">H. Castro</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">E. Silva</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">L. Ferrero</span>
                    <span className="text-[10px] text-white/80 font-mono">$18.000</span>
                  </div>
                </div>

                {/* Fila 3: Tenis 2 Polvo de Ladrillo */}
                <div className="grid grid-cols-[180px_repeat(10,1fr)] gap-2 items-center">
                  <div className="bg-[#17181C] border border-[#31343E] px-3 py-2.5 rounded-lg flex flex-col justify-center">
                    <span className="text-xs font-semibold text-[#F2F3F5]">Tenis 2 Polvo</span>
                    <span className="text-[10px] text-[#9497A1] truncate">Iluminación LED 800 lux</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">C. Nalbandian</span>
                    <span className="text-[10px] text-white/80 font-mono">$15.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">A. Agassi Jr</span>
                    <span className="text-[10px] text-white/80 font-mono">$15.000</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Escuela Tenis</span>
                    <span className="text-[10px] text-white/80 font-mono">$20.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Escuela Tenis</span>
                    <span className="text-[10px] text-white/80 font-mono">$20.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">F. Gaudio</span>
                    <span className="text-[10px] text-white/80 font-mono">$15.000</span>
                  </div>
                  <div className="bg-[#D46211] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#D46211]/60">
                    <span className="text-xs font-semibold truncate leading-tight">K. Novak</span>
                    <span className="text-[10px] text-white/90">Seña Pendiente</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">O. Prieto</span>
                    <span className="text-[10px] text-white/80 font-mono">$15.000</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                </div>

                {/* Fila 4: Fútbol 5 Sintético */}
                <div className="grid grid-cols-[180px_repeat(10,1fr)] gap-2 items-center">
                  <div className="bg-[#17181C] border border-[#31343E] px-3 py-2.5 rounded-lg flex flex-col justify-center">
                    <span className="text-xs font-semibold text-[#F2F3F5]">Fútbol 5 Sintético</span>
                    <span className="text-[10px] text-[#9497A1] truncate">Monofilamento 55mm • Rejas</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                  <div onClick={onOpenDemo} className="bg-[#17181C] hover:bg-[#252831] border border-[#31343E] cursor-pointer text-[#9497A1] p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] transition-colors">
                    <span className="text-xs text-[#F2F3F5]">Libre</span>
                    <span className="text-[10px] text-[#D46211] font-semibold">Reservar</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Torneo Senior</span>
                    <span className="text-[10px] text-white/80 font-mono">$28.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Torneo Senior</span>
                    <span className="text-[10px] text-white/80 font-mono">$28.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Torneo Senior</span>
                    <span className="text-[10px] text-white/80 font-mono">$28.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Los Amigos FC</span>
                    <span className="text-[10px] text-white/80 font-mono">$30.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Interbarrial</span>
                    <span className="text-[10px] text-white/80 font-mono">$30.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Sporting Club</span>
                    <span className="text-[10px] text-white/80 font-mono">$30.000</span>
                  </div>
                  <div className="bg-[#327357] text-white p-1.5 rounded-lg text-center flex flex-col justify-center min-h-[52px] shadow-sm border border-[#327357]/60">
                    <span className="text-xs font-semibold truncate leading-tight">Tercer Tiempo</span>
                    <span className="text-[10px] text-white/80 font-mono">$30.000</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
