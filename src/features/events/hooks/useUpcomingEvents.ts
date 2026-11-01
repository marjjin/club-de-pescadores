import { useQuery } from '@tanstack/react-query'
import { getUpcomingEvents } from '../api/getUpcomingEvents'

export const useUpcomingEvents = () =>
  useQuery({ queryKey: ['events', 'upcoming'], queryFn: getUpcomingEvents })
