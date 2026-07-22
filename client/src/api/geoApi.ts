import { httpClient } from '@/api/httpClient'
import type { ApiSuccessResponse } from '@/types/api'

export interface DetectedRegion {
  region: string
  ipAddress: string
  source: 'geoip' | 'timezone' | 'default'
  countryCode?: string
  timezone?: string
}

export async function fetchDetectedRegion() {
  const response =
    await httpClient.get<ApiSuccessResponse<DetectedRegion>>('/geo/region')
  return response.data.data
}
