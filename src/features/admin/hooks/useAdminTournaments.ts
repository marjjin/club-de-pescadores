import { useEffect, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { tournamentKeys } from '@/features/tournaments'
import {
  addParticipant,
  addPoints,
  getAdminTournament,
  listParticipants,
  listTournaments,
  removeParticipant,
  renameParticipant,
  saveTournament,
  setTournamentStatus,
} from '../api/tournaments'
import type { ParticipantCursor } from '../api/tournaments'
import type {
  AdminTournament,
  TournamentInput,
  TournamentStatus,
} from '../schemas/tournaments'

const TOURNAMENTS_PAGE = 20
const PARTICIPANTS_PAGE = 50
const keys = {
  list: (userId: string) => ['admin', userId, 'tournaments'] as const,
  participants: (userId: string, id: string) =>
    ['admin', userId, 'tournaments', id, 'participants'] as const,
}

export function useTournamentList(userId: string) {
  return useInfiniteQuery({
    queryKey: keys.list(userId),
    queryFn: ({ pageParam, signal }) => listTournaments(pageParam, signal),
    initialPageParam: null as { created_at: string; id: string } | null,
    getNextPageParam: (page) =>
      page.length === TOURNAMENTS_PAGE ? page.at(-1) : null,
    staleTime: 30_000,
  })
}

export function useAdminTournament(userId: string, id: string) {
  return useQuery({
    queryKey: [...keys.list(userId), 'detail', id],
    queryFn: ({ signal }) => getAdminTournament(id, signal),
    staleTime: 15_000,
    retry: false,
  })
}

/** Search waits 300 ms after typing; TanStack aborts the request it replaces. */
export function useParticipants(userId: string, tournamentId: string) {
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setApplied(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])
  const query = useInfiniteQuery({
    queryKey: [...keys.participants(userId, tournamentId), applied],
    queryFn: ({ pageParam, signal }) =>
      listParticipants(tournamentId, applied, pageParam, signal),
    initialPageParam: null as ParticipantCursor | null,
    getNextPageParam: (page) =>
      page.length === PARTICIPANTS_PAGE ? page.at(-1) : null,
    staleTime: 15_000,
  })
  return { query, search, setSearch, searching: search.trim() !== applied }
}

function useRefresh(userId: string, tournamentId?: string) {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.list(userId) }),
      tournamentId &&
        client.invalidateQueries({
          queryKey: keys.participants(userId, tournamentId),
        }),
      // The public leaderboard is cached too; staff expect to see their change there.
      client.invalidateQueries({ queryKey: tournamentKeys.all }),
    ])
}

export function useSaveTournament(userId: string) {
  const refresh = useRefresh(userId)
  return useMutation({
    mutationFn: ({
      input,
      current,
    }: {
      input: TournamentInput
      current?: AdminTournament | undefined
    }) => saveTournament(input, current),
    onSuccess: refresh,
  })
}

export function useTournamentStatus(userId: string) {
  const refresh = useRefresh(userId)
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TournamentStatus }) =>
      setTournamentStatus(id, status),
    onSuccess: refresh,
  })
}

export function useParticipantActions(userId: string, tournamentId: string) {
  const refresh = useRefresh(userId, tournamentId)
  return {
    add: useMutation({
      mutationFn: (input: { name: string; consent: boolean }) =>
        addParticipant(tournamentId, input),
      onSuccess: refresh,
    }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        renameParticipant(id, name),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: removeParticipant,
      onSuccess: refresh,
    }),
    score: useMutation({
      mutationFn: ({
        id,
        points,
        reason,
      }: {
        id: string
        points: number
        reason: string
      }) => addPoints(id, { points, reason }),
      onSuccess: refresh,
    }),
  }
}
