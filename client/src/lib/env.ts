const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export const clientEnv = {
  apiBaseUrl: rawBaseUrl?.replace(/\/$/, '') || '/api/v1',
} as const
