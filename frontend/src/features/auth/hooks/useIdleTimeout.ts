import { useEffect, useRef } from 'react'
import { isTokenExpired } from '@/lib/axios'
import {
  broadcastActivity,
  broadcastSessionExpired,
  getLastActivityTimestamp,
  subscribeAuthSync,
  type AuthSyncMessage,
} from '../services/authSync'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos
const PROACTIVE_REFRESH_THRESHOLD_SECONDS = 120 // Refrescar si restan <= 2 minutos
const CHECK_INTERVAL_MS = 15 * 1000 // Revisión periódica cada 15 segundos
const ACTIVITY_DEBOUNCE_MS = 10 * 1000 // Máximo 1 reporte de actividad cada 10s

interface UseIdleTimeoutOptions {
  isAuthenticated: boolean
  accessToken: string | null
  onSessionExpired: (reason: string) => Promise<void>
  onProactiveRefresh: () => Promise<void>
}

export const useIdleTimeout = ({
  isAuthenticated,
  accessToken,
  onSessionExpired,
  onProactiveRefresh,
}: UseIdleTimeoutOptions): void => {
  const lastActivityRef = useRef<number>(getLastActivityTimestamp())
  const lastBroadcastRef = useRef<number>(0)
  const isRefreshingRef = useRef<boolean>(false)
  const isExpiringRef = useRef<boolean>(false)

  // Sincronización de eventos de actividad del usuario
  useEffect(() => {
    if (!isAuthenticated) return

    const handleUserActivity = () => {
      const now = Date.now()
      lastActivityRef.current = now

      if (now - lastBroadcastRef.current >= ACTIVITY_DEBOUNCE_MS) {
        lastBroadcastRef.current = now
        broadcastActivity(now)
      }
    }

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    const unsubscribe = subscribeAuthSync((message: AuthSyncMessage) => {
      if (message.type === 'ACTIVITY') {
        lastActivityRef.current = Math.max(lastActivityRef.current, message.timestamp)
      } else if (message.type === 'SESSION_EXPIRED') {
        if (!isExpiringRef.current) {
          isExpiringRef.current = true
          void onSessionExpired(message.reason || 'Tu sesión expiró por 30 minutos de inactividad.')
        }
      }
    })

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
      unsubscribe()
    }
  }, [isAuthenticated, onSessionExpired])

  // Verificación periódica de inactividad y refresco proactivo
  useEffect(() => {
    if (!isAuthenticated) return

    const intervalId = window.setInterval(async () => {
      if (isExpiringRef.current) return

      const now = Date.now()
      const timeSinceActivity = now - lastActivityRef.current

      // 1. Verificar si se superaron los 30 minutos de inactividad
      if (timeSinceActivity >= IDLE_TIMEOUT_MS) {
        isExpiringRef.current = true
        broadcastSessionExpired('Tu sesión expiró por 30 minutos de inactividad.')
        await onSessionExpired('Tu sesión expiró por 30 minutos de inactividad.')
        return
      }

      // 2. Si el usuario está activo y al token le quedan menos de 2 minutos, refrescar proactivamente
      if (accessToken && !isRefreshingRef.current) {
        const needsRefresh = isTokenExpired(accessToken, PROACTIVE_REFRESH_THRESHOLD_SECONDS)
        if (needsRefresh) {
          try {
            isRefreshingRef.current = true
            await onProactiveRefresh()
          } catch (error) {
            console.error('Fallo en renovación proactiva de token:', error)
          } finally {
            isRefreshingRef.current = false
          }
        }
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isAuthenticated, accessToken, onSessionExpired, onProactiveRefresh])
}
