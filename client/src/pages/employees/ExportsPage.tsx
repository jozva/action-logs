import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { ApiRequestError } from '@/api/httpClient'
import { createExport, type ExportResult } from '@/api/workspaceApi'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export default function ExportsPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  const [latest, setLatest] = useState<ExportResult | null>(null)

  const mutation = useMutation({
    mutationFn: createExport,
    onSuccess: async (result) => {
      setLatest(result)
      toast.success('Export created and audited')
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Export failed')
    },
  })

  if (!hasPermission('export:create')) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Your role cannot create exports.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card-solid/90 p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Export security data</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Creates a server-side export job and writes an `EXPORT_DATA` audit event.
        </p>
        <Button
          className="mt-4"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Creating export…' : 'Create export'}
        </Button>
      </section>

      {latest ? (
        <section className="rounded-lg border border-teal-200 bg-teal-50/70 p-4 text-sm">
          <p className="font-semibold">Latest export</p>
          <p className="mt-2 font-mono text-xs">ID: {latest.exportId}</p>
          <p>Records: {latest.recordCount.toLocaleString()}</p>
          <p>Requested by: {latest.requestedBy}</p>
        </section>
      ) : null}
    </div>
  )
}
