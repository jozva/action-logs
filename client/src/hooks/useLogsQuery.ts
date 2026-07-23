import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchDashboardSummary, fetchLogById, fetchLogs } from '@/api/logsApi'
import { SEARCH_DEBOUNCE_MS } from '@/constants/logs'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { isDateRangeValid } from '@/lib/dateRange'
import { useLogFiltersStore } from '@/stores/logFiltersStore'

export function useLogsQuery() {
  const filters = useLogFiltersStore()
  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS)
  const dateRangeOk = isDateRangeValid(filters.dateFrom, filters.dateTo)

  const queryFilters = {
    search: debouncedSearch,
    role: filters.role,
    severity: filters.severity,
    status: filters.status,
    action: filters.action,
    resourceType: filters.resourceType,
    region: filters.region,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    page: filters.page,
    pageSize: filters.pageSize,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  }

  return useQuery({
    queryKey: ['logs', queryFilters],
    queryFn: () => fetchLogs(queryFilters),
    placeholderData: keepPreviousData,
    enabled: dateRangeOk,
  })
}

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: ['logs', 'summary'],
    queryFn: fetchDashboardSummary,
  })
}

export function useLogDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['logs', id],
    queryFn: () => fetchLogById(id as string),
    enabled: Boolean(id),
  })
}
