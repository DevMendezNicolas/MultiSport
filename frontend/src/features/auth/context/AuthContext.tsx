import React, { useCallback, useEffect, useState } from 'react'
import { authApi } from '../api/authApi'
import type { AuthResponse, LoginPayload, RegisterComplexPayload, RegisterSuccessResponse, UserInfoDto } from '../types'
import { AuthContext, type AuthContextType } from './authContextDef'
import { getAccessToken, setAccessToken } from '@/lib/axios'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfoDto | null>(null)
  const [accessToken, setToken] = useState<string | null>(getAccessToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const restoreSession = useCallback(async () => {
    try {
      const data = await authApi.refreshToken()
      setUser(data.user)
      setToken(data.accessToken)
      setAccessToken(data.accessToken)
    } catch {
      setUser(null)
      setToken(null)
      setAccessToken(null)
    } finally {
      setIsLoading(false)
    }
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

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const data = await authApi.login(payload)
    setUser(data.user)
    setToken(data.accessToken)
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
    }
  }

  const refreshSession = async (): Promise<void> => {
    await restoreSession()
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
