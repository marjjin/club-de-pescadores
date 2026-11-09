import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useContentActions } from './useAdminActions'
import {
  initialRateValues,
  rateFieldOrder,
  validateRateEditor,
} from '../rate-editor'
import type { RateEditorErrors, RateEditorValues } from '../rate-editor'
import type { Rate } from '../schemas/admin'

export function useRateEditor(row: Rate | null, onClose: () => void) {
  const [initial] = useState(() => initialRateValues(row))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<RateEditorErrors>({})
  const { save } = useContentActions()
  const dirty = (Object.keys(initial) as (keyof RateEditorValues)[]).some(
    (key) => values[key] !== initial[key],
  )
  useEffect(() => {
    if (!dirty || save.isSuccess) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, save.isSuccess])

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
  function close() {
    if (save.isPending) return
    if (
      dirty &&
      !window.confirm(
        'Tenés cambios sin guardar. ¿Querés salir del editor y descartarlos?',
      )
    )
      return
    onClose()
  }
  function submit(event: FormEvent<HTMLFormElement>) {
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
    if (confirmation && !window.confirm(confirmation)) return
    save.mutate(
      ['pool_rates', result.data, row?.id ?? null, row?.updated_at ?? null],
      { onSuccess: onClose },
    )
  }
  return { values, errors, dirty, save, change, close, submit }
}
