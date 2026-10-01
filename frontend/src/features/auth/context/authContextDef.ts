import { createContext } from 'react'
import type { AuthResponse, LoginPayload, RegisterComplexPayload, UserInfoDto } from '../types'

export interface AuthContextType {
  user: UserInfoDto | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<AuthResponse>
  register: (payload: RegisterComplexPayload) => Promise<AuthResponse>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
