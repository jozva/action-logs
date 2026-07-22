import { httpClient } from '@/api/httpClient'
import type { ApiSuccessResponse } from '@/types/api'
import type { AppUser } from '@/types/auth'
import type { ActorRole } from '@/constants/logs'

export async function fetchUsers() {
  const response = await httpClient.get<ApiSuccessResponse<AppUser[]>>('/users')
  return response.data.data
}

export async function createUser(payload: {
  name: string
  email: string
  password: string
  role: ActorRole
}) {
  const response = await httpClient.post<ApiSuccessResponse<AppUser>>('/users', payload)
  return response.data.data
}

export async function updateUser(
  id: string,
  payload: Partial<{
    name: string
    role: ActorRole
    status: 'active' | 'disabled'
    password: string
  }>,
) {
  const response = await httpClient.patch<ApiSuccessResponse<AppUser>>(
    `/users/${id}`,
    payload,
  )
  return response.data.data
}

export async function deleteUser(id: string) {
  const response = await httpClient.delete<ApiSuccessResponse<AppUser>>(`/users/${id}`)
  return response.data.data
}
