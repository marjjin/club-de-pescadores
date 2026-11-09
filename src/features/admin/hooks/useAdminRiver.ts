import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { riverLevelKey } from '@/features/river'
import { getAdminRiverLevel, saveRiverLevel } from '../api/river'

export function useAdminRiver(userId: string) {
  return useQuery({
    queryKey: ['admin', userId, 'river'],
    queryFn: ({ signal }) => getAdminRiverLevel(signal),
    staleTime: 30_000,
    retry: false,
  })
}
export function useSaveRiver(userId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['admin', userId, 'river', 'save'],
    mutationFn: saveRiverLevel,
    onSuccess: async (row) => {
      client.setQueryData(['admin', userId, 'river'], row)
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin', userId, 'audit'] }),
        client.invalidateQueries({ queryKey: riverLevelKey }),
      ])
    },
  })
}
