import { useState } from 'react'
import type { FormEvent } from 'react'
import { useConfirm } from './useConfirm'
import {
  clearDraft,
  useDraftSync,
  useRestoredDraft,
} from '@/shared/hooks/useDraft'
import { useContentActions } from './useAdminActions'
import {
  eventFieldOrder,
  initialEventValues,
  validateEventEditor,
} from '../event-editor'
import type { EventEditorErrors, EventEditorValues } from '../event-editor'
import type { ClubEvent } from '../schemas/admin'

export function useEventEditor(row: ClubEvent | null, onClose: () => void) {
  const confirm = useConfirm()
  const [initial] = useState(() => initialEventValues(row))
  // Drafts survive reloads; they only restore onto the same version of the record.
  const draftKey = `event:${row?.id ?? 'new'}`
  const version = row?.updated_at ?? null
  const restored = useRestoredDraft(draftKey, version, initial)
  const [draftNotice, setDraftNotice] = useState(restored?.savedAt ?? null)
  const [values, setValues] = useState(restored?.values ?? initial)
  const [errors, setErrors] = useState<EventEditorErrors>({})
  const { save } = useContentActions()
  const dirty = (Object.keys(initial) as (keyof EventEditorValues)[]).some(
    (key) => values[key] !== initial[key],
  )

  useDraftSync(draftKey, version, values, dirty && !save.isSuccess)
  function change<K extends keyof EventEditorValues>(
    name: K,
    value: EventEditorValues[K],
  ) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[name as keyof EventEditorErrors]
      return next
    })
    save.reset()
  }
  async function requestClose() {
    if (save.isPending) return
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
    onClose()
  }
  async function requestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return
    const result = validateEventEditor(values)
    if (!result.success) {
      setErrors(result.errors)
      const name = eventFieldOrder.find((field) => result.errors[field])
      event.currentTarget
        .querySelector<HTMLElement>(`[name="${name}"]`)
        ?.focus()
      return
    }
    setErrors({})
    const confirmation = values.is_published
      ? row?.is_published
        ? '¿Guardar los cambios de este evento publicado? Se verán en el sitio.'
        : '¿Publicar este evento en el sitio del club?'
      : row?.is_published
        ? '¿Retirar este evento del sitio y guardarlo como borrador?'
        : null
    if (confirmation && !(await confirm(confirmation))) return
    save.mutate(
      ['events', result.data, row?.id ?? null, row?.updated_at ?? null],
      {
        onSuccess: () => {
          // Closing unmounts before the draft sync sees the saved state.
          clearDraft(draftKey)
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
    save,
    change,
    close,
    submit,
  }
}
