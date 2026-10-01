import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Calendar, Clock, DollarSign, LayoutDashboard, LogOut, Menu, Settings, Trophy, X } from 'lucide-react'
import { toast } from 'sonner'
import { MultiSportLogo } from '@/features/landing/components/MultiSportLogo'
import { useAuth } from '@/features/auth'
import { cn } from '@/lib/utils'

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Sesión finalizada', {
        description: 'Has cerrado sesión correctamente.',
      })
      navigate('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  const navLinks = [
    { to: '/admin', label: 'Panel General', icon: LayoutDashboard, end: true },
    { to: '/admin/bookings', label: 'Agenda de Turnos', icon: Calendar },
    { to: '/admin/courts', label: 'Canchas e Instalaciones', icon: Clock },
    { to: '/admin/tournaments', label: 'Torneos y Eventos', icon: Trophy },
    { to: '/admin/finances', label: 'Caja y Pagos', icon: DollarSign },
    { to: '/admin/settings', label: 'Configuración', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col">
      {/* Barra Superior / Header */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            aria-label="Alternar menú lateral"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>

          <Link to="/admin" className="flex items-center gap-2">
            <MultiSportLogo />
          </Link>

          {/* Badge del Complejo */}
          {user?.complexName && (
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-neutral-300 tracking-wide uppercase truncate max-w-[200px]">
                {user.complexName}
              </span>
            </div>
          )}
        </div>

        {/* Acciones de Usuario */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-white truncate max-w-[160px]">{user?.email}</span>
            <span className="text-[10px] font-mono text-brand-yellow uppercase tracking-wider">{user?.role}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-neutral-900 border border-neutral-800/80 flex items-center gap-2 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Cuerpo Principal con Sidebar y Contenido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Lateral Desktop */}
        <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-950/40 p-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            OPERACIÓN
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900'
                  )
                }
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </aside>

        {/* Drawer Lateral Mobile */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-neutral-950 border-r border-neutral-800 p-5 flex flex-col space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{user?.complexName}</span>
                  <span className="text-[10px] font-mono text-neutral-400">{user?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-9 w-9 flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 space-y-1 pt-2">
                {navLinks.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-brand-yellow/10 text-brand-yellow font-bold'
                            : 'text-neutral-300 hover:bg-neutral-900'
                        )
                      }
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-red-400 bg-red-950/20 border border-red-900/40 p-3 mt-auto"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* Área de Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
