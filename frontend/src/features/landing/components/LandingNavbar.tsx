import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, LogIn, Menu, X } from 'lucide-react'
import { MultiSportLogo } from './MultiSportLogo'
import type { NavItem } from '../types/landing.types'

const navItems: NavItem[] = [
  { label: 'Agenda en Vivo', href: '#agenda-preview' },
  { label: 'Módulos Operativos', href: '#funciones' },
  { label: 'Preguntas Frecuentes', href: '#preguntas-frecuentes' },
]

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-[#17181C]/90 backdrop-blur-xl border-b border-[#31343E] transition-colors shadow-[0_1px_12px_rgba(0,0,0,0.4)] font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <MultiSportLogo />
          </Link>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono tracking-wider bg-[#22242B] border border-[#31343E] text-[#9497A1] uppercase">
            Pro Club OS
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#9497A1] hover:text-[#F2F3F5] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#31343E] hover:border-[#D46211]/50 bg-[#22242B] hover:bg-[#292A2E] text-[#F2F3F5] font-medium text-sm transition-colors"
          >
            <LogIn className="h-4 w-4 text-[#9497A1]" strokeWidth={1.75} />
            <span>Iniciar sesión</span>
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D46211] text-white font-semibold text-sm hover:bg-[#E37A24] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[#D46211]/20"
          >
            <span>Registrar Complejo</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        {/* Mobile Action & Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/login"
            className="p-2 rounded-lg text-[#9497A1] hover:text-white hover:bg-[#22242B] transition-colors flex items-center justify-center"
            aria-label="Iniciar sesión"
          >
            <LogIn className="h-5 w-5" strokeWidth={1.75} />
          </Link>

          <Link
            to="/register"
            className="px-3.5 py-1.5 rounded-lg bg-[#D46211] text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
          >
            <span>Alta</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-10 w-10 flex items-center justify-center rounded-lg text-[#9497A1] hover:text-white hover:bg-[#22242B] transition-colors"
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" strokeWidth={1.75} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 border-b border-[#31343E] bg-[#17181C]/95 backdrop-blur-md flex flex-col gap-3">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-[#F2F3F5] hover:text-[#D46211] py-2 border-b border-[#22242B]"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-lg bg-[#22242B] text-center text-sm font-medium text-[#F2F3F5] border border-[#31343E]"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 rounded-lg bg-[#D46211] text-center text-sm font-semibold text-white shadow-sm"
            >
              Registrar Complejo
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
