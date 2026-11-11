import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, LoaderCircle, Send } from 'lucide-react'
import { useBeforeUnload } from '@/shared/hooks/useBeforeUnload'
import { useMediaUploads } from '../../hooks/useMediaUploads'
import { usePierReports, usePublishPier } from '../../hooks/usePier'
import { riverHeightToCm, validatePierReport } from '../../pier-editor'
import type { PierErrors, PierValues } from '../../pier-editor'
import { MediaPicker } from '../media/MediaPicker'
import { Feedback, primaryClass, secondaryClass } from '../ui'
import { PierConditionsField } from './PierConditionsField'
import { PierHeightField } from './PierHeightField'
import { PierStep as Step } from './PierStep'

const empty: PierValues = { height: '', conditions: '' }

export function PierReportForm({ userId }: { userId: string }) {
  const id = useId()
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState<PierErrors>({})
  const uploads = useMediaUploads()
  const publish = usePublishPier(userId)
  const last = usePierReports(userId).data?.pages[0]?.find(
    (report) => report.is_published,
  )
  const dirty =
    Boolean(values.height || values.conditions) || uploads.drafts.length > 0
  useBeforeUnload(dirty && !publish.isSuccess)
  const change = (name: keyof PierValues, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    publish.reset()
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (publish.isPending || uploads.busy) return
    if (uploads.hasErrors) {
      setErrors({ media: 'Quitá los archivos que no se pudieron subir.' })
      return
    }
    const result = validatePierReport(values, uploads.ready)
    if (!result.success) {
      setErrors(result.errors)
      event.currentTarget
        .querySelector<HTMLElement>(
          `[name="${result.errors.height ? 'height' : 'conditions'}"]`,
        )
        ?.focus()
      return
    }
    if (
      !window.confirm(
        '¿Publicar el parte? Se verá en el sitio y actualizará la altura del río.',
      )
    )
      return
    publish.mutate(result.data, {
      onSuccess: () => {
        setValues(empty)
        uploads.clear()
      },
    })
  }
  if (publish.isSuccess)
    return (
      <section className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2
          size={40}
          aria-hidden="true"
          className="mx-auto text-emerald-600"
        />
        <h2 role="status" className="mt-3 text-lg font-extrabold">
          Parte publicado
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Ya se ve en el inicio del sitio y la altura del río quedó actualizada.
        </p>
        <button
          type="button"
          className={`${secondaryClass} mt-6`}
          onClick={() => publish.reset()}
        >
          Cargar otro parte
        </button>
      </section>
    )
  const cm = riverHeightToCm(values.height)
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label="Nuevo parte del muelle"
      aria-busy={publish.isPending}
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <div className="grid gap-7 p-5 sm:p-6">
        <Step number={1} title="Altura del río">
          <PierHeightField
            id={`${id}-height`}
            value={values.height}
            error={errors.height}
            last={last}
            onChange={(value) => change('height', value)}
          />
        </Step>
        <Step number={2} title="¿Cómo está el muelle?">
          <PierConditionsField
            id={`${id}-conditions`}
            value={values.conditions}
            error={errors.conditions}
            onChange={(value) => change('conditions', value)}
          />
        </Step>
        <Step number={3} title="Fotos y videos">
          <MediaPicker
            uploads={uploads}
            disabled={publish.isPending}
            label="Fotos y videos del muelle"
            labelHidden
          />
          {errors.media && (
            <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
              {errors.media}
            </p>
          )}
        </Step>
        <Feedback error={publish.error} />
      </div>
      {/* Sticky on phones so the publish action is always one tap away. */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-navy-900/10 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
        <p className="min-w-0 flex-1 text-xs text-ink-600">
          <span className="block font-bold text-navy-900 tabular-nums">
            {cm === null ? 'Falta la altura' : `${values.height.trim()} m`}
          </span>
          {uploads.ready.length}{' '}
          {uploads.ready.length === 1 ? 'archivo listo' : 'archivos listos'}
        </p>
        {dirty && (
          <button
            type="button"
            className={secondaryClass}
            disabled={publish.isPending}
            onClick={() => {
              if (!window.confirm('¿Descartar este parte y sus archivos?'))
                return
              setValues(empty)
              setErrors({})
              uploads.discard()
            }}
          >
            Descartar
          </button>
        )}
        <button
          type="submit"
          className={primaryClass}
          disabled={publish.isPending || uploads.busy}
        >
          {publish.isPending ? (
            <LoaderCircle
              size={17}
              aria-hidden="true"
              className="motion-safe:animate-spin"
            />
          ) : (
            <Send size={17} aria-hidden="true" />
          )}
          {publish.isPending
            ? 'Publicando…'
            : uploads.busy
              ? 'Esperando archivos…'
              : 'Publicar parte'}
        </button>
      </div>
    </form>
  )
}
