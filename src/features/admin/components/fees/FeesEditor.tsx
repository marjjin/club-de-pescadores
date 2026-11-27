import { useState } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { FeeBoard, formatValidFrom } from '@/features/fees'
import { feeRowChanged, fieldToCents, toFeesDraft } from '../../fee-editor'
import { useFeesEditor } from '../../hooks/useFeesEditor'
import type { AdminFees, FeeDraft } from '../../schemas/fees'
import {
  Feedback,
  Field,
  inputClass,
  primaryClass,
  secondaryClass,
} from '../ui'
import { FeeListEditor } from './FeeListEditor'
import { ValidFromPicker } from './ValidFromPicker'

export function FeesEditor({
  data,
  userId,
  editable,
  onSaved,
}: {
  data: AdminFees
  userId: string
  editable: boolean
  onSaved: () => void
}) {
  const editor = useFeesEditor(data, userId, onSaved)
  const { draft, errors } = editor
  // What is on the site now, to mark changed rows and count what will be published.
  const [base] = useState(() => toFeesDraft(data))
  const [published] = useState(
    () => new Map(base.fees.map((fee) => [fee.key, fee] as const)),
  )
  const changes = countChanges(base, draft, published)
  const errorCount = Object.keys(errors).length
  const showBar =
    editable &&
    (editor.dirty ||
      editor.busy ||
      errorCount > 0 ||
      Boolean(editor.save.error))
  const since = formatValidFrom(`${draft.month}-01`)
  // The preview shows what would be published; unreadable prices show as $ 0.
  const preview = draft.fees.map((fee) => ({
    id: fee.key,
    kind: fee.kind,
    name: fee.name.trim() || 'Sin nombre',
    detail: fee.detail.trim() || null,
    icon: fee.icon,
    price: (fieldToCents(fee.price) ?? 0) / 100,
  }))
  const list = (kind: 'membership' | 'service') => (
    <FeeListEditor
      kind={kind}
      fees={draft.fees.filter((fee) => fee.kind === kind)}
      published={published}
      errors={errors}
      editable={editable}
      onChange={editor.changeRow}
      onAdd={() => editor.addRow(kind)}
      onMove={editor.moveRow}
      onRemove={editor.removeRow}
    />
  )
  return (
    <form
      noValidate
      onSubmit={editor.submit}
      aria-busy={editor.busy}
      className="min-w-0"
    >
      <p role="status" className="sr-only">
        {editor.announcement}
      </p>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <fieldset
          disabled={!editable || editor.save.isPending}
          className="grid min-w-0 gap-6"
        >
          <legend className="sr-only">Valores del club</legend>
          <section className="grid gap-4 rounded-2xl border border-navy-900/10 bg-white p-4 shadow-sm sm:grid-cols-[17rem_minmax(0,1fr)] sm:p-6">
            <h2 className="text-lg font-extrabold sm:col-span-2">Vigencia</h2>
            <div className="grid content-start gap-2">
              <ValidFromPicker
                value={draft.month}
                invalid={Boolean(errors.month)}
                onChange={(value) => editor.setSchedule('month', value)}
              />
              {errors.month && (
                <p role="alert" className="text-sm font-semibold text-red-700">
                  {errors.month}
                </p>
              )}
            </div>
            <div className="grid content-start gap-2">
              <Field
                label="Aclaración (opcional)"
                hint="Aparece debajo de los precios. Por ejemplo, cómo o cuándo se abonan."
              >
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={draft.note}
                  maxLength={300}
                  data-field="note"
                  aria-invalid={Boolean(errors.note)}
                  onChange={(event) =>
                    editor.setSchedule('note', event.target.value)
                  }
                />
              </Field>
              {errors.note && (
                <p role="alert" className="text-sm font-semibold text-red-700">
                  {errors.note}
                </p>
              )}
            </div>
          </section>
          {list('membership')}
          {list('service')}
        </fieldset>
        <aside
          aria-labelledby="fees-preview"
          className="min-w-0 xl:sticky xl:top-6"
        >
          <h2
            id="fees-preview"
            className="mb-3 text-xs font-extrabold tracking-[0.14em] text-ink-600 uppercase"
          >
            Así se ve en el sitio
          </h2>
          <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl bg-navy-950 p-5">
            <p className="mb-5 text-sm text-white/75">
              {since ? `Valores vigentes desde ${since}.` : 'Sin vigencia.'}
            </p>
            <FeeBoard fees={preview} compact />
            {draft.note.trim() && (
              <p className="mt-6 rounded-xl bg-sun-400/10 px-4 py-3 text-sm text-white/90">
                {draft.note.trim()}
              </p>
            )}
          </div>
        </aside>
      </div>
      {/* Only while there is something to publish: a bar that is always there takes a
          quarter of a phone screen and covers the preview for nothing. */}
      {showBar && (
        <div className="sticky bottom-0 z-10 mt-6 rounded-xl border border-navy-900/10 bg-white/95 p-3 shadow-raised backdrop-blur-sm sm:p-4">
          {errorCount > 0 && (
            <p role="alert" className="mb-3 text-sm font-semibold text-red-700">
              Revisá los campos marcados antes de publicar.
            </p>
          )}
          <Feedback error={editor.save.error} />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-sun-400"
              />
              {changes === 0
                ? editor.dirty
                  ? 'Cambió el orden'
                  : 'Sin cambios'
                : changes === 1
                  ? '1 cambio sin publicar'
                  : `${changes} cambios sin publicar`}
            </p>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <button
                type="button"
                className={secondaryClass}
                disabled={!editor.dirty || editor.busy}
                onClick={editor.discard}
                aria-label="Descartar cambios"
              >
                <span className="sm:hidden">Descartar</span>
                <span className="max-sm:hidden">Descartar cambios</span>
              </button>
              <button
                type="submit"
                aria-label={
                  editor.save.isPending ? 'Publicando…' : 'Publicar valores'
                }
                className={primaryClass}
                disabled={!editor.dirty || editor.busy}
              >
                {editor.save.isPending ? (
                  <LoaderCircle
                    size={16}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                {editor.save.isPending ? (
                  'Publicando…'
                ) : (
                  <>
                    <span className="sm:hidden">Publicar</span>
                    <span className="max-sm:hidden">Publicar valores</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

/** Rows added, removed or edited, plus the validity month and the note. */
function countChanges(
  base: ReturnType<typeof toFeesDraft>,
  draft: ReturnType<typeof toFeesDraft>,
  published: Map<string, FeeDraft>,
) {
  const kept = new Set(draft.fees.flatMap((fee) => fee.id ?? []))
  const edited = draft.fees.filter((fee) => {
    const before = fee.id ? published.get(fee.id) : undefined
    return !before || feeRowChanged(fee, before)
  }).length
  const removed = base.fees.filter((fee) => !kept.has(fee.key)).length
  return (
    edited +
    removed +
    Number(draft.month !== base.month) +
    Number(draft.note !== base.note)
  )
}
