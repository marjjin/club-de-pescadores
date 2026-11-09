import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getRiverLevel } from '../api/getRiverLevel'

export const riverLevelKey = ['river-level', 'current'] as const
export function useRiverLevel() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const query = useQuery({
    queryKey: riverLevelKey,
    queryFn: ({ signal }) => getRiverLevel(signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: false,
  })
  return { query, now }
}
