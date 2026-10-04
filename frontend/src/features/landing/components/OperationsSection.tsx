import React from 'react'
import {
  Calendar,
  Trophy,
  ShieldAlert,
  Wallet,
  Layers,
} from 'lucide-react'

export const OperationsSection: React.FC = () => {
  return (
    <section
      id="funciones"
      className="w-full bg-brand-dark py-20 lg:py-28 text-white border-b border-neutral-900/80 relative overflow-hidden"
    >
      {/* Resplandor ambiental de fondo */}
      <div
        className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-brand-red/5 blur-[160px] rounded-full pointer-events-none -z-0"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera Editorial */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-5 h-[2px] bg-brand-red inline-block" />
            <span className="text-xs font-mono font-bold tracking-widest text-brand-red uppercase">
              CAPACIDADES DEL SISTEMA // CORE OPERATIVO
            </span>
          </div>

          <h2 className="font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.02] text-white">
            Todo lo que tu complejo
            <br />
            necesita para <span className="text-brand-red">operar.</span>
          </h2>

          <p className="mt-5 text-neutral-400 text-base sm:text-lg leading-relaxed max-w-2xl">
            Herramientas robustas de nivel comercial desarrolladas específicamente para la administración diaria de canchas, el control de ingresos y la gestión de torneos deportivos.
          </p>
        </div>

        {/* Bento Grid Asimétrico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Card 1: Agenda y Grilla Paralela (Span 8) */}
          <div className="lg:col-span-8 bg-neutral-950/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-xl group">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center">
                    <Calendar className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-300">
                    CONTROL OPERATIVO // TIEMPO REAL
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  GRILLA MULTICANCHA
                </span>
              </div>

              <h3 className="mt-5 text-2xl sm:text-3xl font-bold text-white group-hover:text-brand-red transition-colors">
                Agenda unificada y control en tiempo real
              </h3>
              <p className="mt-2.5 text-neutral-400 text-sm sm:text-base leading-relaxed max-w-xl">
                Visualizá todas tus canchas en simultáneo con bloques horarios definidos. Administrá turnos eventuales y reservas fijas semanales con confirmación inmediata.
              </p>
            </div>

            {/* Simulación de Interfaz: Agenda Multicancha en Vivo */}
            <div className="mt-6 pt-5 border-t border-neutral-900 bg-neutral-900/60 rounded-2xl p-4 sm:p-5 border border-neutral-800/80">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pb-3 border-b border-neutral-800">
                <span className="font-bold text-white">FRANJA 19:00 — 22:00 HS</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3 CANCHAS OCUPADAS
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                {/* Cancha 1 */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400 font-bold">C1 • PÁDEL</span>
                    <span className="text-brand-red font-bold">19:00 - 20:30</span>
                  </div>
                  <div className="text-[11px] text-white font-bold truncate">Martínez / Romero</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">PAGO 100%</div>
                </div>

                {/* Cancha 2 */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400 font-bold">C2 • FÚTBOL 7</span>
                    <span className="text-amber-400 font-bold">20:00 - 21:00</span>
                  </div>
                  <div className="text-[11px] text-white font-bold truncate">Torneo Clausura</div>
                  <div className="text-[10px] text-amber-400 font-semibold">SEMIFINAL #1</div>
                </div>

                {/* Cancha 3 */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400 font-bold">C3 • TENIS</span>
                    <span className="text-blue-400 font-bold">20:30 - 22:00</span>
                  </div>
                  <div className="text-[11px] text-white font-bold truncate">Dr. Gómez (Fijo)</div>
                  <div className="text-[10px] text-neutral-400 font-semibold">SEÑA REGISTRADA</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Control de Disponibilidad (Span 4) */}
          <div className="lg:col-span-4 bg-brand-red text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between pb-4 border-b border-white/20">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-white/90">
                  CONTROL DE DISPONIBILIDAD
                </span>
                <div className="h-8 w-8 rounded-lg bg-black/20 text-white flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>

              <div className="mt-6 text-5xl sm:text-6xl font-black font-mono tracking-tighter">
                0
              </div>
              <h3 className="mt-2 text-2xl font-bold leading-tight">
                Superposiciones. Agenda protegida.
              </h3>
              <p className="mt-3 text-sm text-white/90 leading-relaxed">
                Validación automática y blindada en cada reserva. El sistema impide que dos reservas ocupen la misma cancha y horario, asegurando una grilla 100% confiable y sin fricciones operativas.
              </p>
            </div>

            {/* Micro Badge de Confiabilidad */}
            <div className="mt-6 pt-4 border-t border-white/20 font-mono text-[11px] text-white/90 flex items-center justify-between">
              <span>VALIDACIÓN AUTOMÁTICA</span>
              <span className="font-bold">AGENDA 100% CONFIABLE</span>
            </div>
          </div>

          {/* Card 3: Gestión Financiera & Señas (Span 4) */}
          <div className="lg:col-span-4 bg-neutral-950/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-xl group">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-neutral-900 text-brand-red flex items-center justify-center">
                    <Wallet className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-300">
                    FINANZAS // SEÑAS
                  </span>
                </div>
              </div>

              <h3 className="mt-5 text-xl sm:text-2xl font-bold text-white group-hover:text-brand-red transition-colors">
                Control de señas y cobranzas
              </h3>
              <p className="mt-2.5 text-neutral-400 text-xs sm:text-sm leading-relaxed">
                Registrá señas manuales por efectivo o transferencias. Políticas de retención configurables para turnos cancelados fuera de término y trazabilidad inmutable.
              </p>
            </div>

            {/* Micro-Tarjeta Financiera */}
            <div className="mt-6 pt-4 border-t border-neutral-900 bg-neutral-900/60 rounded-xl p-3.5 border border-neutral-800 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">TOTAL TURNO</span>
                <span className="font-bold text-white">$20.000</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                <span>SEÑA TRANSFERENCIA</span>
                <span>-$10.000</span>
              </div>
              <div className="flex items-center justify-between text-[11px] border-t border-neutral-800 pt-1 text-brand-red font-bold">
                <span>SALDO PENDIENTE</span>
                <span>$10.000</span>
              </div>
            </div>
          </div>

          {/* Card 4: Motor de Torneos y Playoffs (Span 8) */}
          <div className="lg:col-span-8 bg-neutral-950/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 shadow-xl group">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center">
                    <Trophy className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-300">
                    MOTOR DE COMPETENCIA // ALGORITMOS
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-brand-red/10 text-brand-red border border-brand-red/20">
                  LIGAS & PLAYOFFS
                </span>
              </div>

              <h3 className="mt-5 text-2xl sm:text-3xl font-bold text-white group-hover:text-brand-red transition-colors">
                Torneos, fixtures y tablas automáticas
              </h3>
              <p className="mt-2.5 text-neutral-400 text-sm sm:text-base leading-relaxed max-w-xl">
                Formatos de liga todos contra todos o llaves de eliminación directa. Sorteos automáticos, cómputo dinámico de tablas (puntos, goles, diferencia) y progresión de ganadores en tiempo real.
              </p>
            </div>

            {/* Simulación Visual: Árbol de Eliminación de Playoffs */}
            <div className="mt-6 pt-5 border-t border-neutral-900 bg-neutral-900/60 rounded-2xl p-4 sm:p-5 border border-neutral-800/80 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-3 border-b border-neutral-800">
                <span className="font-bold text-white">TORNEO APERTURA // FASE FINAL</span>
                <span className="text-brand-red font-bold">FINAL PROGRAMADA 22:00 HS</span>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Llave 1 */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase">SEMIFINAL A</div>
                  <div className="flex items-center justify-between text-white font-bold">
                    <span>Dep. Caseros</span>
                    <span className="text-brand-red">4</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Villa Luro FC</span>
                    <span>2</span>
                  </div>
                </div>

                {/* Llave 2 */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase">SEMIFINAL B</div>
                  <div className="flex items-center justify-between text-white font-bold">
                    <span>La Candela</span>
                    <span className="text-brand-red">3</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Club Agronomía</span>
                    <span>1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Multidisciplina y Políticas Operativas (Span 12) */}
          <div className="lg:col-span-12 bg-neutral-900/40 border border-neutral-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-neutral-700 transition-all shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-neutral-800 text-brand-red flex items-center justify-center flex-shrink-0">
                <Layers className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-white">
                  Superficies compartidas y políticas de disponibilidad
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed">
                  Definí canchas que admiten más de un deporte (fútbol y hockey, o vóley y básquet). Configurá la duración de cada turno según las necesidades de tu complejo, recargos por luz artificial y bloqueos por mantenimiento preventivo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs font-mono text-neutral-400 px-3 py-1.5 rounded-full bg-neutral-950 border border-neutral-800">
                MULTIDISCIPLINA ACTIVA
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
