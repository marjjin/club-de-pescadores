import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAngler, saveAngler, searchAnglers } from '../api/anglers'
import {
  archiveCategory,
  deleteCategory,
  listCategories,
  saveCategory,
} from '../api/tournaments'
import type {
  Angler,
  AnglerInput,
  CategoryListItem,
} from '../schemas/tournaments'

const keys = {
  categories: (userId: string) =>
    ['admin', userId, 'tournament-categories'] as const,
  people: (userId: string) => ['admin', userId, 'anglers'] as const,
  tournaments: (userId: string) => ['admin', userId, 'tournaments'] as const,
}

export function useCategories(userId: string) {
  return useQuery({
    queryKey: keys.categories(userId),
    queryFn: ({ signal }) => listCategories(signal),
    staleTime: 60_000,
  })
}

export function useCategoryActions(userId: string) {
  const client = useQueryClient()
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: keys.categories(userId) }),
      // Renames show up in every tournament that uses the category.
      client.invalidateQueries({ queryKey: keys.tournaments(userId) }),
    ])
  return {
    save: useMutation({
      mutationFn: ({
        name,
        current,
      }: {
        name: string
        current?: CategoryListItem | undefined
      }) => saveCategory(name, current),
      onSuccess: refresh,
    }),
    archive: useMutation({
      mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
        archiveCategory(id, archived),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (category: CategoryListItem) => deleteCategory(category),
      onSuccess: refresh,
    }),
  }
}

/** Waits 300 ms after typing and needs 2 characters, like the other searches. */
export function useAnglerSearch(userId: string, query: string) {
  const [applied, setApplied] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setApplied(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])
  const search = useQuery({
    queryKey: [...keys.people(userId), 'search', applied],
    queryFn: ({ signal }) => searchAnglers(applied, signal),
    enabled: applied.length >= 2,
    staleTime: 30_000,
  })
  return { search, applied, typing: query.trim() !== applied }
}

/** The full DNI is fetched only when someone opens the person's data. */
export function useAngler(userId: string, id: string | null) {
  return useQuery({
    queryKey: [...keys.people(userId), 'detail', id],
    queryFn: ({ signal }) => getAngler(id ?? '', signal),
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: 0,
  })
}

export function useSaveAngler(userId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      current,
    }: {
      input: AnglerInput
      current?: Pick<Angler, 'id' | 'updated_at'> | undefined
    }) => saveAngler(input, current),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: keys.people(userId) }),
        // A corrected name changes every table the person appears in.
        client.invalidateQueries({ queryKey: keys.tournaments(userId) }),
      ]),
  })
}
