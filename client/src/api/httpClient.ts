import axios, { AxiosError, type AxiosInstance } from 'axios'
import { toast } from 'sonner'

import { clientEnv } from '@/lib/env'
import type { ApiErrorResponse } from '@/types/api'

export class ApiRequestError extends Error {
  public readonly status?: number
  public readonly code?: string
  public readonly details?: unknown

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function extractError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error
  }

  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorResponse | undefined
    return new ApiRequestError(
      payload?.message || error.message || 'Request failed',
      error.response?.status,
      payload?.code,
      payload?.errors,
    )
  }

  if (error instanceof Error) {
    return new ApiRequestError(error.message)
  }

  return new ApiRequestError('Unexpected request failure')
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: clientEnv.apiBaseUrl,
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('gidy-auth-session')
  if (!raw) {
    return config
  }

  try {
    const parsed = JSON.parse(raw) as { state?: { token?: string } }
    const token = parsed.state?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // ignore malformed persisted auth
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized = extractError(error)
    if (normalized.status === 429) {
      toast.error('Rate limit exceeded. Please wait and retry.')
    }
    if (normalized.status === 401) {
      localStorage.removeItem('gidy-auth-session')
    }
    return Promise.reject(normalized)
  },
)
