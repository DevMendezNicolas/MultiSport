import React from 'react'
import {
  Building2,
  CalendarCheck,
  ShieldCheck,
  Trophy,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react'

interface SimpleWorkflowSectionProps {
  onOpenDemo: () => void
}

interface StepItem {
  number: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  uiPreview: React.ReactNode;
}

const steps: StepItem[] = [
  {
    number: '01',
    badge: 'CONFIGURACIÓN',
    title: 'Cargá tus canchas e instalaciones',
    description:
      'Configurá tus canchas por disciplina (fútbol, pádel, tenis, básquet), asigná superficies compartidas y definí franjas horarias y esquemas tarifarios base.',
    icon: Building2,
    uiPreview: (
      <div className="bg-white rounded-xl p-3 border border-neutral-200/90 shadow-sm text-xs font-mono space-y-2">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 text-[11px]">
          <span className="font-bold text-neutral-900">CANCHA 1 • CRISTAL</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            ACTIVA
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-600">
          <span>TARIFA NOCTURNA</span>
          <span className="font-bold text-neutral-900">$22.000/H</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
          <span>ILUMINACIÓN LED INCLUIDA</span>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    badge: 'CENTRALIZACIÓN',
    title: 'Organizá turnos fijos y eventuales',
    description:
      'Registrá reservas semanales recurrentes o turnos únicos al instante. Gestioná cobros manuales, señas previas y saldos sin anotaciones dispersas.',
    icon: CalendarCheck,
    uiPreview: (
      <div className="bg-white rounded-xl p-3 border border-neutral-200/90 shadow-sm text-xs font-mono space-y-2">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 text-[11px]">
          <span className="font-bold text-neutral-900">TURNO 20:00 - 21:30</span>
          <span className="px-1.5 py-0.5 rounded bg-brand-red/10 text-brand-red text-[10px] font-bold">
            FIJO SEMANAL
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-500">CLIENTE</span>
          <span className="font-bold text-neutral-800">Gonzalo V.</span>
        </div>
        <div className="flex items-center justify-between text-[10px] bg-neutral-50 p-1.5 rounded border border-neutral-200/60">
          <span className="text-neutral-500">SEÑA ABONADA</span>
          <span className="font-bold text-emerald-700">$10.000 (50%)</span>
        </div>
      </div>
    ),
  },
  {
    number: '03',
    badge: 'DISPONIBILIDAD',
    title: 'Disponibilidad activa sin superposiciones',
    description:
      'Validación automática e instantánea de cada reserva. Centralizá la disponibilidad de tus canchas con confirmaciones seguras en tiempo real.',
    icon: ShieldCheck,
    uiPreview: (
      <div className="bg-neutral-950 text-white rounded-xl p-3 border border-neutral-800 shadow-sm text-xs font-mono space-y-2">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-neutral-200">DISPONIBILIDAD ACTIVA</span>
          </div>
          <span className="text-[10px] text-neutral-400">TIEMPO REAL</span>
        </div>
        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          <span>AGENDA SIN CONFLICTOS</span>
        </div>
        <div className="text-[10px] text-neutral-500">
          VALIDACIÓN INMEDIATA &lt; 5MS
        </div>
      </div>
    ),
  },
  {
    number: '04',
    badge: 'AUTOMATIZACIÓN',
    title: 'Gestioná torneos y fixtures',
    description:
      'Sorteá cruces de liga (todos contra todos) o playoffs por eliminación directa. Cómputo automático de tablas de posiciones, goles y llaves.',
    icon: Trophy,
    uiPreview: (
      <div className="bg-white rounded-xl p-3 border border-neutral-200/90 shadow-sm text-xs font-mono space-y-2">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 text-[11px]">
          <span className="font-bold text-neutral-900">SEMIFINAL CLAUSURA</span>
          <span className="px-1.5 py-0.5 rounded bg-brand-red text-white text-[10px] font-bold">
            EN VIVO
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-neutral-800">Huracán FC</span>
          <span className="text-brand-red">3</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-bold border-t border-dashed border-neutral-200 pt-1">
          <span className="text-neutral-800">Los Andes</span>
          <span className="text-neutral-400">1</span>
        </div>
      </div>
    ),
  },
]

export const SimpleWorkflowSection: React.FC<SimpleWorkflowSectionProps> = ({
  onOpenDemo,
}) => {
  return (
    <section
      id="como-funciona"
      className="w-full bg-brand-cream py-20 lg:py-28 text-neutral-950 overflow-hidden relative border-b border-neutral-300/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera Editorial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 sm:pb-16 border-b border-neutral-300/80">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-5 h-[2px] bg-brand-red inline-block" />
              <span className="text-xs font-mono font-bold tracking-widest text-brand-red uppercase">
                PASO A PASO // FLUJO OPERATIVO
              </span>
            </div>
            
            <h2 className="font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.02] text-neutral-950">
              Así de simple.
              <br />
              <span className="text-brand-red">Del turno</span> al torneo.
            </h2>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 max-w-md">
            <p className="text-sm sm:text-base text-neutral-700 leading-relaxed md:text-right">
              Una plataforma diseñada para digitalizar la operación completa de tu complejo deportivo sin curvas de aprendizaje interminables.
            </p>
            <button
              type="button"
              onClick={onOpenDemo}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-950 hover:text-brand-red transition-colors group"
            >
              <span>SOLICITAR UNA DEMO GUIADA</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Grilla Visual de 4 Pasos con Micro-Interfaces */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 items-stretch">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="bg-brand-cream-card/90 rounded-2xl p-6 sm:p-7 border border-neutral-300 flex flex-col justify-between hover:bg-white hover:border-neutral-400/80 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <div>
                  {/* Fila Superior: Número Grande + Badge + Ícono */}
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-300/70">
                    <span className="text-3xl font-black text-neutral-900 font-mono tracking-tighter group-hover:text-brand-red transition-colors">
                      {step.number}
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-neutral-950 text-white">
                      {step.badge}
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-neutral-200 text-neutral-800 flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                  </div>

                  {/* Textos */}
                  <h3 className="mt-5 text-lg font-bold text-neutral-950 leading-snug group-hover:text-brand-red transition-colors">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Micro-Interfaz Representativa */}
                <div className="mt-6 pt-4 border-t border-neutral-300/60">
                  {step.uiPreview}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
