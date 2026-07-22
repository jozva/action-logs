import { httpClient } from '@/api/httpClient'
import type { ApiSuccessResponse } from '@/types/api'
import type { AuthResponse, AuthUser } from '@/types/auth'

export async function loginRequest(payload: { email: string; password: string }) {
  const response = await httpClient.post<ApiSuccessResponse<AuthResponse>>(
    '/auth/login',
    payload,
  )
  return response.data.data
}

export async function registerRequest(payload: {
  name: string
  email: string
  password: string
  region?: string
}) {
  const response = await httpClient.post<ApiSuccessResponse<AuthResponse>>(
    '/auth/register',
    payload,
  )
  return response.data.data
}

export async function fetchMe() {
  const response = await httpClient.get<ApiSuccessResponse<AuthUser>>('/auth/me')
  return response.data.data
}

export async function logoutRequest() {
  const response = await httpClient.post<ApiSuccessResponse<{ success: boolean }>>(
    '/auth/logout',
  )
  return response.data.data
}
