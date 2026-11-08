import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useContentActions } from './useAdminActions'
import {
  eventFieldOrder,
  initialEventValues,
  validateEventEditor,
} from '../event-editor'
import type { EventEditorErrors, EventEditorValues } from '../event-editor'
import type { ClubEvent } from '../schemas/admin'

export function useEventEditor(row: ClubEvent | null, onClose: () => void) {
  const [initial] = useState(() => initialEventValues(row))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<EventEditorErrors>({})
  const { save } = useContentActions()
  const dirty = (Object.keys(initial) as (keyof EventEditorValues)[]).some(
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
    if (confirmation && !window.confirm(confirmation)) return
    save.mutate(
      ['events', result.data, row?.id ?? null, row?.updated_at ?? null],
      { onSuccess: onClose },
    )
  }
  return { values, errors, dirty, save, change, close, submit }
}
