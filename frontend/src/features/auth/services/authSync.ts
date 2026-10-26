import type { UserInfoDto } from '../types'

export type AuthSyncMessage =
  | { type: 'ACTIVITY'; timestamp: number }
  | { type: 'SESSION_EXPIRED'; reason?: string }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESHED'; accessToken: string; user: UserInfoDto }

const CHANNEL_NAME = 'multisport_auth_sync'
const STORAGE_ACTIVITY_KEY = 'multisport_last_activity'

type MessageHandler = (message: AuthSyncMessage) => void
const messageHandlers: Set<MessageHandler> = new Set()

let channel: BroadcastChannel | null = null

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
      if (event.data && typeof event.data === 'object') {
        notifyHandlers(event.data)
      }
    }
  } catch {
    channel = null
  }
}

// Fallback de sincronización vía eventos de Storage
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === STORAGE_ACTIVITY_KEY && event.newValue) {
      const ts = parseInt(event.newValue, 10)
      if (!isNaN(ts)) {
        notifyHandlers({ type: 'ACTIVITY', timestamp: ts })
      }
    }
  })
}

const notifyHandlers = (message: AuthSyncMessage): void => {
  messageHandlers.forEach((handler) => {
    try {
      handler(message)
    } catch (err) {
      console.error('Error handling auth sync message:', err)
    }
  })
}

export const subscribeAuthSync = (handler: MessageHandler): (() => void) => {
  messageHandlers.add(handler)
  return () => {
    messageHandlers.delete(handler)
  }
}

export const resetActivityTimestamp = (timestamp?: number): void => {
  const ts = timestamp ?? Date.now()
  try {
    channel?.postMessage({ type: 'ACTIVITY', timestamp: ts })
    localStorage.setItem(STORAGE_ACTIVITY_KEY, ts.toString())
  } catch {
    // Ignore postMessage / quota errors
  }
}

export const clearActivityTimestamp = (): void => {
  try {
    localStorage.removeItem(STORAGE_ACTIVITY_KEY)
  } catch {
    // Ignore quota errors
  }
}

export const broadcastActivity = (timestamp: number): void => {
  resetActivityTimestamp(timestamp)
}

export const broadcastSessionExpired = (reason: string = 'Inactividad de 30 minutos'): void => {
  try {
    channel?.postMessage({ type: 'SESSION_EXPIRED', reason })
  } catch {
    // Ignore postMessage errors
  }
}

export const broadcastLogout = (): void => {
  try {
    channel?.postMessage({ type: 'LOGOUT' })
    clearActivityTimestamp()
  } catch {
    // Ignore postMessage errors
  }
}

export const broadcastTokenRefreshed = (accessToken: string, user: UserInfoDto): void => {
  try {
    channel?.postMessage({ type: 'TOKEN_REFRESHED', accessToken, user })
  } catch {
    // Ignore postMessage errors
  }
}

export const getLastActivityTimestamp = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_ACTIVITY_KEY)
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  } catch {
    // Ignore storage errors
  }
  return Date.now()
}
