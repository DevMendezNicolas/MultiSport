import React from 'react'
import {
  Flame,
  Zap,
  Crosshair,
  Shield,
  Trophy,
  CheckCircle2,
  Sliders,
} from 'lucide-react'

interface SportItem {
  id: string;
  name: string;
  tag: string;
  duration: string;
  surfaces: string[];
  formats: string[];
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accentColor: string;
}

const sportsList: SportItem[] = [
  {
    id: 'futbol',
    name: 'Fútbol 5 / 7 / 11',
    tag: 'FUTBOL',
    duration: '60 min por turno',
    surfaces: ['Césped Sintético con Caucho', 'Césped Natural'],
    formats: ['Turnos Eventuales', 'Fijos Semanales', 'Ligas Apertura/Clausura'],
    icon: Flame,
    accentColor: 'text-brand-red',
  },
  {
    id: 'padel',
    name: 'Pádel',
    tag: 'PADEL',
    duration: '90 min por turno',
    surfaces: ['Cristal Panorámico', 'Canchas Tradicionales'],
    formats: ['Turnos de Parejas', 'Torneos por Categoría (4ta a 7ma)'],
    icon: Zap,
    accentColor: 'text-brand-red',
  },
  {
    id: 'tenis',
    name: 'Tenis',
    tag: 'TENIS',
    duration: '60 o 90 min',
    surfaces: ['Polvo de Ladrillo', 'Cemento / Hard Court'],
    formats: ['Singles / Dobles', 'Recargo Iluminación Nocturna'],
    icon: Crosshair,
    accentColor: 'text-brand-red',
  },
  {
    id: 'basquet',
    name: 'Básquet & Polideportivos',
    tag: 'POLIDEPORTIVO',
    duration: '60 a 120 min',
    surfaces: ['Parquet Flotante', 'Hormigón Alisado'],
    formats: ['Superficies Compartidas', 'Escuelas y Entrenamientos'],
    icon: Shield,
    accentColor: 'text-brand-red',
  },
  {
    id: 'torneos',
    name: 'Torneos & Competencias',
    tag: 'MOTOR PRO',
    duration: 'Fechas simultáneas',
    surfaces: ['Cualquier disciplina configurada'],
    formats: ['Round-Robin (Ligas)', 'Playoffs Eliminación Directa'],
    icon: Trophy,
    accentColor: 'text-brand-red',
  },
]

export const SportsEcosystemSection: React.FC = () => {
  return (
    <section className="w-full bg-brand-cream py-20 lg:py-28 text-neutral-950 overflow-hidden relative border-b border-neutral-300/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Cabecera Editorial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 sm:pb-16 border-b border-neutral-300/80">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-5 h-[2px] bg-brand-red inline-block" />
              <span className="text-xs font-mono font-bold tracking-widest text-brand-red uppercase">
                COBERTURA INTEGRAL // MULTIDISCIPLINA
              </span>
            </div>
            
            <h2 className="font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.02] text-neutral-950">
              Tu complejo es <span className="text-brand-red">multideporte.</span>
              <br />
              Tu software también.
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
              MultiSport no te ata a un deporte específico. Cada disciplina cuenta con reglas de tiempo, tipos de piso y esquemas de precios personalizados para que administres todas tus canchas bajo una misma cuenta.
            </p>
          </div>
        </div>

        {/* Grilla Asimétrica de Disciplinas */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {sportsList.map((sport, index) => {
            const Icon = sport.icon
            const isFeatured = index === 0 || index === 4
            return (
              <div
                key={sport.id}
                className={`rounded-2xl p-6 sm:p-7 border flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md ${
                  isFeatured
                    ? 'bg-neutral-950 text-white border-neutral-800 hover:border-neutral-700'
                    : 'bg-white text-neutral-950 border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div>
                  {/* Top Bar de la Tarjeta */}
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-800/40">
                    <span
                      className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${
                        isFeatured
                          ? 'bg-brand-red text-white'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                      }`}
                    >
                      {sport.tag}
                    </span>
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        isFeatured
                          ? 'bg-neutral-900 text-brand-red'
                          : 'bg-neutral-100 text-brand-red'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                  </div>

                  {/* Título de la Disciplina */}
                  <h3 className="mt-5 text-xl sm:text-2xl font-black tracking-tight leading-tight">
                    {sport.name}
                  </h3>
                  
                  {/* Duración Monospace */}
                  <div className="mt-2 text-xs font-mono font-semibold text-neutral-400">
                    {sport.duration}
                  </div>

                  {/* Superficies Soportadas */}
                  <div className="mt-5 space-y-2">
                    <div
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                        isFeatured ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                    >
                      Superficies y Pisos:
                    </div>
                    {sport.surfaces.map((surface) => (
                      <div
                        key={surface}
                        className={`text-xs font-medium flex items-center gap-2 ${
                          isFeatured ? 'text-neutral-300' : 'text-neutral-700'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-red flex-shrink-0" />
                        <span>{surface}</span>
                      </div>
                    ))}
                  </div>

                  {/* Formatos Operativos */}
                  <div className="mt-5 space-y-2">
                    <div
                      className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                        isFeatured ? 'text-neutral-400' : 'text-neutral-500'
                      }`}
                    >
                      Modalidades Operativas:
                    </div>
                    {sport.formats.map((format) => (
                      <div
                        key={format}
                        className={`text-xs font-medium flex items-center gap-2 ${
                          isFeatured ? 'text-neutral-300' : 'text-neutral-700'
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 flex-shrink-0 ${
                            isFeatured ? 'text-brand-red' : 'text-emerald-600'
                          }`}
                          strokeWidth={2}
                        />
                        <span>{format}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer de Tarjeta */}
                <div
                  className={`mt-6 pt-4 border-t text-[11px] font-mono flex items-center justify-between ${
                    isFeatured
                      ? 'border-neutral-800 text-neutral-400'
                      : 'border-neutral-200 text-neutral-500'
                  }`}
                >
                  <span>PARÁMETRO CONFIGURABLE</span>
                  <Sliders className="h-3.5 w-3.5" strokeWidth={1.75} />
                </div>
              </div>
            )
          })}

          {/* Tarjeta de Cierre Editorial (Bloque Rojo Deportivo) */}
          <div className="rounded-2xl p-6 sm:p-7 bg-brand-red text-white flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/20">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-black/20 text-white">
                  MODELO DINÁMICO
                </span>
                <span className="text-xs font-mono font-bold text-white/90">
                  100% PERSONALIZABLE
                </span>
              </div>

              <div className="mt-5 text-3xl sm:text-4xl font-black font-mono tracking-tighter">
                +4
              </div>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold leading-snug">
                Deportes bajo un único panel de control.
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-white/90 leading-relaxed">
                Sin planillas aisladas ni programas separados para cada cancha. Todo se gestiona desde el mismo sistema unificado.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20 font-mono text-[11px] text-white/80">
              DISPONIBLE DESDE EL PRIMER DÍA
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
