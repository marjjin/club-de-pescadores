import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveAnnualTable,
  listAnnualTables,
  saveAnnualTable,
} from '../api/tournaments'
import type { AnnualTable, AnnualTableInput } from '../schemas/tournaments'

const keys = {
  annual: (userId: string) => ['admin', userId, 'annual-tables'] as const,
  tournaments: (userId: string) => ['admin', userId, 'tournaments'] as const,
}

export function useAnnualTables(userId: string) {
  return useQuery({
    queryKey: keys.annual(userId),
    queryFn: ({ signal }) => listAnnualTables(signal),
    staleTime: 60_000,
  })
}

export function useAnnualTableActions(userId: string) {
  const client = useQueryClient()
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.annual(userId) }),
      // Tournaments show the name of the table they add to.
      client.invalidateQueries({ queryKey: keys.tournaments(userId) }),
    ])
  return {
    save: useMutation({
      mutationFn: ({
        input,
        current,
      }: {
        input: AnnualTableInput
        current?: AnnualTable | undefined
      }) => saveAnnualTable(input, current),
      onSuccess: refresh,
    }),
    archive: useMutation({
      mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
        archiveAnnualTable(id, archived),
      onSuccess: refresh,
    }),
  }
}
