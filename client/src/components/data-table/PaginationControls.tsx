import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { PAGE_SIZE_OPTIONS } from '@/constants/logs'
import type { ApiPagination } from '@/types/api'

interface PaginationControlsProps {
  pagination?: ApiPagination
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  isFetching?: boolean
}

export function PaginationControls({
  pagination,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isFetching = false,
}: PaginationControlsProps) {
  const page = pagination?.page ?? 1
  const totalPages = pagination?.totalPages ?? 0
  const total = pagination?.total ?? 0

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card-solid/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? 'No records'
          : `Showing page ${page} of ${totalPages} · ${total.toLocaleString()} total`}
        {isFetching ? ' · Updating…' : ''}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Rows per page"
          className="w-[120px]"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} / page
            </option>
          ))}
        </Select>

        <Button
          variant="outline"
          size="sm"
          disabled={!pagination?.hasPreviousPage}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!pagination?.hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
