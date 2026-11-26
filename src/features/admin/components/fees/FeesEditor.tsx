import { LoaderCircle, Save } from 'lucide-react'
import { FeeBoard, formatValidFrom } from '@/features/fees'
import { fieldToCents } from '../../fee-editor'
import { useFeesEditor } from '../../hooks/useFeesEditor'
import type { AdminFees } from '../../schemas/fees'
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
      {editable && (
        <div className="sticky bottom-0 z-10 mt-6 rounded-xl border border-navy-900/10 bg-white/95 p-4 shadow-card backdrop-blur-sm">
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="mb-3 text-sm font-semibold text-red-700">
              Revisá los campos marcados antes de publicar.
            </p>
          )}
          <Feedback error={editor.save.error} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-ink-600">
              {editor.dirty ? 'Cambios sin publicar' : 'Sin cambios pendientes'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryClass}
                disabled={!editor.dirty || editor.busy}
                onClick={editor.discard}
              >
                Descartar cambios
              </button>
              <button
                type="submit"
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
                {editor.save.isPending ? 'Publicando…' : 'Publicar valores'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
