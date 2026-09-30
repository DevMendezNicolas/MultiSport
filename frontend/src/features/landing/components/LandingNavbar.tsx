import React, { useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
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
        <a href="#" className="flex items-center gap-2 group">
          <MultiSportLogo />
        </a>

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

        {/* Desktop CTA Action */}
        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenDemo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-yellow text-neutral-950 font-bold text-sm hover:bg-brand-yellow-hover transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <span>Solicitar demo</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
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
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false)
              onOpenDemo()
            }}
            className="mt-2 w-full py-3 rounded-full bg-brand-yellow text-neutral-950 font-bold text-sm flex items-center justify-center gap-2"
          >
            <span>Solicitar demo</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </header>
  )
}
