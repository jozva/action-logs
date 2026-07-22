import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TableSkeleton } from '@/components/common/LoadingState'
import { AppShell } from '@/layouts/AppShell'
import { EmployeeWorkspaceLayout } from '@/layouts/EmployeeWorkspaceLayout'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const UploadPage = lazy(() => import('@/pages/UploadPage'))
const LogDetailPage = lazy(() => import('@/pages/LogDetailPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const EmployeeOverviewPage = lazy(() => import('@/pages/employees/EmployeeOverviewPage'))
const UsersPage = lazy(() => import('@/pages/employees/UsersPage'))
const FilesPage = lazy(() => import('@/pages/employees/FilesPage'))
const ExportsPage = lazy(() => import('@/pages/employees/ExportsPage'))
const PoliciesPage = lazy(() => import('@/pages/employees/PoliciesPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function RouteFallback() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <TableSkeleton />
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="logs/:id" element={<LogDetailPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="employees" element={<EmployeeWorkspaceLayout />}>
                <Route index element={<EmployeeOverviewPage />} />
                <Route element={<ProtectedRoute permission="user:read" />}>
                  <Route path="users" element={<UsersPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="file:read" />}>
                  <Route path="files" element={<FilesPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="export:create" />}>
                  <Route path="exports" element={<ExportsPage />} />
                </Route>
                <Route element={<ProtectedRoute permission="policy:read" />}>
                  <Route path="policies" element={<PoliciesPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
