import api, { setAccessToken } from '@/lib/axios'
import type {
  AuthResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  ProblemDetails,
  RegisterComplexPayload,
  ResetPasswordPayload,
} from '../types'

export const authApi = {
  async registerComplex(payload: RegisterComplexPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register-complex', payload)
    setAccessToken(data.accessToken)
    return data
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    setAccessToken(data.accessToken)
    return data
  },

  async refreshToken(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh')
    setAccessToken(data.accessToken)
    return data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ProblemDetails> {
    const { data } = await api.post<ProblemDetails>('/auth/forgot-password', payload)
    return data
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ProblemDetails> {
    const { data } = await api.post<ProblemDetails>('/auth/reset-password', payload)
    return data
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.post('/auth/change-password', payload)
  },
}
