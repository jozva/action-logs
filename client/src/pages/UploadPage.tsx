import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileJson2, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/httpClient'
import { uploadLogs } from '@/api/logsApi'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { downloadJson, formatBytes } from '@/lib/download'
import { cn } from '@/lib/utils'
import type { BulkUploadResult } from '@/types/logs'

const uploadFormSchema = z.object({
  payload: z.string().min(2, 'Paste JSON or choose a .json file'),
})

type UploadFormValues = z.infer<typeof uploadFormSchema>

function parseUploadPayload(raw: string): unknown[] {
  const parsed: unknown = JSON.parse(raw)

  if (Array.isArray(parsed)) {
    return parsed
  }

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'records' in parsed &&
    Array.isArray((parsed as { records: unknown }).records)
  ) {
    return (parsed as { records: unknown[] }).records
  }

  throw new Error('JSON must be an array or an object with a records array')
}

const SAMPLE_RECORDS = {
  records: [
    {
      actor: 'priya.nair@company.com',
      role: 'admin',
      action: 'DELETE_USER',
      resource: '/api/users/334',
      resourceType: 'USER',
      ipAddress: '192.168.1.45',
      region: 'ap-south-1',
      severity: 'HIGH',
      status: 'Unresolved',
      timestamp: '2025-06-14T08:32:11Z',
    },
    {
      actor: 'ops.bot@company.com',
      role: 'service',
      action: 'UPLOAD_FILE',
      resource: '/api/files/report-q2.pdf',
      resourceType: 'FILE',
      ipAddress: '10.0.4.22',
      region: 'us-east-1',
      severity: 'INFO',
      status: 'Resolved',
      timestamp: '2025-06-14T09:10:00Z',
    },
  ],
}

export default function UploadPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<BulkUploadResult | null>(null)
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      payload: '',
    },
  })

  const mutation = useMutation({
    mutationFn: uploadLogs,
    onSuccess: async (response) => {
      setResult(response.data)
      await queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success(response.message)
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        const details = error.details as BulkUploadResult | undefined
        if (details?.failures) {
          setResult(details)
        }
        toast.error(error.message)
        return
      }
      toast.error('Upload failed')
    },
  })

  const sampleHint = useMemo(() => JSON.stringify(SAMPLE_RECORDS, null, 2), [])

  const loadJsonText = (text: string, sourceName?: string) => {
    try {
      const records = parseUploadPayload(text)
      form.setValue('payload', JSON.stringify({ records }, null, 2), {
        shouldValidate: true,
      })
      form.clearErrors('payload')
      if (sourceName) {
        setFileMeta({ name: sourceName, size: new Blob([text]).size })
      }
      toast.success(`Loaded ${records.length.toLocaleString()} record(s)`)
    } catch {
      form.setError('payload', {
        message: 'Invalid JSON. Provide an array or { "records": [...] }',
      })
    }
  }

  const onFileChosen = async (file: File | null) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      toast.error('Please choose a .json file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('JSON file must be 5 MB or smaller')
      return
    }
    const text = await file.text()
    loadJsonText(text, file.name)
  }

  const onSubmit = form.handleSubmit((values) => {
    try {
      const records = parseUploadPayload(values.payload)
      if (records.length === 0) {
        form.setError('payload', { message: 'records array is empty' })
        return
      }
      if (records.length > 10_000) {
        form.setError('payload', {
          message: 'Maximum 10,000 records allowed per upload',
        })
        return
      }
      setResult(null)
      mutation.mutate(records)
    } catch {
      form.setError('payload', {
        message: 'Invalid JSON. Provide an array or { "records": [...] }',
      })
    }
  })

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Bulk Upload</h2>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Upload up to 10,000 security log records as JSON. Drop a file or paste a payload.
          Every object is validated on the server; invalid rows are reported without failing
          the whole batch when at least one row is valid.
        </p>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm">
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors',
            dragOver ? 'border-teal-600 bg-teal-50/70' : 'border-border bg-slate-50/70',
          )}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            void onFileChosen(event.dataTransfer.files?.[0] ?? null)
          }}
        >
          <Upload className="mb-3 h-8 w-8 text-teal-800" />
          <p className="text-sm font-medium">Drop a JSON file here</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Expected shape: {'{ "records": [ ... ] }'} or a bare array
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Choose JSON file
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => form.setValue('payload', sampleHint, { shouldValidate: true })}
            >
              <FileJson2 className="h-4 w-4" />
              Insert sample
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => downloadJson(SAMPLE_RECORDS, 'sample-security-logs.json')}
            >
              Download sample JSON
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void onFileChosen(event.target.files?.[0] ?? null)}
          />
          {fileMeta ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Loaded {fileMeta.name} · {formatBytes(fileMeta.size)}
            </p>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payload">JSON payload</Label>
            <textarea
              id="payload"
              className="min-h-[280px] w-full rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-xs leading-relaxed text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder='{ "records": [{ "actor": "user@company.com", "role": "admin", ... }] }'
              {...form.register('payload')}
            />
            {form.formState.errors.payload ? (
              <p className="text-sm text-danger">{form.formState.errors.payload.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Required fields: actor (email), role, action, resource, resourceType, ipAddress,
                region, severity, status, timestamp
              </p>
            )}
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            <Upload className="h-4 w-4" />
            {mutation.isPending ? 'Uploading…' : 'Upload records'}
          </Button>
        </form>
      </section>

      {result ? (
        <section className="space-y-3 rounded-lg border border-border bg-card-solid/90 p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Upload report</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Received" value={result.totalReceived} />
            <Stat label="Valid" value={result.validCount} />
            <Stat label="Invalid" value={result.invalidCount} />
            <Stat label="Inserted" value={result.insertedCount} />
          </div>

          {result.failures.length > 0 ? (
            <div className="max-h-72 overflow-auto rounded-md border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-3 py-2">Index</th>
                    <th className="px-3 py-2">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {result.failures.map((failure) => (
                    <tr key={failure.index} className="border-t border-border">
                      <td className="px-3 py-2 font-mono text-xs">{failure.index}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {failure.errors
                          .map((error) => `${error.path}: ${error.message}`)
                          .join('; ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-emerald-700">All records validated and inserted.</p>
          )}
        </section>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value.toLocaleString()}</p>
    </div>
  )
}
