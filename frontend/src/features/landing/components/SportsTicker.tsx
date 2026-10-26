import React from 'react'

export const SportsTicker: React.FC = () => {
  return (
    <div className="w-full bg-[#111215] border-y border-[#31343E] py-3.5 px-4 sm:px-6 lg:px-8 overflow-hidden select-none font-body">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[#F2F3F5]">
        {/* Lado Izquierdo: Statement */}
        <div className="font-semibold text-xs sm:text-sm tracking-wider uppercase text-center sm:text-left text-[#F2F3F5] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#327357]" />
          <span>Gestión unificada para recintos de alto rendimiento</span>
        </div>

        {/* Lado Derecho: Lista de Disciplinas */}
        <div className="flex items-center gap-5 sm:gap-8 font-mono text-xs sm:text-sm font-semibold tracking-widest text-[#9497A1] uppercase">
          <span className="hover:text-[#D46211] transition-colors">PÁDEL</span>
          <span className="text-[#31343E]">•</span>
          <span className="hover:text-[#D46211] transition-colors">FÚTBOL</span>
          <span className="text-[#31343E]">•</span>
          <span className="hover:text-[#D46211] transition-colors">TENIS</span>
          <span className="text-[#31343E]">•</span>
          <span className="hover:text-[#D46211] transition-colors">BÁSQUET</span>
        </div>
      </div>
    </div>
  )
}
