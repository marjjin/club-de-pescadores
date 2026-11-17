import type { StandingCursor, TournamentCursor } from '../schemas/tournament'

export const tournamentKeys = {
  all: ['tournaments'] as const,
  page: (cursor: TournamentCursor | null) =>
    [...tournamentKeys.all, 'page', { cursor }] as const,
  detail: (id: string) => [...tournamentKeys.all, 'detail', id] as const,
  leaderboard: (
    id: string,
    category: string | null,
    cursor: StandingCursor | null,
  ) =>
    [...tournamentKeys.all, 'leaderboard', id, { category, cursor }] as const,
  categories: (id: string) =>
    [...tournamentKeys.all, 'categories', id] as const,
  annual: () => [...tournamentKeys.all, 'annual'] as const,
  annualDetail: (id: string) => [...tournamentKeys.all, 'annual', id] as const,
  annualStandings: (id: string, category: string) =>
    [...tournamentKeys.all, 'annual', id, 'standings', category] as const,
}
