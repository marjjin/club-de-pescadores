import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MAX_FACILITIES,
  defaultImages,
  facilitiesKey,
} from '@/features/facilities'
import { publicStorageUrl } from '@/lib/supabase/client'
import { randomUuid } from '@/shared/lib/random-id'
import {
  getAdminFacilities,
  saveFacilities,
  uploadFacilityPhoto,
} from '../api/facilities'
import { facilitiesInputSchema } from '../schemas/facilities'
import type {
  AdminFacilities,
  FacilitiesDraft,
  FacilityDraft,
} from '../schemas/facilities'
import { useConfirm } from './useConfirm'

const adminKey = (userId: string) => ['admin', userId, 'facilities'] as const

/** What the card shows: the uploaded photo, the bundled one, or nothing yet. */
export const facilityPhotoUrl = (card: FacilityDraft) =>
  card.image_path
    ? publicStorageUrl('club-media', card.image_path)
    : card.default_image
      ? defaultImages[card.default_image]
      : null

export function useAdminFacilities(userId: string) {
  return useQuery({
    queryKey: adminKey(userId),
    queryFn: ({ signal }) => getAdminFacilities(signal),
    staleTime: 30_000,
  })
}

const toDraft = (data: AdminFacilities): FacilitiesDraft => ({
  title: data.title,
  description: data.description,
  cards: data.cards.map((card) => ({ ...card, key: card.id })),
})
export type FacilityErrors = Record<string, string>

export function useFacilitiesEditor(
  data: AdminFacilities,
  userId: string,
  onSaved: () => void,
) {
  const confirm = useConfirm()
  const client = useQueryClient()
  const [initial] = useState(() => JSON.stringify(toDraft(data)))
  const [draft, setDraft] = useState(() => toDraft(data))
  const [errors, setErrors] = useState<FacilityErrors>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: (input: Parameters<typeof saveFacilities>[0]) =>
      saveFacilities(input, data.updated_at),
    onSuccess: async (saved) => {
      client.setQueryData(adminKey(userId), saved)
      await client.invalidateQueries({ queryKey: facilitiesKey })
      onSaved()
    },
  })
  const dirty = JSON.stringify(draft) !== initial
  const busy = save.isPending || Object.values(uploading).some(Boolean)

  function clearError(prefix: string) {
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([key]) => !key.startsWith(prefix)),
      ),
    )
    save.reset()
  }
  function setHeading(name: 'title' | 'description', value: string) {
    setDraft((previous) => ({ ...previous, [name]: value }))
    clearError(name)
  }
  function updateCard(key: string, change: Partial<FacilityDraft>) {
    setDraft((previous) => ({
      ...previous,
      cards: previous.cards.map((card) =>
        card.key === key ? { ...card, ...change } : card,
      ),
    }))
  }
  function changeCard(
    key: string,
    name: 'name' | 'description' | 'image_alt',
    value: string,
  ) {
    updateCard(key, { [name]: value })
    const index = draft.cards.findIndex((card) => card.key === key)
    clearError(`cards.${index}.${name}`)
  }
  function addCard() {
    if (draft.cards.length >= MAX_FACILITIES) return
    setDraft((previous) => ({
      ...previous,
      cards: [
        ...previous.cards,
        {
          key: randomUuid(),
          id: null,
          name: '',
          description: '',
          image_path: null,
          default_image: null,
          image_alt: '',
        },
      ],
    }))
    clearError('cards')
  }
  function moveCard(key: string, step: -1 | 1) {
    setDraft((previous) => {
      const cards = [...previous.cards]
      const from = cards.findIndex((card) => card.key === key)
      const to = from + step
      if (from < 0 || to < 0 || to >= cards.length) return previous
      const [card] = cards.splice(from, 1)
      if (card) cards.splice(to, 0, card)
      return { ...previous, cards }
    })
    // Field errors are indexed by position, so they would point at the wrong card.
    setErrors({})
  }
  async function removeCard(key: string) {
    const card = draft.cards.find((entry) => entry.key === key)
    if (!card || draft.cards.length <= 1) return
    if (
      (card.name.trim() || card.image_path) &&
      !(await confirm({
        title: `¿Quitar la tarjeta «${card.name.trim() || 'sin título'}»?`,
        message:
          'Deja de mostrarse en el sitio cuando guardes los cambios. Hasta entonces podés descartarlos.',
        confirmLabel: 'Quitar tarjeta',
        cancelLabel: 'Conservar',
        tone: 'danger',
      }))
    )
      return
    setDraft((previous) => ({
      ...previous,
      cards: previous.cards.filter((entry) => entry.key !== key),
    }))
    setErrors({})
    save.reset()
  }
  async function uploadPhoto(key: string, file: File) {
    setUploading((previous) => ({ ...previous, [key]: true }))
    setUploadErrors((previous) => ({ ...previous, [key]: '' }))
    try {
      const path = await uploadFacilityPhoto(file)
      updateCard(key, { image_path: path, default_image: null })
      const index = draft.cards.findIndex((card) => card.key === key)
      clearError(`cards.${index}.image_path`)
    } catch (error) {
      setUploadErrors((previous) => ({
        ...previous,
        [key]:
          error instanceof Error
            ? error.message
            : 'No se pudo subir la foto. Intentá nuevamente.',
      }))
    } finally {
      setUploading((previous) => ({ ...previous, [key]: false }))
    }
  }
  async function requestSubmit(form: HTMLFormElement) {
    if (busy || !dirty) return
    const result = facilitiesInputSchema.safeParse({
      title: draft.title,
      description: draft.description,
      cards: draft.cards.map((card) => ({
        id: card.id,
        name: card.name,
        description: card.description,
        image_path: card.image_path,
        default_image: card.default_image,
        image_alt: card.image_alt,
      })),
    })
    if (!result.success) {
      const next: FacilityErrors = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || 'cards'
        next[path] ??= issue.message
      }
      setErrors(next)
      form
        .querySelector<HTMLElement>(`[data-field="${Object.keys(next)[0]}"]`)
        ?.focus()
      return
    }
    setErrors({})
    if (
      !(await confirm({
        title: '¿Publicar los cambios de instalaciones?',
        message: `La sección se actualiza en el inicio del sitio con ${result.data.cards.length} ${result.data.cards.length === 1 ? 'tarjeta' : 'tarjetas'}.`,
        confirmLabel: 'Publicar cambios',
      }))
    )
      return
    save.mutate(result.data)
  }
  async function requestDiscard() {
    if (
      !dirty ||
      busy ||
      !(await confirm({
        title: '¿Descartar los cambios?',
        message: 'Se vuelve a la versión publicada de la sección.',
        confirmLabel: 'Descartar cambios',
        cancelLabel: 'Seguir editando',
        tone: 'danger',
      }))
    )
      return
    setDraft(toDraft(data))
    setErrors({})
    setUploadErrors({})
    save.reset()
  }
  return {
    draft,
    errors,
    uploading,
    uploadErrors,
    save,
    dirty,
    busy,
    full: draft.cards.length >= MAX_FACILITIES,
    setHeading,
    changeCard,
    addCard,
    moveCard,
    removeCard: (key: string) => void removeCard(key),
    uploadPhoto: (key: string, file: File) => void uploadPhoto(key, file),
    discard: () => void requestDiscard(),
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void requestSubmit(event.currentTarget)
    },
  }
}
