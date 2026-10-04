import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, LogIn, Menu, X } from 'lucide-react'
import { MultiSportLogo } from './MultiSportLogo'
import type { NavItem } from '../types/landing.types'

const navItems: NavItem[] = [
  { label: 'Funciones', href: '#funciones' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Preguntas frecuentes', href: '#preguntas-frecuentes' },
]

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-dark/95 backdrop-blur-md border-b border-neutral-900/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded-lg py-1 px-1 -ml-1 transition-transform active:scale-95"
        >
          <MultiSportLogo accent="red" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-semibold tracking-wide text-neutral-400 hover:text-white transition-colors relative py-1 group flex items-center gap-1.5"
            >
              <span>{item.label}</span>
              <span className="h-1 w-1 rounded-full bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white font-medium text-sm transition-all active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
            <span>Iniciar sesión</span>
          </Link>

          <Link
            to="/register"
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-red text-white font-bold text-sm hover:bg-brand-red-hover transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-brand-red/20"
          >
            <span>Registrarse</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Mobile Actions & Hamburger Button (Fitts's Law >= 44x44px) */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/login"
            className="min-h-[44px] min-w-[44px] rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors flex items-center justify-center"
            aria-label="Iniciar sesión"
          >
            <LogIn className="h-5 w-5" strokeWidth={1.75} />
          </Link>

          <Link
            to="/register"
            className="min-h-[44px] px-3.5 py-2 rounded-full bg-brand-red text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span>Registrarse</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" strokeWidth={2} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950/98 backdrop-blur-xl px-6 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-neutral-200 hover:text-brand-red py-3 border-b border-neutral-900 flex items-center justify-between"
            >
              <span>{item.label}</span>
              <ArrowUpRight className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
            </a>
          ))}

          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[48px] w-full py-3 px-4 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <LogIn className="h-4 w-4" strokeWidth={1.75} />
            <span>Iniciar sesión</span>
          </Link>

          <Link
            to="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[48px] w-full py-3 rounded-full bg-brand-red text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-red/20 active:scale-98 transition-transform"
          >
            <span>Registrarse</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </header>
  )
}
