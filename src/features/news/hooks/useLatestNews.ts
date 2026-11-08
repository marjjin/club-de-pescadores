import { useQuery } from '@tanstack/react-query'
import { latestNewsOptions } from '../api/queries'

export const useLatestNews = () => useQuery(latestNewsOptions())
