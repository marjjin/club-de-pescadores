import type { ListRequest } from '@/shared/lib/pagination'

export type UpcomingEventsRequest = ListRequest & { from: string }

export type ClubEvent = {
  id: string
  title: string
  startsOn: string
  startsAt: string
  place: string
}
