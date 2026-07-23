import axios, { AxiosError, type AxiosInstance } from 'axios'
import { toast } from 'sonner'

import { clientEnv } from '@/lib/env'
import { discoverBrowserPublicIp } from '@/lib/publicIp'
import { useAuthStore } from '@/stores/authStore'
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
    const raw = error.response?.data
    const payload =
      raw && typeof raw === 'object' && !(raw instanceof Blob)
        ? (raw as ApiErrorResponse)
        : undefined
    const detailMessage = firstValidationMessage(payload?.errors)
    return new ApiRequestError(
      detailMessage || payload?.message || error.message || 'Request failed',
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

function firstValidationMessage(errors: unknown): string | undefined {
  if (!Array.isArray(errors) || errors.length === 0) return undefined
  const first = errors[0] as { message?: string; path?: string }
  if (!first?.message) return undefined

  if (first.message.includes('dateFrom must be before')) {
    return 'Date From must be earlier than or equal to Date To'
  }

  return first.path ? `${first.path}: ${first.message}` : first.message
}

function isCredentialChallenge(url?: string): boolean {
  if (!url) return false
  return url.includes('/auth/login') || url.includes('/auth/register')
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: clientEnv.apiBaseUrl,
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
})

httpClient.interceptors.request.use(async (config) => {
  config.headers['X-Client-Timezone'] =
    Intl.DateTimeFormat().resolvedOptions().timeZone

  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const publicIp = await discoverBrowserPublicIp()
  if (publicIp) {
    config.headers['X-Client-Public-Ip'] = publicIp
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (error instanceof AxiosError && error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text()
        error.response.data = JSON.parse(text) as ApiErrorResponse
      } catch {
      }
    }

    const normalized = extractError(error)
    if (normalized.status === 429) {
      toast.error('Rate limit exceeded. Please wait and retry.')
    }

    if (normalized.status === 401) {
      const requestUrl = error instanceof AxiosError ? error.config?.url : undefined
      if (!isCredentialChallenge(requestUrl)) {
        useAuthStore.getState().clearSession()
      }
    }

    return Promise.reject(normalized)
  },
)
