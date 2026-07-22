import { format } from 'date-fns'
import { Link } from 'react-router-dom'

import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { Badge } from '@/components/ui/badge'
import type { LogSortField } from '@/constants/logs'
import {
  formatLabel,
  severityBadgeVariant,
  statusBadgeVariant,
} from '@/lib/logPresentation'
import { useLogFiltersStore } from '@/stores/logFiltersStore'
import type { SecurityLog } from '@/types/logs'

interface LogsDataTableProps {
  data: SecurityLog[]
  isLoading: boolean
}

export function LogsDataTable({ data, isLoading }: LogsDataTableProps) {
  const { sortBy, sortOrder, setSort, resetFilters } = useLogFiltersStore()

  const columns: Array<DataTableColumn<SecurityLog>> = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      className: 'min-w-[170px]',
      cell: (row) => (
        <span className="font-mono text-xs">
          {format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm:ss')}
        </span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      sortable: true,
      className: 'min-w-[200px]',
      cell: (row) => <span className="font-medium">{row.actor || '—'}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => <Badge>{formatLabel(row.role)}</Badge>,
    },
    {
      id: 'action',
      header: 'Action',
      sortable: true,
      cell: (row) => <span className="font-medium">{formatLabel(row.action)}</span>,
    },
    {
      id: 'resource',
      header: 'Resource',
      className: 'min-w-[180px]',
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-medium">{row.resource || '—'}</p>
          <p className="text-xs text-muted-foreground">{row.resourceType || '—'}</p>
        </div>
      ),
    },
    {
      id: 'severity',
      header: 'Severity',
      sortable: true,
      cell: (row) => (
        <Badge variant={severityBadgeVariant(row.severity)}>
          {row.severity || '—'}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={statusBadgeVariant(row.status)}>
          {row.status || '—'}
        </Badge>
      ),
    },
    {
      id: 'ipAddress',
      header: 'IP',
      cell: (row) => (
        <span className="font-mono text-xs">{row.ipAddress || '—'}</span>
      ),
    },
    {
      id: 'region',
      header: 'Region',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs">{row.region || '—'}</span>
      ),
    },
    {
      id: 'details',
      header: '',
      cell: (row) => (
        <Link
          to={`/logs/${row.id}`}
          className="text-xs font-medium text-teal-700 hover:underline"
        >
          View
        </Link>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={(columnId) => setSort(columnId as LogSortField)}
      emptyTitle="No security logs found"
      emptyDescription="Upload sample data or widen your filters. All filtering happens on the server."
      onReset={resetFilters}
      getRowId={(row) => row.id}
    />
  )
}
