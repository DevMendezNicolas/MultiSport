import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authApi } from '../api/authApi'
import type { AuthResponse, LoginPayload, RegisterComplexPayload, RegisterSuccessResponse, UserInfoDto } from '../types'
import { AuthContext, type AuthContextType } from './authContextDef'
import { getAccessToken, setAccessToken, onAuthExpired } from '@/lib/axios'
import { queryClient } from '@/lib/queryClient'
import { useIdleTimeout } from '../hooks/useIdleTimeout'
import {
  broadcastLogout,
  broadcastTokenRefreshed,
  subscribeAuthSync,
  type AuthSyncMessage,
} from '../services/authSync'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfoDto | null>(null)
  const [accessToken, setToken] = useState<string | null>(getAccessToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const handleSessionExpired = useCallback(async (reason: string = 'Tu sesión expiró por 30 minutos de inactividad.') => {
    setUser(null)
    setToken(null)
    setAccessToken(null)
    queryClient.clear()

    try {
      await authApi.logout()
    } catch {
      // Ignorar fallo de red en logout durante expiración
    }

    toast.error(reason)
  }, [])


  useEffect(() => {
    let isMounted = true
    const initAuth = async () => {
      try {
        const data = await authApi.refreshToken()
        if (isMounted) {
          setUser(data.user)
          setToken(data.accessToken)
          setAccessToken(data.accessToken)
        }
      } catch {
        if (isMounted) {
          setUser(null)
          setToken(null)
          setAccessToken(null)
          queryClient.clear()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void initAuth()

    return () => {
      isMounted = false
    }
  }, [])

  // Suscripción al interceptor de Axios cuando el refresh de red falla irremediablemente
  useEffect(() => {
    const unsubscribe = onAuthExpired((reason) => {
      if (reason === 'SESSION_EXPIRED' || reason === 'INACTIVITY') {
        void handleSessionExpired('Tu sesión expiró. Por favor, inicia sesión nuevamente.')
      } else {
        setUser(null)
        setToken(null)
        setAccessToken(null)
        queryClient.clear()
      }
    })
    return unsubscribe
  }, [handleSessionExpired])

  // Suscripción a eventos de sincronización multi-pestaña (login en otra pestaña o logout)
  useEffect(() => {
    const unsubscribe = subscribeAuthSync((message: AuthSyncMessage) => {
      if (message.type === 'TOKEN_REFRESHED') {
        setUser(message.user)
        setToken(message.accessToken)
        setAccessToken(message.accessToken)
      } else if (message.type === 'LOGOUT') {
        setUser(null)
        setToken(null)
        setAccessToken(null)
        queryClient.clear()
      }
    })
    return unsubscribe
  }, [])

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const data = await authApi.refreshToken()
      setUser(data.user)
      setToken(data.accessToken)
      setAccessToken(data.accessToken)
      broadcastTokenRefreshed(data.accessToken, data.user)
    } catch (error) {
      setUser(null)
      setToken(null)
      setAccessToken(null)
      queryClient.clear()
      throw error
    }
  }, [])

  // Hook central de monitoreo de inactividad de 30 min y refresco proactivo silencioso
  useIdleTimeout({
    isAuthenticated: !!user && !!accessToken,
    accessToken,
    onSessionExpired: handleSessionExpired,
    onProactiveRefresh: refreshSession,
  })

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const data = await authApi.login(payload)
    setUser(data.user)
    setToken(data.accessToken)
    setAccessToken(data.accessToken)
    broadcastTokenRefreshed(data.accessToken, data.user)
    return data
  }

  const register = async (payload: RegisterComplexPayload): Promise<RegisterSuccessResponse> => {
    return await authApi.registerComplex(payload)
  }

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      setToken(null)
      setAccessToken(null)
      queryClient.clear()
      broadcastLogout()
    }
  }

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    register,
    logout,
    refreshSession,
    handleSessionExpired,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
