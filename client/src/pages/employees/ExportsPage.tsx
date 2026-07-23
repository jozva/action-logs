import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, FileJson2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ApiRequestError } from '@/api/httpClient'
import { downloadExportJson } from '@/api/workspaceApi'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export default function ExportsPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  const [latestFilename, setLatestFilename] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: downloadExportJson,
    onSuccess: async (result) => {
      setLatestFilename(result.filename)
      toast.success(`Downloaded ${result.filename}`)
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Export failed')
    },
  })

  if (!hasPermission('export:create')) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Your role cannot export logs.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card-solid/90 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-800">
            <FileJson2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Export security logs</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Downloads the current audit log dataset as a JSON file and writes an
              `EXPORT_DATA` event to the audit trail.
            </p>
          </div>
        </div>

        <Button
          className="mt-5"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          <Download className="h-4 w-4" />
          {mutation.isPending ? 'Preparing JSON…' : 'Export logs (JSON)'}
        </Button>
      </section>

      {latestFilename ? (
        <section className="rounded-lg border border-teal-200 bg-teal-50/70 p-4 text-sm">
          <p className="font-semibold">Latest download</p>
          <p className="mt-1 font-mono text-xs">{latestFilename}</p>
          <p className="mt-2 text-muted-foreground">
            Check your browser downloads folder for the JSON file.
          </p>
        </section>
      ) : null}
    </div>
  )
}
