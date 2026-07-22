import { useQuery } from '@tanstack/react-query'

import { fetchDetectedRegion } from '@/api/geoApi'

export function useDetectedRegion() {
  return useQuery({
    queryKey: ['geo', 'region'],
    queryFn: fetchDetectedRegion,
    staleTime: 5 * 60_000,
    retry: 1,
  })
}
