import React from 'react'

export const SportsTicker: React.FC = () => {
  return (
    <div className="w-full bg-brand-cream border-y border-neutral-300/80 py-4 px-4 sm:px-6 lg:px-8 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-950">
        {/* Lado Izquierdo: Statement en mayúsculas */}
        <div className="font-black text-xs sm:text-sm tracking-wider uppercase text-center sm:text-left">
          TODO LO QUE PASA EN TU COMPLEJO, EN UN SOLO LUGAR.
        </div>

        {/* Lado Derecho: Lista de Disciplinas */}
        <div className="flex items-center gap-6 sm:gap-8 font-mono text-xs sm:text-sm font-bold tracking-widest text-neutral-700 uppercase">
          <span className="hover:text-neutral-950 transition-colors">FÚTBOL</span>
          <span className="hover:text-neutral-950 transition-colors">PÁDEL</span>
          <span className="hover:text-neutral-950 transition-colors">TENIS</span>
          <span className="hover:text-neutral-950 transition-colors">BÁSQUET</span>
        </div>
      </div>
    </div>
  )
}
