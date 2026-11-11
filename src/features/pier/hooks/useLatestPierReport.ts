import { useQuery } from '@tanstack/react-query'
import { latestPierOptions } from '../api/queries'

export const useLatestPierReport = () => useQuery(latestPierOptions())
