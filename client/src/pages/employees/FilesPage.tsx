import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileUp, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { ApiRequestError } from '@/api/httpClient'
import { downloadFile, fetchFiles, uploadFile } from '@/api/workspaceApi'
import { TableSkeleton } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { formatBytes, readFileAsBase64 } from '@/lib/download'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const MAX_BYTES = 2_000_000

export default function FilesPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selected, setSelected] = useState<File | null>(null)

  const filesQuery = useQuery({
    queryKey: ['files'],
    queryFn: fetchFiles,
  })

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: async (file) => {
      toast.success(`Uploaded ${file.name}`)
      setSelected(null)
      if (inputRef.current) inputRef.current.value = ''
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Upload failed')
    },
  })

  const downloadMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => downloadFile(id, name),
    onSuccess: async (result) => {
      toast.success(`Downloaded ${result.filename}`)
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiRequestError ? error.message : 'Download failed')
    },
  })

  const chooseFile = (file: File | null) => {
    if (!file) return
    if (file.size > MAX_BYTES) {
      toast.error(`File must be ${formatBytes(MAX_BYTES)} or smaller`)
      return
    }
    setSelected(file)
  }

  const handleUpload = async () => {
    if (!selected) return
    const contentBase64 = await readFileAsBase64(selected)
    uploadMutation.mutate({
      name: selected.name,
      mimeType: selected.type || 'application/octet-stream',
      sizeBytes: selected.size,
      contentBase64,
    })
  }

  if (filesQuery.isLoading) return <TableSkeleton />

  return (
    <div className="space-y-6">
      {hasPermission('file:upload') ? (
        <section className="space-y-4 rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Upload file</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload documents to Cloudinary (max {formatBytes(MAX_BYTES)}). Uploads and
              downloads are audited. Older stub files without cloud storage must be
              re-uploaded once.
            </p>
          </div>

          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors',
              dragOver ? 'border-teal-600 bg-teal-50/70' : 'border-border bg-slate-50/60',
            )}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              chooseFile(event.dataTransfer.files?.[0] ?? null)
            }}
          >
            <FileUp className="mb-3 h-8 w-8 text-teal-800" />
            <p className="text-sm font-medium">Drag and drop a file here</p>
            <p className="mt-1 text-xs text-muted-foreground">or choose from your computer</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                Choose file
              </Button>
              {selected ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelected(null)
                    if (inputRef.current) inputRef.current.value = ''
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {selected ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.type || 'unknown type'} · {formatBytes(selected.size)}
                </p>
              </div>
              <Button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={() => void handleUpload()}
              >
                <Upload className="h-4 w-4" />
                {uploadMutation.isPending ? 'Uploading…' : 'Upload file'}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card-solid/90 shadow-sm">
        {(filesQuery.data ?? []).length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No files uploaded yet.
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(filesQuery.data ?? []).map((file) => (
                <tr key={file.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{file.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{file.mimeType}</td>
                  <td className="px-4 py-3 font-mono text-xs">{file.ownerEmail}</td>
                  <td className="px-4 py-3">{formatBytes(file.sizeBytes)}</td>
                  <td className="px-4 py-3">
                    {hasPermission('file:download') ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadMutation.isPending}
                        onClick={() =>
                          downloadMutation.mutate({ id: file.id, name: file.name })
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
