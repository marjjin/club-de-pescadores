import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboard, getPermissions, listAdmin } from '../api/data'
import type { Cursor, ListKind } from '../schemas/admin'

export function useAdminList(kind: ListKind, userId: string) {
  const [history, setHistory] = useState<(Cursor | null)[]>([null])
  const [state, setState] = useState('all')
  const [search, setSearch] = useState('')
  const filter = { cursor: history.at(-1) ?? null, state, search }
  const query = useQuery({
    queryKey: ['admin', userId, kind, filter],
    queryFn: ({ signal }) => listAdmin(kind, filter, signal),
    staleTime: 15_000,
    retry: false,
  })
  const rows = query.data?.slice(0, 20) ?? []
  return {
    query,
    rows,
    state,
    search,
    page: history.length,
    hasNext: (query.data?.length ?? 0) > 20,
    next: () => {
      const last = rows.at(-1)
      if (last)
        setHistory([...history, { id: last.id, created_at: last.created_at }])
    },
    previous: () => setHistory(history.slice(0, -1)),
    filter: (nextState: string, nextSearch: string) => {
      setState(nextState)
      setSearch(nextSearch)
      setHistory([null])
    },
  }
}
export function useDashboard(userId: string) {
  return useQuery({
    queryKey: ['admin', userId, 'dashboard'],
    queryFn: ({ signal }) => getDashboard(signal),
    staleTime: 30_000,
  })
}
export function usePermissions(userId: string) {
  return useQuery({
    queryKey: ['admin', userId, 'permissions'],
    queryFn: ({ signal }) => getPermissions(signal),
    staleTime: 300_000,
  })
}
