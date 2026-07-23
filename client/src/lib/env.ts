const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
const sanitizedBaseUrl = rawBaseUrl?.replace(/\/$/, '')

if (!sanitizedBaseUrl && import.meta.env.PROD) {
  console.warn(
    'Missing VITE_API_BASE_URL in production. Falling back to /api/v1 may cause API and WebSocket requests to target the wrong origin.',
  )
}

export const clientEnv = {
  apiBaseUrl: sanitizedBaseUrl || '/api/v1',
} as const
