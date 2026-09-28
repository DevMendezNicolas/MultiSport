import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach bearer token if present in session memory
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: global error mapping (RFC 7807 ProblemDetails)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status

      if (status === 401) {
        sessionStorage.removeItem('access_token')
        // Optional: redirect to login if not already on public route
      }

      if (status === 409) {
        // ProblemDetails conflict (e.g., booking slot overlap)
        console.warn('Conflict detected:', error.response.data?.detail || error.response.data?.title)
      }
    }
    return Promise.reject(error)
  }
)

export default api
