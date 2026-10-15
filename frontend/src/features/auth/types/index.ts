export interface UserInfoDto {
  id: string
  complexId: string
  complexName: string
  email: string
  role: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserInfoDto
}

export interface RegisterComplexPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegisterSuccessResponse {
  email: string
  message: string
}

export interface VerifyEmailPayload {
  token: string
}

export interface ResendVerificationPayload {
  email: string
}

export interface UpdateComplexProfilePayload {
  taxId?: string | null
  cbuAlias?: string | null
  address?: string | null
  phone?: string | null
  city?: string | null
  logoUrl?: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
}
