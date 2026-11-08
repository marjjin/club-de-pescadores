import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminSession, subscribeAuth } from '../api/auth'

export function useAdminSession() {
  const client = useQueryClient()
  const previous = useRef<string | null | undefined>(undefined)
  useEffect(
    () =>
      subscribeAuth((userId) => {
        // Never await Auth calls inside its callback; the SDK holds its session lock.
        if (previous.current !== undefined && previous.current !== userId) {
          void client.cancelQueries({ queryKey: ['admin'] })
          client.removeQueries({ queryKey: ['admin'] })
          void client.cancelQueries({ queryKey: ['admin-session'] })
          client.setQueryData(['admin-session'], null)
        }
        previous.current = userId
        queueMicrotask(() => {
          void client.invalidateQueries({ queryKey: ['admin-session'] })
        })
      }),
    [client],
  )
  return useQuery({
    queryKey: ['admin-session'],
    queryFn: ({ signal }) => getAdminSession(signal),
    staleTime: 0,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}
