import { useQuery } from '@tanstack/react-query'
import { getPoolRates } from '../api/getPoolRates'

export const usePoolRates = () =>
  useQuery({ queryKey: ['pool', 'rates'], queryFn: getPoolRates })
