import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { MultiSportLogo } from '@/features/landing/components/MultiSportLogo'
import { useAuth } from '@/features/auth'
import { cn } from '@/lib/utils'

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  // Exactamente 3 opciones en el Sidebar según requerimiento
  const navLinks = [
    { to: '/admin', label: 'Panel General', icon: LayoutDashboard, end: true },
    { to: '/admin/courts', label: 'Canchas e Instalaciones', icon: Clock },
    { to: '/admin/settings', label: 'Configuración', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#17181C] text-[#F2F3F5] flex flex-col font-body">
      {/* Barra Superior / Header Sticky */}
      <header className="h-16 border-b border-[#31343E] bg-[#17181C]/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Izquierda: Logo y botón drawer en móvil */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-lg text-[#9497A1] hover:text-white hover:bg-[#22242B] transition-colors"
            aria-label="Alternar menú lateral"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>

          <Link to="/admin" className="flex items-center gap-2">
            <MultiSportLogo />
          </Link>
        </div>

        {/* Centro: Título destacado del Nombre del Complejo */}
        <div className="flex-1 flex justify-center text-center px-2">
          <h1 className="font-headline text-base sm:text-xl lg:text-2xl font-black text-[#F2F3F5] tracking-tight uppercase truncate max-w-[480px]">
            {user?.complexName || 'MultiSport'}
          </h1>
        </div>

        {/* Derecha: Botón Cerrar sesión limpio */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#9497A1] hover:text-white hover:bg-[#22242B] border border-[#31343E] flex items-center gap-2 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4 text-[#D46211]" strokeWidth={1.75} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      {/* Cuerpo Principal con Sidebar y Contenido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Lateral Desktop (Colapsable con botón inferior) */}
        <aside
          className={cn(
            'hidden md:flex flex-col border-r border-[#31343E] bg-[#111215] p-3 transition-all duration-300',
            isSidebarCollapsed ? 'w-20 items-center' : 'w-64'
          )}
        >
          {/* Navegación Principal (3 opciones) */}
          <div className="space-y-1 w-full">
            {navLinks.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'min-h-[44px] flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer',
                      isSidebarCollapsed ? 'w-12 justify-center p-2 mx-auto' : 'w-full gap-3 px-3.5 py-2.5',
                      isActive
                        ? 'bg-[#D46211] text-white shadow-sm font-bold'
                        : 'text-[#9497A1] hover:text-white hover:bg-[#22242B]'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )
            })}
          </div>

          {/* Botón de Colapso anclado en la parte inferior */}
          <div className="mt-auto pt-3 border-t border-[#31343E] w-full">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={cn(
                'min-h-[40px] flex items-center rounded-xl text-xs font-semibold text-[#9497A1] hover:text-white hover:bg-[#22242B] border border-[#31343E]/60 transition-colors cursor-pointer',
                isSidebarCollapsed ? 'w-12 justify-center p-2 mx-auto' : 'w-full gap-3 px-3.5 py-2'
              )}
              title={isSidebarCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">Colapsar menú</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Drawer Lateral Mobile */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-[#17181C] border-r border-[#31343E] p-5 flex flex-col space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#31343E]">
                <span className="text-sm font-headline font-bold text-white uppercase truncate">
                  {user?.complexName || 'MultiSport'}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-10 w-10 flex items-center justify-center text-[#9497A1] hover:text-white"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 space-y-1">
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
                          'min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                          isActive
                            ? 'bg-[#D46211] text-white font-bold'
                            : 'text-[#9497A1] hover:bg-[#22242B] hover:text-white'
                        )
                      }
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-red-400 bg-red-950/20 border border-red-900/40 p-3 mt-auto cursor-pointer"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* Área de Contenido Principal Full Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#17181C] text-[#F2F3F5]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
