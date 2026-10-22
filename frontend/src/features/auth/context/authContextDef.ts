import { createContext } from 'react'
import type { AuthResponse, LoginPayload, RegisterComplexPayload, RegisterSuccessResponse, UserInfoDto } from '../types'

export interface AuthContextType {
  user: UserInfoDto | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<AuthResponse>
  register: (payload: RegisterComplexPayload) => Promise<RegisterSuccessResponse>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  handleSessionExpired: (reason?: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
