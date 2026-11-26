import { Plus } from 'lucide-react'
import { MAX_FEES_PER_KIND } from '@/features/fees'
import type { FeeKind } from '@/features/fees'
import { kindLabels } from '../../fee-editor'
import type { FeeErrors } from '../../fee-editor'
import type { FeeDraft } from '../../schemas/fees'
import { secondaryClass } from '../ui'
import { FeeRowEditor } from './FeeRowEditor'
import type { FeeRowField } from './FeeRowEditor'

export function FeeListEditor({
  kind,
  fees,
  errors,
  editable,
  onChange,
  onAdd,
  onMove,
  onRemove,
}: {
  kind: FeeKind
  fees: FeeDraft[]
  errors: FeeErrors
  editable: boolean
  onChange: (key: string, name: FeeRowField, value: string) => void
  onAdd: () => void
  onMove: (key: string, step: -1 | 1) => void
  onRemove: (key: string) => void
}) {
  const { title, item } = kindLabels[kind]
  const full = fees.length >= MAX_FEES_PER_KIND
  const headingId = `fees-editor-${kind}`
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-navy-900/10 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-extrabold">
          {title}{' '}
          <span className="text-sm font-semibold text-ink-600">
            ({fees.length})
          </span>
        </h2>
        {editable && (
          <button
            type="button"
            className={secondaryClass}
            disabled={full}
            data-field={`kind:${kind}`}
            onClick={onAdd}
          >
            <Plus size={16} aria-hidden="true" />
            {full ? `Máximo de ${MAX_FEES_PER_KIND}` : `Agregar ${item}`}
          </button>
        )}
      </div>
      {errors[`kind:${kind}`] && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
          {errors[`kind:${kind}`]}
        </p>
      )}
      {fees.length ? (
        <ol className="mt-2" aria-labelledby={headingId}>
          {fees.map((fee, index) => (
            <FeeRowEditor
              key={fee.key}
              fee={fee}
              index={index}
              total={fees.length}
              errors={errors}
              editable={editable}
              onChange={(name, value) => onChange(fee.key, name, value)}
              onMove={(step) => onMove(fee.key, step)}
              onRemove={() => onRemove(fee.key)}
            />
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-navy-900/15 p-4 text-sm text-ink-600">
          Esta lista no se muestra en el sitio mientras esté vacía.
        </p>
      )}
    </section>
  )
}
