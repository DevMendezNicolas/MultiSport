import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { isTokenExpired } from '@/lib/axios'
import { getLastActivityTimestamp } from '@/features/auth/services/authSync'
import { Skeleton } from '@/components/ui/skeleton'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, accessToken, refreshSession, handleSessionExpired } = useAuth()
  const location = useLocation()
  const [isVerifying, setIsVerifying] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true

    const verifyTokenFreshness = async () => {
      if (!isAuthenticated || !accessToken) return

      const timeSinceActivity = Date.now() - getLastActivityTimestamp()

      // Si pasaron 30 minutos sin actividad, forzar expiración inmediata
      if (timeSinceActivity >= IDLE_TIMEOUT_MS) {
        await handleSessionExpired('Tu sesión expiró por 30 minutos de inactividad.')
        return
      }

      // Si el access token ya expiró o le restan menos de 10 segundos, renovarlo proactivamente antes de renderizar
      if (isTokenExpired(accessToken, 10)) {
        setIsVerifying(true)
        try {
          await refreshSession()
        } catch {
          await handleSessionExpired('Tu sesión ha expirado. Inicia sesión nuevamente.')
        } finally {
          if (isMounted) {
            setIsVerifying(false)
          }
        }
      }
    }

    void verifyTokenFreshness()

    return () => {
      isMounted = false
    }
  }, [location.pathname, isAuthenticated, accessToken, refreshSession, handleSessionExpired])

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-brand-dark text-neutral-50 flex flex-col p-6 space-y-6">
        {/* Skeleton Cabecera */}
        <div className="h-16 w-full flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
            <Skeleton className="h-6 w-48 rounded bg-neutral-800" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-full bg-neutral-800" />
            <Skeleton className="h-9 w-9 rounded-full bg-neutral-800" />
          </div>
        </div>

        {/* Skeleton Contenido Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Skeleton className="h-32 rounded-2xl bg-neutral-900 border border-neutral-800" />
          <Skeleton className="h-32 rounded-2xl bg-neutral-900 border border-neutral-800" />
          <Skeleton className="h-32 rounded-2xl bg-neutral-900 border border-neutral-800" />
        </div>

        {/* Skeleton Tabla Principal */}
        <div className="pt-4">
          <Skeleton className="h-96 w-full rounded-2xl bg-neutral-900 border border-neutral-800" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
