import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { TableSkeleton } from '@/components/common/LoadingState'
import { AppShell } from '@/layouts/AppShell'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const UploadPage = lazy(() => import('@/pages/UploadPage'))
const LogDetailPage = lazy(() => import('@/pages/LogDetailPage'))
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
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="logs/:id" element={<LogDetailPage />} />
            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
