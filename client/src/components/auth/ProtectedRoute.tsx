import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { fetchMe } from '@/api/authApi'
import { TableSkeleton } from '@/components/common/LoadingState'
import type { Permission } from '@/types/auth'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  permission?: Permission
  verifySession?: boolean
}

export function ProtectedRoute({
  permission,
  verifySession = !permission,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { token, user, hasPermission, setSession, clearSession } = useAuthStore()
  const [checking, setChecking] = useState(Boolean(verifySession && token))

  useEffect(() => {
    if (!verifySession) {
      setChecking(false)
      return
    }

    let cancelled = false

    async function revalidate() {
      if (!token) {
        setChecking(false)
        return
      }

      setChecking(true)
      try {
        const me = await fetchMe()
        if (!cancelled) {
          setSession(token, me)
        }
      } catch {
        if (!cancelled) {
          clearSession()
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    void revalidate()
    return () => {
      cancelled = true
    }
  }, [verifySession, token, setSession, clearSession])

  if (checking) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <TableSkeleton />
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/employees" replace />
  }

  return <Outlet />
}
