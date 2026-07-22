import { httpClient } from '@/api/httpClient'
import type { ApiSuccessResponse } from '@/types/api'
import type {
  BulkUploadResult,
  DashboardSummary,
  LogFilters,
  SecurityLog,
} from '@/types/logs'

function toQueryParams(filters: LogFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: filters.page,
    pageSize: filters.pageSize,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  }

  if (filters.search.trim()) params.search = filters.search.trim()
  if (filters.role) params.role = filters.role
  if (filters.severity) params.severity = filters.severity
  if (filters.status) params.status = filters.status
  if (filters.action) params.action = filters.action
  if (filters.resourceType) params.resourceType = filters.resourceType
  if (filters.region.trim()) params.region = filters.region.trim()
  if (filters.dateFrom) {
    params.dateFrom = new Date(filters.dateFrom).toISOString()
  }
  if (filters.dateTo) {
    params.dateTo = new Date(filters.dateTo).toISOString()
  }

  return params
}

export async function fetchLogs(filters: LogFilters) {
  const response = await httpClient.get<ApiSuccessResponse<SecurityLog[]>>('/logs', {
    params: toQueryParams(filters),
  })
  return response.data
}

export async function fetchLogById(id: string) {
  const response = await httpClient.get<ApiSuccessResponse<SecurityLog>>(`/logs/${id}`)
  return response.data.data
}

export async function fetchDashboardSummary() {
  const response =
    await httpClient.get<ApiSuccessResponse<DashboardSummary>>('/logs/summary')
  return response.data.data
}

export async function uploadLogs(records: unknown[]) {
  const response = await httpClient.post<ApiSuccessResponse<BulkUploadResult>>(
    '/logs/upload',
    { records },
  )
  return response.data
}
