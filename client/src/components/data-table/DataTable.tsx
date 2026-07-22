import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingState'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  id: string
  header: string
  sortable?: boolean
  className?: string
  cell: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>
  data: T[]
  isLoading?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
  emptyTitle?: string
  emptyDescription?: string
  onReset?: () => void
  getRowId: (row: T) => string
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  sortBy,
  sortOrder,
  onSort,
  emptyTitle = 'No results',
  emptyDescription = 'Try adjusting filters or search criteria.',
  onReset,
  getRowId,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onReset ? 'Reset filters' : undefined}
        onAction={onReset}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card-solid/90 shadow-sm">
      <div className="max-h-[min(70vh,760px)] overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
            <tr className="border-b border-border">
              {columns.map((column) => {
                const isActive = sortBy === column.id
                return (
                  <th
                    key={column.id}
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                      column.className,
                    )}
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                        onClick={() => onSort(column.id)}
                      >
                        {column.header}
                        {isActive ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-b border-border/70 transition-colors hover:bg-teal-50/40"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn('px-4 py-3 align-middle', column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        {data.length} rows on this page
      </div>
    </div>
  )
}
