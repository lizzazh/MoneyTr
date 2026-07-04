import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/auth-context'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { firebaseUser, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-milk">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-chocolate/10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-chocolate/30 border-t-chocolate rounded-full animate-spin" />
          </div>
          <p className="text-sm text-warm-gray">Завантаження...</p>
        </div>
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/auth" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function GuestRoute({ children }: ProtectedRouteProps) {
  const { firebaseUser, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-milk">
        <div className="w-5 h-5 border-2 border-chocolate/30 border-t-chocolate rounded-full animate-spin" />
      </div>
    )
  }

  if (firebaseUser) {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
