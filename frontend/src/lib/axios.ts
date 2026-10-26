import axios, { type InternalAxiosRequestConfig } from 'axios'

let inMemoryToken: string | null = null
let isTerminatingSession = false

export const startSessionTermination = (): void => {
  isTerminatingSession = true
  processQueue(new Error('Session is terminating'), null)
}

export const resetSessionTermination = (): void => {
  isTerminatingSession = false
}

export const getAccessToken = (): string | null => {
  return inMemoryToken
}

export const setAccessToken = (token: string | null): void => {
  inMemoryToken = token
  if (token !== null) {
    resetSessionTermination()
  }
}

export interface JwtPayload {
  sub?: string
  email?: string
  role?: string
  complex_id?: string
  exp?: number
  nbf?: number
  iat?: number
}

export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch {
    return null
  }
}

export const isTokenExpired = (token: string | null, thresholdSeconds: number = 0): boolean => {
  if (!token) return true
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return true
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp <= nowInSeconds + thresholdSeconds
}

export type AuthExpiredReason = 'INACTIVITY' | 'SESSION_EXPIRED' | 'LOGOUT'

type AuthExpiredListener = (reason: AuthExpiredReason) => void
const authExpiredListeners: Set<AuthExpiredListener> = new Set()

export const onAuthExpired = (listener: AuthExpiredListener): (() => void) => {
  authExpiredListeners.add(listener)
  return () => {
    authExpiredListeners.delete(listener)
  }
}

export const notifyAuthExpired = (reason: AuthExpiredReason = 'SESSION_EXPIRED'): void => {
  authExpiredListeners.forEach((listener) => {
    try {
      listener(reason)
    } catch (e) {
      console.error('Error executing auth expired listener:', e)
    }
  })
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: silent token refresh on 401
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si la sesión está en proceso de terminación, abortar inmediatamente sin intentar refrescar
      if (isTerminatingSession) {
        return Promise.reject(error)
      }

      // Don't retry if the failed call was login or refresh itself
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        const hadToken = getAccessToken() !== null
        setAccessToken(null)
        // Solo notificar expiración si el usuario ya contaba con una sesión autenticada previa
        if (hadToken) {
          notifyAuthExpired('SESSION_EXPIRED')
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = data.accessToken
        setAccessToken(newAccessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        processQueue(null, newAccessToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const hadToken = getAccessToken() !== null
        setAccessToken(null)
        if (hadToken) {
          notifyAuthExpired('SESSION_EXPIRED')
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
