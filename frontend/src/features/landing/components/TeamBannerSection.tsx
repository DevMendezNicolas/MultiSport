import React from 'react'

export const TeamBannerSection: React.FC = () => {
  return (
    <section className="relative w-full bg-[#111215] py-16 sm:py-20 lg:py-24 border-b border-[#31343E] overflow-hidden select-none font-body">
      {/* Resplandor verde institucional */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#327357]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Lado Izquierdo: Titular Principal */}
          <div className="lg:col-span-7">
            <div className="text-xs font-mono font-bold tracking-widest text-[#D46211] uppercase">
              HECHO PARA EL MOVIMIENTO
            </div>
            
            <h2 className="mt-3 font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-[#F2F3F5]">
              Tu complejo
              <br />
              es un <span className="text-[#327357]">equipo.</span>
            </h2>
          </div>

          {/* Lado Derecho: Párrafo de Cierre de Bloque */}
          <div className="lg:col-span-5 flex items-center">
            <p className="text-[#9497A1] font-medium text-base sm:text-lg lg:text-xl leading-relaxed max-w-md">
              Dejá de apagar incendios con cuadernos o chats dispersos y empezá a tomar decisiones con una vista clara y en vivo de tus canchas.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
