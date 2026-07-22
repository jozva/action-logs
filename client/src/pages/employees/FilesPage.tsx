import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { ApiRequestError } from '@/api/httpClient'
import { downloadFile, fetchFiles, uploadFile } from '@/api/workspaceApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TableSkeleton } from '@/components/common/LoadingState'
import { useAuthStore } from '@/stores/authStore'

export default function FilesPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  const [fileName, setFileName] = useState('incident-report.pdf')

  const filesQuery = useQuery({
    queryKey: ['files'],
    queryFn: fetchFiles,
  })

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: async () => {
      toast.success('File uploaded and audited')
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Upload failed')
    },
  })

  const downloadMutation = useMutation({
    mutationFn: downloadFile,
    onSuccess: async (result) => {
      toast.success(`Download authorized for ${result.file.name}`)
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Download failed')
    },
  })

  if (filesQuery.isLoading) return <TableSkeleton />

  return (
    <div className="space-y-6">
      {hasPermission('file:upload') ? (
        <section className="rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Upload file</h3>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="file-name">File name</Label>
              <Input
                id="file-name"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
              />
            </div>
            <Button
              disabled={uploadMutation.isPending || !fileName.trim()}
              onClick={() =>
                uploadMutation.mutate({
                  name: fileName.trim(),
                  mimeType: 'application/pdf',
                  sizeBytes: 2048,
                })
              }
            >
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card-solid/90 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filesQuery.data ?? []).map((file) => (
              <tr key={file.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{file.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{file.ownerEmail}</td>
                <td className="px-4 py-3">{file.sizeBytes} B</td>
                <td className="px-4 py-3">
                  {hasPermission('file:download') ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadMutation.mutate(file.id)}
                    >
                      Download
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
