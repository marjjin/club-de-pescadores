import { useQuery } from '@tanstack/react-query'
import { getClubToday } from '@/shared/lib/dates'
import { upcomingEventsOptions } from '../api/queries'

export const useUpcomingEvents = () =>
  useQuery(upcomingEventsOptions(getClubToday()))
