import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { Skeleton } from '@/components/ui/skeleton'

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
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
