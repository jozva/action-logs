import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { ApiRequestError } from '@/api/httpClient'
import { TableSkeleton } from '@/components/common/LoadingState'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { useLogDetailQuery } from '@/hooks/useLogsQuery'
import {
  formatLabel,
  severityBadgeVariant,
  statusBadgeVariant,
} from '@/lib/logPresentation'
import { cn } from '@/lib/utils'

export default function LogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const query = useLogDetailQuery(id)

  if (query.isLoading) {
    return <TableSkeleton rows={6} />
  }

  if (query.isError || !query.data) {
    const message =
      query.error instanceof ApiRequestError
        ? query.error.message
        : 'Security log not found'
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      </div>
    )
  }

  const log = query.data

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackLink />

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Event Detail</h2>
        <p className="font-mono text-xs text-muted-foreground">{log.id}</p>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card-solid/90 p-5 shadow-sm md:grid-cols-2">
        <DetailItem label="Timestamp" value={format(new Date(log.timestamp), 'PPpp')} />
        <DetailItem label="Region" value={log.region} mono />
        <DetailItem label="Actor" value={`${log.actor.name} (${log.actor.email})`} />
        <DetailItem label="Role" value={formatLabel(log.actor.role)} />
        <DetailItem label="Action" value={formatLabel(log.action)} />
        <DetailItem
          label="Resource"
          value={`${log.resource.name} · ${formatLabel(log.resource.type)} · ${log.resource.id}`}
        />
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Severity
          </p>
          <Badge variant={severityBadgeVariant(log.severity)}>
            {formatLabel(log.severity)}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <Badge variant={statusBadgeVariant(log.status)}>
            {formatLabel(log.status)}
          </Badge>
        </div>
        <DetailItem label="IP Address" value={log.ip} mono />
        <DetailItem label="User Agent" value={log.userAgent || '—'} />
      </section>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-fit')}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to dashboard
    </Link>
  )
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={mono ? 'font-mono text-sm' : 'text-sm font-medium'}>{value}</p>
    </div>
  )
}
