import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiRequestError } from '@/api/httpClient'
import { fetchPolicies, updatePolicy } from '@/api/workspaceApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/common/LoadingState'
import { useAuthStore } from '@/stores/authStore'

export default function PoliciesPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()

  const policiesQuery = useQuery({
    queryKey: ['policies'],
    queryFn: fetchPolicies,
  })

  const mutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updatePolicy(id, enabled),
    onSuccess: async () => {
      toast.success('Policy updated and audited')
      await queryClient.invalidateQueries({ queryKey: ['policies'] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Update failed')
    },
  })

  if (policiesQuery.isLoading) return <TableSkeleton />

  return (
    <div className="space-y-3">
      {(policiesQuery.data ?? []).map((policy) => (
        <article
          key={policy.id}
          className="flex flex-col gap-3 rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{policy.name}</h3>
              <Badge variant={policy.enabled ? 'success' : 'muted'}>
                {policy.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{policy.description}</p>
          </div>
          {hasPermission('policy:update') ? (
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate({ id: policy.id, enabled: !policy.enabled })
              }
            >
              {policy.enabled ? 'Disable' : 'Enable'}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Read only for your role</p>
          )}
        </article>
      ))}
    </div>
  )
}
