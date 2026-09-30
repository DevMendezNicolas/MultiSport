import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, LogIn, Menu, X } from 'lucide-react'
import { MultiSportLogo } from './MultiSportLogo'
import type { NavItem } from '../types/landing.types'

interface LandingNavbarProps {
  onOpenDemo: () => void
}

const navItems: NavItem[] = [
  { label: 'Funciones', href: '#funciones' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Preguntas frecuentes', href: '#preguntas-frecuentes' },
]

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onOpenDemo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-dark/90 backdrop-blur-md border-b border-neutral-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <MultiSportLogo />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-neutral-300 hover:text-brand-yellow transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white font-medium text-sm transition-colors"
          >
            <LogIn className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
            <span>Iniciar sesión</span>
          </Link>

          <button
            type="button"
            onClick={onOpenDemo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-yellow text-neutral-950 font-bold text-sm hover:bg-brand-yellow-hover transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <span>Solicitar demo</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Mobile Action & Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/login"
            className="p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors flex items-center justify-center"
            aria-label="Iniciar sesión"
          >
            <LogIn className="h-5 w-5" strokeWidth={1.75} />
          </Link>

          <button
            type="button"
            onClick={onOpenDemo}
            className="px-3 py-1.5 rounded-full bg-brand-yellow text-neutral-950 font-bold text-xs flex items-center gap-1"
          >
            <span>Demo</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-11 w-11 flex items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" strokeWidth={2} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950/95 px-6 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-neutral-200 hover:text-brand-yellow py-2 border-b border-neutral-900"
            >
              {item.label}
            </a>
          ))}

          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-3 px-4 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <LogIn className="h-4 w-4" strokeWidth={1.75} />
            <span>Iniciar sesión</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false)
              onOpenDemo()
            }}
            className="w-full py-3 rounded-full bg-brand-yellow text-neutral-950 font-bold text-sm flex items-center justify-center gap-2"
          >
            <span>Solicitar demo</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </header>
  )
}
