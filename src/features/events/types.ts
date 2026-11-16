import type { ListRequest } from '@/shared/lib/pagination'

export type UpcomingEventsRequest = ListRequest & { from: string }

export type ClubEvent = {
  id: string
  title: string
  startsOn: string
  /** Null when the event has no confirmed hour yet. */
  startsAt: string | null
  place: string
  description: string | null
  tournamentId: string | null
}
