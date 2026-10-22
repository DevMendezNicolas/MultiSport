import api, { setAccessToken } from '@/lib/axios'
import type {
  AuthResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  ProblemDetails,
  RegisterComplexPayload,
  RegisterSuccessResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  UpdateComplexProfilePayload,
  VerifyEmailPayload,
} from '../types'

export const authApi = {
  async registerComplex(payload: RegisterComplexPayload): Promise<RegisterSuccessResponse> {
    const { data } = await api.post<RegisterSuccessResponse>('/auth/register-complex', payload)
    return data
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<ProblemDetails> {
    const { data } = await api.post<ProblemDetails>('/auth/verify-email', payload)
    return data
  },

  async resendVerification(payload: ResendVerificationPayload): Promise<ProblemDetails> {
    const { data } = await api.post<ProblemDetails>('/auth/resend-verification', payload)
    return data
  },

  async updateComplexProfile(payload: UpdateComplexProfilePayload): Promise<void> {
    await api.put('/auth/complex-profile', payload)
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
