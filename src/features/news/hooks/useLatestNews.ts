import { useQuery } from '@tanstack/react-query'
import { getLatestNews } from '../api/getLatestNews'

export const useLatestNews = () =>
  useQuery({ queryKey: ['news', 'latest'], queryFn: getLatestNews })
