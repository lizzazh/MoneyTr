import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/shared/auth-context'
import { Toaster } from 'sonner'
import { DashboardPage } from '@/pages/DashboardPage'
import { ConnectionDetailsPage } from '@/pages/ConnectionDetailsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { AuthPage } from '@/features/auth/AuthPage'
import { ProtectedRoute, GuestRoute } from './guards'

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Guest routes */}
          <Route element={<GuestRoute />}>
            <Route path="/auth" element={<AuthPage />} />
          </Route>

          {/* Protected app routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/connections/:connectionId" element={<ConnectionDetailsPage />} />
            <Route path="/connections/:connectionId/transactions" element={<TransactionsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#FAF7F2',
            color: '#5C3D2E',
            border: '1px solid #E8DCC8',
            borderRadius: '16px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      />
    </AuthProvider>
  )
}
