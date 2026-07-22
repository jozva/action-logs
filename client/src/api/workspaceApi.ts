import { httpClient } from '@/api/httpClient'
import type { ApiSuccessResponse } from '@/types/api'

export interface FileAsset {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  ownerEmail: string
  storageKey: string
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
  downloadPath: string
}

export async function fetchFiles() {
  const response = await httpClient.get<ApiSuccessResponse<FileAsset[]>>('/files')
  return response.data.data
}

export async function uploadFile(payload: {
  name: string
  mimeType: string
  sizeBytes: number
}) {
  const response = await httpClient.post<ApiSuccessResponse<FileAsset>>('/files', payload)
  return response.data.data
}

export async function downloadFile(id: string) {
  const response = await httpClient.post<
    ApiSuccessResponse<{ file: FileAsset; downloadToken: string; message: string }>
  >(`/files/${id}/download`)
  return response.data.data
}

export async function createExport() {
  const response =
    await httpClient.post<ApiSuccessResponse<ExportResult>>('/exports')
  return response.data.data
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
