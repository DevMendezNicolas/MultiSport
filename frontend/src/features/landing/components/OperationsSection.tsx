import React from 'react'
import { BarChart3, Clock, Trophy } from 'lucide-react'

export const OperationsSection: React.FC = () => {
  return (
    <section id="funciones" className="w-full bg-[#17181C] py-16 lg:py-24 border-b border-[#31343E] font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado de la Sección */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono font-bold tracking-wider text-[#D46211] uppercase">
            Infraestructura Central
          </span>
          <h2 className="mt-2 font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F2F3F5] tracking-tight">
            Potencia para la operación diaria de tu predio
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#9497A1] leading-relaxed">
            Diseñado específicamente para administradores que gestionan múltiples disciplinas simultáneamente sin margen de error.
          </p>
        </div>

        {/* Bento Grid de 3 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* CARD 1: AGENDA DE TURNOS INTELIGENTE */}
          <div className="bg-[#22242B] border border-[#31343E] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-lg hover:border-[#D46211]/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#17181C] border border-[#31343E] flex items-center justify-center text-[#D46211] mb-5">
                <Clock className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-headline text-xl sm:text-2xl font-bold text-[#F2F3F5]">
                Agenda de Turnos Inteligente
              </h3>
              <p className="mt-2 text-sm text-[#9497A1] leading-relaxed">
                Control de solapamientos en tiempo real, asignación rápida y sincronización multidispositivo instantánea entre recepción y canchas.
              </p>
            </div>

            {/* Mini Diagrama Visual de Solapamientos */}
            <div className="mt-6 bg-[#17181C] border border-[#31343E] p-4 rounded-lg">
              <div className="flex items-center justify-between text-xs font-mono text-[#9497A1] mb-2.5">
                <span>Resolución de Conflicto</span>
                <span className="text-[#327357] font-semibold">0.0s Bloqueo</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#22242B] border border-[#31343E]/50 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#327357] shrink-0" />
                    <span className="font-medium text-[#F2F3F5] truncate">Pista 3 • Turno Fijo Mensual</span>
                  </div>
                  <span className="text-[10px] text-[#9497A1] font-mono shrink-0">Sincronizado</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#D46211]/10 border border-[#D46211]/30 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#D46211] shrink-0" />
                    <span className="font-medium text-[#D46211] truncate">18:00 - Cepillado y Riego</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#D46211] uppercase shrink-0">Mantenimiento</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#22242B] border border-[#31343E]/50 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#327357] shrink-0" />
                    <span className="font-medium text-[#F2F3F5] truncate">Pista 4 • Solicitud WhatsApp</span>
                  </div>
                  <span className="text-[10px] text-[#327357] font-semibold shrink-0">Auto-Asignado</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: MOTOR DE TORNEOS Y BRACKETS */}
          <div className="bg-[#22242B] border border-[#31343E] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-lg hover:border-[#D46211]/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#17181C] border border-[#31343E] flex items-center justify-center text-[#D46211] mb-5">
                <Trophy className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-headline text-xl sm:text-2xl font-bold text-[#F2F3F5]">
                Motor de Torneos y Brackets
              </h3>
              <p className="mt-2 text-sm text-[#9497A1] leading-relaxed">
                Eliminación directa, fase de grupos y zonas americanas. Actualización automática de cuadros de juego, diferencias de sets y tanteador en vivo.
              </p>
            </div>

            {/* Preview Bracket Pádel Open */}
            <div className="mt-6 bg-[#17181C] border border-[#31343E] p-4 rounded-lg">
              <div className="flex items-center justify-between text-xs font-mono text-[#9497A1] mb-2.5">
                <span className="uppercase">Pádel Open • Cat. 5ta</span>
                <span className="text-[#F2F3F5] font-semibold">Semifinales</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Match 1 */}
                <div className="bg-[#22242B] border border-[#31343E]/60 p-2 rounded flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate text-[#F2F3F5]">Fernández/Paz</span>
                    <span className="font-bold text-[#327357] ml-1 font-mono">6 6</span>
                  </div>
                  <div className="flex items-center justify-between text-[#9497A1] mt-1">
                    <span className="truncate">García/López</span>
                    <span className="ml-1 font-mono">4 2</span>
                  </div>
                </div>

                {/* Final Node */}
                <div className="bg-[#22242B] border border-[#31343E]/60 p-2 rounded flex flex-col justify-center border-l-2 border-l-[#D46211]">
                  <div className="text-[10px] text-[#9497A1] uppercase font-mono">Final Pista Central</div>
                  <div className="font-semibold text-[#F2F3F5] truncate text-xs">Fernández/Paz</div>
                  <div className="text-[10px] text-[#9497A1]">vs Ganador SF-2</div>
                </div>
              </div>
              <div className="mt-2.5 text-right">
                <span className="text-[11px] text-[#D46211] font-semibold">
                  Actualización simultánea en pistas →
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: MÉTRICAS Y FLUJO DE CAJA */}
          <div className="bg-[#22242B] border border-[#31343E] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-lg hover:border-[#D46211]/50 transition-colors md:col-span-2 lg:col-span-1">
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#17181C] border border-[#31343E] flex items-center justify-center text-[#D46211] mb-5">
                <BarChart3 className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="font-headline text-xl sm:text-2xl font-bold text-[#F2F3F5]">
                Métricas y Flujo de Caja
              </h3>
              <p className="mt-2 text-sm text-[#9497A1] leading-relaxed">
                Arqueo de caja diario por cajero, conciliación con Mercado Pago y transferencias bancarias, más reportes de turnos no presentados.
              </p>
            </div>

            {/* Mini Gráfico de Barras */}
            <div className="mt-6 bg-[#17181C] border border-[#31343E] p-4 rounded-lg">
              <div className="flex items-center justify-between text-xs text-[#9497A1] mb-3">
                <span className="font-mono">Recaudación Semanal</span>
                <span className="font-bold text-[#F2F3F5] font-mono text-sm">$2.480.000</span>
              </div>
              {/* Gráfico de Barras */}
              <div className="w-full h-24 flex items-end justify-between gap-2 px-1">
                {[
                  { day: 'L', height: '45%', highlight: false },
                  { day: 'M', height: '52%', highlight: false },
                  { day: 'M', height: '68%', highlight: false },
                  { day: 'J', height: '80%', highlight: false },
                  { day: 'V', height: '96%', highlight: true },
                  { day: 'S', height: '100%', highlight: true },
                  { day: 'D', height: '75%', highlight: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      style={{ height: item.height }}
                      className={`w-full rounded-t transition-all ${
                        item.highlight ? 'bg-[#D46211]' : 'bg-[#31343E] hover:bg-[#327357]'
                      }`}
                    />
                    <span className="text-[10px] text-[#9497A1] mt-1 font-mono">{item.day}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="text-[#9497A1]">Cierre de hoy</span>
                <span className="text-[#327357] font-semibold font-mono">▲ +18.4% vs semana anterior</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
