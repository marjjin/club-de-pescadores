import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useConfirm } from './useConfirm'
import {
  clearDraft,
  useDraftSync,
  useRestoredDraft,
} from '@/shared/hooks/useDraft'
import { useContentActions } from './useAdminActions'
import { initialNewsValues, validateNewsEditor } from '../news-editor'
import type { NewsEditorErrors, NewsEditorValues } from '../news-editor'
import type { News } from '../schemas/admin'
import { dateLabel } from '../form-utils'
import { newsImagePath, removeNewsImages } from '../api/images'

export function useNewsEditor(row: News | null, onClose: () => void) {
  const confirm = useConfirm()
  const [initial] = useState(() => initialNewsValues(row))
  // Drafts survive reloads; they only restore onto the same version of the record.
  const draftKey = `news:${row?.id ?? 'new'}`
  const version = row?.updated_at ?? null
  const restored = useRestoredDraft(draftKey, version, initial)
  const [draftNotice, setDraftNotice] = useState(restored?.savedAt ?? null)
  const [values, setValues] = useState(restored?.values ?? initial)
  const [errors, setErrors] = useState<NewsEditorErrors>({})
  const [imageBusy, setImageBusy] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { save } = useContentActions()
  // Covers uploaded in this session; the ones not kept are removed from Storage.
  const uploads = useRef(new Set<string>())
  /** `saved` is the cover just stored, or null when the editor closes without saving. */
  function discardImages(saved: string | null) {
    const candidates =
      saved === null
        ? [...uploads.current]
        : [...uploads.current, row?.image_url ?? '']
    const keep = newsImagePath(saved)
    void removeNewsImages(
      candidates.map(newsImagePath).filter((path) => path !== keep),
    )
  }
  const dirty = (Object.keys(initial) as (keyof NewsEditorValues)[]).some(
    (key) => values[key] !== initial[key],
  )
  useDraftSync(draftKey, version, values, dirty && !save.isSuccess)
  const busy = save.isPending || imageBusy

  function change<K extends keyof NewsEditorValues>(
    name: K,
    value: NewsEditorValues[K],
  ) {
    if (name === 'image_url' && typeof value === 'string' && value)
      uploads.current.add(value)
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[name]
      if (name === 'publication') delete next.published_at
      return next
    })
    save.reset()
  }
  async function requestClose() {
    if (busy) return
    if (
      dirty &&
      !(await confirm({
        title: '¿Salir sin guardar?',
        message:
          'Tenés cambios sin guardar. ¿Querés salir del editor y descartarlos?',
        confirmLabel: 'Salir y descartar',
        cancelLabel: 'Seguir editando',
        tone: 'danger',
      }))
    )
      return
    clearDraft(draftKey)
    discardImages(null)
    onClose()
  }
  async function requestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const result = validateNewsEditor(values, row)
    if (!result.success) {
      setErrors(result.errors)
      const name = (
        ['title', 'excerpt', 'image_url', 'image_alt', 'published_at'] as const
      ).find((field) => result.errors[field])
      const control = event.currentTarget.querySelector<HTMLElement>(
        `[name="${name === 'image_url' ? 'image_file' : name}"]`,
      )
      control?.focus()
      return
    }
    setErrors({})
    const confirmation =
      values.publication === 'scheduled'
        ? `¿Programar esta noticia para el ${dateLabel(result.data.published_at)} (hora de Argentina)?`
        : values.publication === 'now'
          ? row?.is_published
            ? '¿Guardar los cambios de esta noticia publicada? Se verán en el sitio.'
            : '¿Publicar esta noticia en el sitio del club?'
          : row?.is_published
            ? '¿Retirar esta noticia del sitio o de su programación y guardarla como borrador?'
            : null
    if (confirmation && !(await confirm(confirmation))) return
    save.mutate(
      ['news', result.data, row?.id ?? null, row?.updated_at ?? null],
      {
        onSuccess: () => {
          // Closing unmounts before the draft sync sees the saved state.
          clearDraft(draftKey)
          discardImages(result.data.image_url)
          onClose()
        },
      },
    )
  }
  function discardDraft() {
    clearDraft(draftKey)
    setDraftNotice(null)
    setValues(initial)
  }
  const close = () => void requestClose()
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void requestSubmit(event)
  }
  return {
    draftNotice,
    discardDraft,
    values,
    errors,
    dirty,
    busy,
    imageBusy,
    save,
    previewOpen,
    setPreviewOpen,
    setImageBusy,
    change,
    close,
    submit,
  }
}
