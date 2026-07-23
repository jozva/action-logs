import { httpClient } from '@/api/httpClient'
import {
  filenameFromContentDisposition,
  triggerBrowserDownload,
} from '@/lib/download'
import type { ApiSuccessResponse } from '@/types/api'

export interface FileAsset {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  ownerEmail: string
  storageKey: string
  cloudinaryUrl?: string
  createdAt: string
}

export interface PolicyItem {
  id: string
  key: string
  name: string
  description: string
  enabled: boolean
  updatedBy?: string
}

export interface ExportResult {
  exportId: string
  format: string
  recordCount: number
  requestedBy: string
  createdAt: string
  truncated?: boolean
  filename?: string
  records?: unknown[]
}

export async function fetchFiles() {
  const response = await httpClient.get<ApiSuccessResponse<FileAsset[]>>('/files')
  return response.data.data
}

export async function uploadFile(payload: {
  name: string
  mimeType: string
  sizeBytes: number
  contentBase64: string
}) {
  const response = await httpClient.post<ApiSuccessResponse<FileAsset>>('/files', payload)
  return response.data.data
}

export async function downloadFile(id: string, fallbackName = 'download.bin') {
  const response = await httpClient.get<Blob>(`/files/${id}/download`, {
    responseType: 'blob',
  })
  const filename = filenameFromContentDisposition(
    response.headers['content-disposition'] as string | undefined,
    fallbackName,
  )
  triggerBrowserDownload(response.data, filename)
  return { filename }
}

export async function createExport() {
  const response =
    await httpClient.post<ApiSuccessResponse<ExportResult>>('/exports')
  return response.data.data
}

export async function downloadExportJson() {
  const response = await httpClient.get<Blob>('/exports/download', {
    responseType: 'blob',
  })
  const filename = filenameFromContentDisposition(
    response.headers['content-disposition'] as string | undefined,
    `gidy-security-logs-${new Date().toISOString().slice(0, 10)}.json`,
  )
  triggerBrowserDownload(response.data, filename)
  return { filename }
}

export async function fetchPolicies() {
  const response = await httpClient.get<ApiSuccessResponse<PolicyItem[]>>('/policies')
  return response.data.data
}

export async function updatePolicy(id: string, enabled: boolean) {
  const response = await httpClient.patch<ApiSuccessResponse<PolicyItem>>(
    `/policies/${id}`,
    { enabled },
  )
  return response.data.data
}
