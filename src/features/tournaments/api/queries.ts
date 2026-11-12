import type { StandingCursor, TournamentCursor } from '../schemas/tournament'

export const tournamentKeys = {
  all: ['tournaments'] as const,
  page: (cursor: TournamentCursor | null) =>
    [...tournamentKeys.all, 'page', { cursor }] as const,
  detail: (id: string) => [...tournamentKeys.all, 'detail', id] as const,
  leaderboard: (id: string, cursor: StandingCursor | null) =>
    [...tournamentKeys.all, 'leaderboard', id, { cursor }] as const,
}
