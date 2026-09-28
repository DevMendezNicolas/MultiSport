export interface UserSession {
  id: string
  email: string
  role: string
}

export interface LoginPayload {
  email: string
  password: string
}
