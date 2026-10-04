import React from 'react'

const disciplines = [
  'FÚTBOL 5 / 7 / 11',
  'PÁDEL',
  'TENIS',
  'BÁSQUET',
  'TORNEOS & PLAYOFFS',
  'AGENDA EN TIEMPO REAL',
]

export const SportsTicker: React.FC = () => {
  return (
    <div className="w-full bg-brand-cream border-y border-neutral-300/90 py-3 sm:py-4 px-4 sm:px-6 lg:px-8 overflow-hidden select-none relative z-10 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-neutral-950">
        
        {/* Lado Izquierdo: Badge de Acento Rojo Deportivo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red text-white text-[11px] font-mono font-bold tracking-wider uppercase shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span>EN JUEGO</span>
          </span>
          <span className="font-black text-xs sm:text-sm tracking-tight uppercase text-neutral-900">
            TODO TU COMPLEJO, EN UN SOLO LUGAR
          </span>
        </div>

        {/* Lado Derecho: Cinta de Disciplinas con Separadores Deportivos */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 font-mono text-xs sm:text-sm font-bold tracking-widest text-neutral-800 uppercase">
          {disciplines.map((item, idx) => (
            <div key={item} className="flex items-center gap-3">
              <span className="hover:text-brand-red transition-colors cursor-default">
                {item}
              </span>
              {idx < disciplines.length - 1 && (
                <span className="text-brand-red font-bold select-none text-xs">
                  //
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

