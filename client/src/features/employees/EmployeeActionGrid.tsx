import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { ApiRequestError } from '@/api/httpClient'
import { executeAction, fetchActionCatalog } from '@/api/actionsApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FALLBACK_ACTION_POLICIES } from '@/constants/actions'
import type { ActionType } from '@/constants/logs'
import {
  formatLabel,
  severityBadgeVariant,
  statusBadgeVariant,
} from '@/lib/logPresentation'
import { useEmployeeStore } from '@/stores/employeeStore'
import type { ActionCatalogItem, ExecuteActionResult } from '@/types/actions'

export function EmployeeActionGrid() {
  const queryClient = useQueryClient()
  const { actor, role, region } = useEmployeeStore()
  const [resourceId, setResourceId] = useState('334')
  const [note, setNote] = useState('')
  const [lastResult, setLastResult] = useState<ExecuteActionResult | null>(null)
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null)

  const catalogQuery = useQuery({
    queryKey: ['actions', 'catalog'],
    queryFn: fetchActionCatalog,
  })

  const mutation = useMutation({
    mutationFn: executeAction,
    onSuccess: async (response) => {
      setLastResult(response.data)
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success(response.message)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiRequestError ? error.message : 'Action failed'
      toast.error(message)
    },
    onSettled: () => {
      setPendingAction(null)
    },
  })

  const actions = catalogQuery.data?.length
    ? catalogQuery.data
    : FALLBACK_ACTION_POLICIES

  const runAction = (action: ActionType) => {
    if (!actor.trim() || !actor.includes('@')) {
      toast.error('Enter a valid employee email before running actions')
      return
    }

    setPendingAction(action)
    mutation.mutate({
      actor: actor.trim(),
      role,
      region,
      action,
      resourceId: resourceId.trim() || undefined,
      note: note.trim() || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="resource-id">Target resource id</Label>
          <Input
            id="resource-id"
            value={resourceId}
            onChange={(event) => setResourceId(event.target.value)}
            placeholder="334"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="action-note">Optional note</Label>
          <Input
            id="action-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason for this action"
            maxLength={280}
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((item) => (
          <ActionCard
            key={item.action}
            item={item}
            isPending={mutation.isPending && pendingAction === item.action}
            disabled={mutation.isPending}
            onRun={() => runAction(item.action)}
          />
        ))}
      </section>

      {lastResult ? (
        <section className="space-y-3 rounded-lg border border-teal-200 bg-teal-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">
              Last action: {formatLabel(lastResult.action)}
            </h3>
            <Link
              to={`/logs/${lastResult.auditLog.id}`}
              className="text-sm font-medium text-teal-800 hover:underline"
            >
              View audit log
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{lastResult.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant={severityBadgeVariant(lastResult.auditLog.severity)}>
              {lastResult.auditLog.severity}
            </Badge>
            <Badge variant={statusBadgeVariant(lastResult.auditLog.status)}>
              {lastResult.auditLog.status}
            </Badge>
            <Badge>{lastResult.auditLog.resourceType}</Badge>
            <span className="font-mono text-muted-foreground">
              {lastResult.auditLog.resource}
            </span>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function ActionCard({
  item,
  isPending,
  disabled,
  onRun,
}: {
  item: ActionCatalogItem
  isPending: boolean
  disabled: boolean
  onRun: () => void
}) {
  return (
    <article className="flex h-full flex-col justify-between gap-4 rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-wide">
            {formatLabel(item.action)}
          </h3>
          <Badge variant={severityBadgeVariant(item.severity)}>{item.severity}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="muted">{item.resourceType}</Badge>
          <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
        </div>
      </div>

      <Button onClick={onRun} disabled={disabled} className="w-full">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {isPending ? 'Running…' : 'Run action'}
      </Button>
    </article>
  )
}
