import React from 'react'
import { MultiSportLogo } from './MultiSportLogo'

export const LandingFooter: React.FC = () => {
  return (
    <footer className="w-full bg-brand-dark border-t border-neutral-900 py-12 text-neutral-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <MultiSportLogo />
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Gestión de turnos y torneos para complejos deportivos.
          </p>
        </div>

        {/* Links de navegación */}
        <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-neutral-400">
          <a href="#funciones" className="hover:text-brand-red transition-colors">
            Funciones
          </a>
          <a href="#como-funciona" className="hover:text-brand-red transition-colors">
            Cómo funciona
          </a>
          <a href="#preguntas-frecuentes" className="hover:text-brand-red transition-colors">
            Preguntas frecuentes
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-neutral-500 font-mono text-center md:text-right">
          © 2026 MultiSport. Todos los derechos reservados.
        </div>

      </div>
    </footer>
  )
}
