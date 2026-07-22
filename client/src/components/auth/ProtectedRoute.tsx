import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { Permission } from '@/types/auth'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  permission?: Permission
}

export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const location = useLocation()
  const { token, user, hasPermission } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/employees" replace />
  }

  return <Outlet />
}
