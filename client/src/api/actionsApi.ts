import { httpClient } from '@/api/httpClient'
import type { ApiSuccessResponse } from '@/types/api'
import type {
  ActionCatalogItem,
  ExecuteActionPayload,
  ExecuteActionResult,
} from '@/types/actions'

export async function fetchActionCatalog() {
  const response =
    await httpClient.get<ApiSuccessResponse<ActionCatalogItem[]>>('/actions')
  return response.data.data
}

export async function executeAction(payload: ExecuteActionPayload) {
  const response = await httpClient.post<ApiSuccessResponse<ExecuteActionResult>>(
    '/actions',
    payload,
  )
  return response.data
}
