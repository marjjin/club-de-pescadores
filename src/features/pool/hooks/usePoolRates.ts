import { useQuery } from '@tanstack/react-query'
import { poolRatesOptions } from '../api/queries'

export const usePoolRates = () => useQuery(poolRatesOptions())
