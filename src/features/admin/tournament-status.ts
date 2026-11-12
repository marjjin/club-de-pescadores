import type { TournamentStatus } from './schemas/tournaments'

/** Participants and points can change only while the tournament is open (checked again in the database). */
export const isOpen = (status: TournamentStatus) =>
  status === 'draft' || status === 'published'
