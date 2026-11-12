import { useQuery } from '@tanstack/react-query'
import { useCursorPages } from '@/shared/hooks/useCursorPages'
import { getTournament, getTournamentsPage } from '../api/getTournaments'
import { getLeaderboard } from '../api/getLeaderboard'
import { tournamentKeys } from '../api/queries'
import type { StandingCursor } from '../schemas/tournament'

export function useTournamentsPage() {
  return useCursorPages({
    queryKey: tournamentKeys.page,
    queryFn: (cursor, signal) => getTournamentsPage({ cursor, signal }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: ({ signal }) => getTournament(id, signal),
    staleTime: 60_000,
    retry: false,
  })
}

/** While a tournament is running, points change often: refresh the table every minute. */
export function useLeaderboard(id: string, live: boolean) {
  return useCursorPages({
    queryKey: (cursor: StandingCursor | null) =>
      tournamentKeys.leaderboard(id, cursor),
    queryFn: (cursor, signal) => getLeaderboard(id, cursor, signal),
    staleTime: live ? 30_000 : 10 * 60 * 1000,
    refetchInterval: live ? 60_000 : false,
  })
}
