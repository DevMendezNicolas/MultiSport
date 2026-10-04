import React from 'react'
import { ArrowUpRight, Play, ShieldCheck, Activity, Calendar, Trophy } from 'lucide-react'

interface HeroSectionProps {
  onOpenDemo: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo }) => {
  return (
    <section className="relative w-full bg-brand-dark overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28 border-b border-neutral-900/80">
      {/* Resplandor sutil de fondo en rojo deportivo (Ambient Light) */}
      <div
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-red/10 blur-[140px] rounded-full pointer-events-none -z-0"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Columna Izquierda: Copywriting Editorial de Alto Impacto */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            
            {/* Kicker / Tag Operativo con Pulso Rojo */}
            <div className="inline-flex items-center gap-2.5 mb-6 self-start px-3.5 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red" />
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-neutral-300 uppercase">
                SISTEMA OPERATIVO // 2026
              </span>
            </div>

            {/* Título Principal Editorial y Contundente */}
            <h1 className="font-black text-5xl sm:text-6xl md:text-7xl lg:text-[4.75rem] tracking-tighter leading-[0.92] text-white">
              MÁS JUEGO.
              <br />
              <span className="text-brand-red">CERO</span>{' '}
              <span className="relative inline-block text-white">
                CAOS.
                <span className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-[5px] sm:h-[7px] bg-brand-red rounded-full" />
              </span>
            </h1>

            {/* Bajada Argumental Clara */}
            <p className="mt-6 text-neutral-400 text-base sm:text-lg leading-relaxed max-w-lg">
              La plataforma integral que centraliza reservas, organiza la operación diaria y automatiza torneos para que tu complejo deportivo opere con precisión profesional.
            </p>

            {/* Acciones Principales (Touch target >= 44px) */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenDemo}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-brand-red text-white font-bold text-base hover:bg-brand-red-hover transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-red/20 group"
              >
                <span>Solicitar una demo</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
              </button>

              <a
                href="#como-funciona"
                className="min-h-[48px] inline-flex items-center gap-3 px-6 py-3.5 rounded-full border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-800/80 text-neutral-300 hover:text-white transition-all group"
              >
                <div className="h-7 w-7 rounded-full border border-neutral-700 group-hover:border-brand-red flex items-center justify-center transition-colors">
                  <Play className="h-3 w-3 fill-current text-brand-red ml-0.5" />
                </div>
                <span className="text-sm font-semibold">Ver cómo funciona</span>
              </a>
            </div>

            {/* Micro-Badges de Garantía Operativa */}
            <div className="mt-12 pt-8 border-t border-neutral-800/80 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
                <div className="text-[11px] font-mono font-medium text-neutral-400 tracking-wider uppercase mt-1">
                  CENTRALIZADO
                </div>
              </div>

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
            </div>
          </div>

          {/* Columna Derecha: Composición Asimétrica de Bloques (Cream + Red + Obsidian) */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end mt-4 lg:mt-0">
            <div className="relative w-full max-w-lg">
              
              {/* Bloque 1: Tarjeta Arquitectónica Cream (Base de Alto Contraste) */}
              <div className="relative rounded-2xl bg-brand-cream text-neutral-950 p-6 sm:p-7 shadow-2xl border border-neutral-300/80 overflow-hidden">
                
                {/* Cabecera de la Tarjeta Operativa */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-300/80">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-red" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-800">
                      GRILLA DE CANCHAS // EN VIVO
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-neutral-200/80 text-neutral-700">
                    SÁBADO
                  </span>
                </div>

                {/* Lista Simulada de Turnos y Disciplinas en Paralelo */}
                <div className="mt-4 space-y-3">
                  {/* Turno Pádel */}
                  <div className="bg-white rounded-xl p-3.5 border border-neutral-200 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-neutral-950 text-white flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-brand-red" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-neutral-900">
                          CANCHA 1 • PÁDEL CRISTAL
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium">
                          19:00 - 20:30 HS • Turno Eventual
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      CONFIRMADO
                    </span>
                  </div>

                  {/* Turno Torneo Fútbol */}
                  <div className="bg-white rounded-xl p-3.5 border border-neutral-200 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-neutral-950 text-white flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-4 w-4 text-amber-500" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-neutral-900">
                          CANCHA 2 • FÚTBOL 7
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium">
                          20:00 - 21:00 HS • Semifinal Clausura
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-brand-red/10 text-brand-red border border-brand-red/20 uppercase">
                      TORNEO
                    </span>
                  </div>

                  {/* Turno Tenis Fijo */}
                  <div className="bg-white rounded-xl p-3.5 border border-neutral-200 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-neutral-950 text-white flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-neutral-300" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-neutral-900">
                          CANCHA 3 • TENIS POLVO
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium">
                          20:30 - 22:00 HS • Fijo Semanal
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-300 uppercase">
                      FIJO
                    </span>
                  </div>
                </div>

                {/* Pie de la tarjeta */}
                <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <span>DISPONIBILIDAD: 100% OPERATIVA</span>
                  <span className="font-bold text-neutral-900">3/3 EN JUEGO</span>
                </div>
              </div>

              {/* Bloque 2: Badge Asimétrico Rojo Deportivo (Superpuesto Superior Derecho) */}
              <div className="absolute -top-4 -right-2 sm:-right-4 bg-brand-red text-white p-3.5 sm:p-4 rounded-xl shadow-xl flex flex-col items-center justify-center min-w-[110px] z-20 transform hover:scale-105 transition-transform duration-200">
                <span className="text-xl sm:text-2xl font-black leading-none">
                  +35%
                </span>
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase mt-1 text-white/90">
                  MÁS OCUPACIÓN
                </span>
              </div>

              {/* Bloque 3: Tarjeta Flotante Obsidian Dark (Superpuesta Inferior Izquierda) */}
              <div className="absolute -bottom-6 -left-2 sm:-left-6 bg-neutral-950/95 text-white p-4 rounded-xl border border-neutral-800 shadow-2xl backdrop-blur-md z-30 max-w-[240px] sm:max-w-[260px] transform hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-red flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200">
                    PROTECCIÓN TOTAL
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-400 leading-snug">
                  Imposible solapar horarios. Validación estricta a nivel base de datos.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

