import React from 'react'
import { MultiSportLogo } from './MultiSportLogo'

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#111215] border-t border-[#31343E] py-12 text-[#9497A1] text-sm font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <MultiSportLogo />
          <p className="text-xs text-[#9497A1] font-mono mt-1">
            Gestión de turnos y torneos para complejos deportivos de alta rotación.
          </p>
        </div>

        {/* Links de navegación */}
        <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-[#9497A1]">
          <a href="#agenda-preview" className="hover:text-[#D46211] transition-colors">
            Agenda en Vivo
          </a>
          <a href="#funciones" className="hover:text-[#D46211] transition-colors">
            Módulos
          </a>
          <a href="#como-funciona" className="hover:text-[#D46211] transition-colors">
            Cómo funciona
          </a>
          <a href="#preguntas-frecuentes" className="hover:text-[#D46211] transition-colors">
            Preguntas frecuentes
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-[#9497A1] font-mono text-center md:text-right">
          © 2026 MultiSport Pro Club OS. Todos los derechos reservados.
        </div>

      </div>
    </footer>
  )
}
