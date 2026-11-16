import { formatShortDate } from '@/shared/lib/dates'
import type { AdminTournament } from '../../schemas/tournaments'

/** "29 NOV 2026" or "29 NOV 2026 al 30 NOV 2026". */
export const tournamentDates = (
  tournament: Pick<AdminTournament, 'starts_on' | 'ends_on'>,
) =>
  tournament.ends_on && tournament.ends_on !== tournament.starts_on
    ? `${formatShortDate(tournament.starts_on)} al ${formatShortDate(tournament.ends_on)}`
    : formatShortDate(tournament.starts_on)
