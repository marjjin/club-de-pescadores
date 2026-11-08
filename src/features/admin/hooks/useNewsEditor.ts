import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useContentActions } from './useAdminActions'
import { initialNewsValues, validateNewsEditor } from '../news-editor'
import type { NewsEditorErrors, NewsEditorValues } from '../news-editor'
import type { News } from '../schemas/admin'
import { dateLabel } from '../form-utils'

export function useNewsEditor(row: News | null, onClose: () => void) {
  const [initial] = useState(() => initialNewsValues(row))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<NewsEditorErrors>({})
  const [imageBusy, setImageBusy] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { save } = useContentActions()
  const dirty = (Object.keys(initial) as (keyof NewsEditorValues)[]).some(
    (key) => values[key] !== initial[key],
  )
  const busy = save.isPending || imageBusy
  useEffect(() => {
    if ((!dirty && !imageBusy) || save.isSuccess) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, imageBusy, save.isSuccess])

  function change<K extends keyof NewsEditorValues>(
    name: K,
    value: NewsEditorValues[K],
  ) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[name]
      if (name === 'publication') delete next.published_at
      return next
    })
    save.reset()
  }
  function close() {
    if (busy) return
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
    if (confirmation && !window.confirm(confirmation)) return
    save.mutate(
      ['news', result.data, row?.id ?? null, row?.updated_at ?? null],
      { onSuccess: onClose },
    )
  }
  return {
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
