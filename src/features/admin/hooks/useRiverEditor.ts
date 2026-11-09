import { useState } from 'react'
import type { FormEvent } from 'react'
import { useBeforeUnload } from '@/shared/hooks/useBeforeUnload'
import { useSaveRiver } from './useAdminRiver'
import {
  initialRiverValues,
  riverFieldOrder,
  validateRiverValues,
} from '../river-editor'
import type {
  AdminRiverReading,
  RiverErrors,
  RiverValues,
} from '../river-editor'

export function useRiverEditor(row: AdminRiverReading | null, userId: string) {
  const [values, setValues] = useState(() => initialRiverValues(row))
  const [initial, setInitial] = useState(values)
  const [version, setVersion] = useState(row?.updated_at ?? null)
  const [saved, setSaved] = useState(row)
  const [errors, setErrors] = useState<RiverErrors>({})
  const save = useSaveRiver(userId)
  const dirty = (Object.keys(values) as (keyof RiverValues)[]).some(
    (key) => values[key] !== initial[key],
  )
  useBeforeUnload(dirty)
  function reset() {
    if (
      save.isPending ||
      !dirty ||
      !window.confirm('¿Descartar los cambios de esta medición?')
    )
      return
    setValues(initial)
    setErrors({})
    save.reset()
  }
  function change<K extends keyof RiverValues>(name: K, value: RiverValues[K]) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    save.reset()
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return
    const result = validateRiverValues(values, row?.note ?? null)
    if (!result.success) {
      setErrors(result.errors)
      const field = riverFieldOrder.find((name) => result.errors[name])
      event.currentTarget
        .querySelector<HTMLElement>(`[name="${field}"]`)
        ?.focus()
      return
    }
    setErrors({})
    const message = values.is_published
      ? '¿Publicar esta medición? Reemplazará la altura del río visible en el sitio.'
      : initial.is_published
        ? '¿Retirar la medición del sitio público y guardarla sin publicar?'
        : null
    if (message && !window.confirm(message)) return
    save.mutate(
      { input: result.data, version },
      {
        onSuccess: (saved) => {
          const next = initialRiverValues(saved)
          setVersion(saved.updated_at)
          setSaved(saved)
          setValues(next)
          setInitial(next)
        },
      },
    )
  }
  return { values, errors, save, saved, dirty, change, reset, submit }
}
