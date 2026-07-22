import { PaginationControls } from '@/components/data-table/PaginationControls'
import { DashboardSummaryCards } from '@/features/logs/DashboardSummaryCards'
import { LogFiltersBar } from '@/features/logs/LogFiltersBar'
import { LogsDataTable } from '@/features/logs/LogsDataTable'
import { useDashboardSummaryQuery, useLogsQuery } from '@/hooks/useLogsQuery'
import { ApiRequestError } from '@/api/httpClient'
import { useLogFiltersStore } from '@/stores/logFiltersStore'

export default function DashboardPage() {
  const { pageSize, setPage, setPageSize } = useLogFiltersStore()
  const logsQuery = useLogsQuery()
  const summaryQuery = useDashboardSummaryQuery()

  const errorMessage =
    logsQuery.error instanceof ApiRequestError
      ? logsQuery.error.message
      : logsQuery.isError
        ? 'Failed to load security logs'
        : null

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Audit Log Dashboard
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Search, filter, sort, and paginate security events. Every query is executed
          on the API — the browser only renders the current page.
        </p>
      </section>

      <DashboardSummaryCards
        summary={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
      />

      <LogFiltersBar />

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <LogsDataTable
        data={logsQuery.data?.data ?? []}
        isLoading={logsQuery.isLoading}
      />

      <PaginationControls
        pagination={logsQuery.data?.pagination}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isFetching={logsQuery.isFetching && !logsQuery.isLoading}
      />
    </div>
  )
}
