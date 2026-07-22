import { httpClient } from '@/api/httpClient'
import type { ApiSuccessResponse } from '@/types/api'

export interface DetectedRegion {
  region: string
  ipAddress: string
  connectionIp: string
  source: 'geoip' | 'timezone' | 'default'
  ipSource: 'connection' | 'egress' | 'client-hint'
  countryCode?: string
  timezone?: string
}

export async function fetchDetectedRegion() {
  const response =
    await httpClient.get<ApiSuccessResponse<DetectedRegion>>('/geo/region')
  return response.data.data
}
