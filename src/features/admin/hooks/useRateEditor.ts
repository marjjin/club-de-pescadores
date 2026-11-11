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
  initialRateValues,
  rateFieldOrder,
  validateRateEditor,
} from '../rate-editor'
import type { RateEditorErrors, RateEditorValues } from '../rate-editor'
import type { Rate } from '../schemas/admin'

export function useRateEditor(row: Rate | null, onClose: () => void) {
  const confirm = useConfirm()
  const [initial] = useState(() => initialRateValues(row))
  // Drafts survive reloads; they only restore onto the same version of the record.
  const draftKey = `rate:${row?.id ?? 'new'}`
  const version = row?.updated_at ?? null
  const restored = useRestoredDraft(draftKey, version, initial)
  const [draftNotice, setDraftNotice] = useState(restored?.savedAt ?? null)
  const [values, setValues] = useState(restored?.values ?? initial)
  const [errors, setErrors] = useState<RateEditorErrors>({})
  const { save } = useContentActions()
  const dirty = (Object.keys(initial) as (keyof RateEditorValues)[]).some(
    (key) => values[key] !== initial[key],
  )

  useDraftSync(draftKey, version, values, dirty && !save.isSuccess)
  function change<K extends keyof RateEditorValues>(
    name: K,
    value: RateEditorValues[K],
  ) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[name as keyof RateEditorErrors]
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
    const result = validateRateEditor(values)
    if (!result.success) {
      setErrors(result.errors)
      const name = rateFieldOrder.find((field) => result.errors[field])
      event.currentTarget
        .querySelector<HTMLElement>(`[name="${name}"]`)
        ?.focus()
      return
    }
    setErrors({})
    const confirmation = values.is_published
      ? row?.is_published
        ? '¿Guardar los cambios de esta tarifa publicada? Se verán en el sitio según su vigencia.'
        : '¿Publicar esta tarifa en el sitio según las fechas de vigencia elegidas?'
      : row?.is_published
        ? '¿Retirar esta tarifa del sitio y guardarla como borrador?'
        : null
    if (confirmation && !(await confirm(confirmation))) return
    save.mutate(
      ['pool_rates', result.data, row?.id ?? null, row?.updated_at ?? null],
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
