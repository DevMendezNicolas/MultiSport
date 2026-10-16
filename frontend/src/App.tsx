import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { LandingPage } from '@/features/landing'
import { LoginPage, RegisterPage, VerifyEmailPage, OnboardingWizardPage, AuthProvider } from '@/features/auth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DashboardOverview } from '@/features/admin'
import { CourtsManagementPage, EditCourtPage } from '@/features/courts'
import { BookingsManagementPage } from '@/features/bookings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Rutas Protegidas del Panel de Administración */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin/onboarding" element={<OnboardingWizardPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="bookings" element={<BookingsManagementPage />} />
                <Route path="courts" element={<CourtsManagementPage />} />
                <Route path="courts/:id/edit" element={<EditCourtPage />} />
                <Route path="tournaments" element={<DashboardOverview />} />
                <Route path="finances" element={<DashboardOverview />} />
                <Route path="settings" element={<DashboardOverview />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
