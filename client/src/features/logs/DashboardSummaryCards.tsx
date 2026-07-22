import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react'

import { SummarySkeleton } from '@/components/common/LoadingState'
import type { DashboardSummary } from '@/types/logs'

interface DashboardSummaryCardsProps {
  summary?: DashboardSummary
  isLoading: boolean
}

export function DashboardSummaryCards({
  summary,
  isLoading,
}: DashboardSummaryCardsProps) {
  if (isLoading) {
    return <SummarySkeleton />
  }

  const critical =
    summary?.bySeverity.find((item) => item.severity === 'CRITICAL')?.count ?? 0
  const unresolved =
    summary?.byStatus.find((item) => item.status === 'Unresolved')?.count ?? 0

  const cards = [
    {
      label: 'Total Events',
      value: summary?.total ?? 0,
      icon: Shield,
      tone: 'text-teal-700 bg-teal-50',
    },
    {
      label: 'Critical Severity',
      value: critical,
      icon: AlertTriangle,
      tone: 'text-rose-700 bg-rose-50',
    },
    {
      label: 'Unresolved',
      value: unresolved,
      icon: CheckCircle2,
      tone: 'text-amber-700 bg-amber-50',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {card.value.toLocaleString()}
              </p>
            </div>
            <div className={`rounded-md p-2 ${card.tone}`}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
