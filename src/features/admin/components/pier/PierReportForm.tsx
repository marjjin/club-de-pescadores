import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, LoaderCircle, Send } from 'lucide-react'
import {
  useDraftSync,
  useRestoredDraft,
  clearDraft,
} from '@/shared/hooks/useDraft'
import { z } from '@/shared/lib/validation'
import { useConfirm } from '../../hooks/useConfirm'
import { uploadedMediaSchema } from '../../schemas/media'
import { DraftNotice } from '../DraftNotice'
import { useMediaUploads } from '../../hooks/useMediaUploads'
import { usePierReports, usePublishPier } from '../../hooks/usePier'
import {
  cmToMetres,
  riverHeightToCm,
  selectedConditions,
  validatePierReport,
} from '../../pier-editor'
import type { PierErrors, PierValues } from '../../pier-editor'
import { MediaPicker } from '../media/MediaPicker'
import { Feedback, primaryClass, secondaryClass } from '../ui'
import { PierConditionsField } from './PierConditionsField'
import { PierHeightField } from './PierHeightField'
import { PierStep as Step } from './PierStep'

// height null = untouched: it then mirrors the last published height.
type FormValues = Omit<PierValues, 'height'> & { height: string | null }
const empty: FormValues = { height: null, conditions: '' }
// Unreferenced uploads are pruned after 24 h, so older drafts restore text only.
const MEDIA_DRAFT_MS = 20 * 60 * 60 * 1000
const mediaDraft = z.array(uploadedMediaSchema).max(10)

export function PierReportForm({ userId }: { userId: string }) {
  const id = useId()
  const key = `pier:${userId}`
  const restored = useRestoredDraft(key, null, empty)
  const [notice, setNotice] = useState(restored?.savedAt ?? null)
  const [values, setValues] = useState(restored?.values ?? empty)
  const [errors, setErrors] = useState<PierErrors>({})
  // Computed once: restoring depends on the draft age at mount time only.
  const [restoredMedia] = useState(() => {
    const media = mediaDraft.safeParse(restored?.extra)
    return media.success &&
      restored &&
      Date.now() - Date.parse(restored.savedAt) < MEDIA_DRAFT_MS
      ? media.data
      : []
  })
  const uploads = useMediaUploads(restoredMedia)
  const publish = usePublishPier(userId)
  const confirm = useConfirm()
  const last = usePierReports(userId).data?.pages[0]?.find(
    (report) => report.is_published,
  )
  const height = values.height ?? (last ? cmToMetres(last.height_cm) : '')
  const dirty =
    values.height !== null ||
    Boolean(values.conditions) ||
    uploads.drafts.length > 0
  useDraftSync(key, null, values, dirty && !publish.isSuccess, uploads.ready)
  const change = (name: keyof PierValues, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    publish.reset()
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    if (publish.isPending || uploads.busy) return
    if (uploads.hasErrors) {
      setErrors({ media: 'Quitá los archivos que no se pudieron subir.' })
      return
    }
    const result = validatePierReport(
      { height, conditions: values.conditions },
      uploads.ready,
    )
    if (!result.success) {
      setErrors(result.errors)
      event.currentTarget
        .querySelector<HTMLElement>(
          `[name="${result.errors.height ? 'height' : 'conditions'}"]`,
        )
        ?.focus()
      return
    }
    const same = last && result.data.height_cm === last.height_cm
    const accepted = await confirm(
      // Guards against republishing an old height with today's date.
      same
        ? {
            title: 'La altura no cambió',
            message: `Es la misma del último parte (${height} m). ¿La publicás igual con la fecha de ahora?`,
            confirmLabel: 'Publicar igual',
            cancelLabel: 'Revisar altura',
          }
        : {
            title: '¿Publicar el parte?',
            message:
              'Se verá en el inicio del sitio y actualizará la altura del río.',
            confirmLabel: 'Publicar parte',
          },
    )
    if (!accepted) return
    publish.mutate(result.data, {
      onSuccess: () => {
        clearDraft(key)
        setNotice(null)
        setValues(empty)
        uploads.clear()
      },
    })
  }
  function discard() {
    clearDraft(key)
    setNotice(null)
    setValues(empty)
    setErrors({})
    uploads.discard()
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
  const cm = riverHeightToCm(height)
  const chosen = selectedConditions(values.conditions).length
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void submit(event)
      }}
      aria-label="Nuevo parte del muelle"
      aria-busy={publish.isPending}
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <div className="grid gap-7 p-5 sm:p-6">
        {notice && (
          <div className="-mb-2">
            <DraftNotice savedAt={notice} onDiscard={discard} />
          </div>
        )}
        <Step number={1} title="Altura del río">
          <PierHeightField
            id={`${id}-height`}
            value={height}
            error={errors.height}
            last={last}
            onChange={(value) => change('height', value)}
          />
        </Step>
        <Step number={2} title="Condiciones del muelle">
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
          <span className="block text-sm font-extrabold text-navy-900 tabular-nums">
            {cm === null ? 'Ingresá la altura' : `${cmToMetres(cm)} m`}
          </span>
          {chosen} {chosen === 1 ? 'condición' : 'condiciones'} ·{' '}
          {uploads.ready.length}{' '}
          {uploads.ready.length === 1 ? 'archivo' : 'archivos'}
        </p>
        {dirty && (
          <button
            type="button"
            className={secondaryClass}
            disabled={publish.isPending}
            onClick={() => {
              void confirm({
                title: '¿Descartar este parte?',
                message: 'Se borran el texto y los archivos que subiste.',
                confirmLabel: 'Descartar',
                tone: 'danger',
              }).then((accepted) => {
                if (accepted) discard()
              })
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
