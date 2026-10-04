import React from 'react'

export const TeamBannerSection: React.FC = () => {
  return (
    <section className="relative w-full bg-brand-red py-20 sm:py-24 lg:py-28 overflow-hidden select-none">
      {/* Marca de agua tipográfica decorativa "MS" */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-white/10 font-black text-[180px] sm:text-[260px] lg:text-[340px] tracking-tighter leading-none pointer-events-none select-none z-0 pr-4 sm:pr-8">
        MS
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Lado Izquierdo: Titular Principal */}
          <div className="lg:col-span-7">
            <div className="text-xs font-mono font-bold tracking-widest text-white/80 uppercase">
              HECHO PARA EL MOVIMIENTO
            </div>
            
            <h2 className="mt-4 font-black text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[0.95] text-white">
              Tu complejo
              <br />
              es un
              <br />
              equipo.
            </h2>
          </div>

          {/* Lado Derecho: Párrafo de Cierre de Bloque */}
          <div className="lg:col-span-5 flex items-center">
            <p className="text-white/90 font-semibold text-lg sm:text-xl lg:text-2xl leading-relaxed max-w-md">
              Dejá de apagar incendios y empezá a tomar decisiones con una vista clara de todo lo que sucede.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
