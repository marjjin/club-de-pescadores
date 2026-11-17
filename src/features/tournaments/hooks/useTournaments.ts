import { useQuery } from '@tanstack/react-query'
import { useCursorPages } from '@/shared/hooks/useCursorPages'
import { getTournament, getTournamentsPage } from '../api/getTournaments'
import { getBoardCategories, getLeaderboard } from '../api/getLeaderboard'
import {
  getAnnualStandings,
  getAnnualTable,
  getAnnualTables,
} from '../api/getAnnualTables'
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
export function useLeaderboard(
  id: string,
  category: string | null,
  live: boolean,
) {
  return useCursorPages({
    queryKey: (cursor: StandingCursor | null) =>
      tournamentKeys.leaderboard(id, category, cursor),
    queryFn: (cursor, signal) => getLeaderboard(id, category, cursor, signal),
    staleTime: live ? 30_000 : 10 * 60 * 1000,
    refetchInterval: live ? 60_000 : false,
  })
}

/** Categories change rarely; their participant counts follow the table refresh. */
export function useBoardCategories(id: string, live: boolean) {
  return useQuery({
    queryKey: tournamentKeys.categories(id),
    queryFn: ({ signal }) => getBoardCategories(id, signal),
    staleTime: live ? 30_000 : 10 * 60 * 1000,
    retry: false,
  })
}

// Annual tables change only when a tournament is finished: long cache times are fine.
export function useAnnualTables() {
  return useQuery({
    queryKey: tournamentKeys.annual(),
    queryFn: ({ signal }) => getAnnualTables(signal),
    staleTime: 10 * 60 * 1000,
  })
}

export function useAnnualTable(id: string) {
  return useQuery({
    queryKey: tournamentKeys.annualDetail(id),
    queryFn: ({ signal }) => getAnnualTable(id, signal),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useAnnualStandings(id: string, category: string | null) {
  return useQuery({
    queryKey: tournamentKeys.annualStandings(id, category ?? ''),
    queryFn: ({ signal }) => getAnnualStandings(id, category ?? '', signal),
    enabled: Boolean(category),
    staleTime: 5 * 60 * 1000,
  })
}
