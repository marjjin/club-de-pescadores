import { useId, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { FEE_ICONS, feeIcons, formatFeePrice } from '@/features/fees'
import { feeRowChanged, fieldToCents } from '../../fee-editor'
import type { FeeErrors } from '../../fee-editor'
import type { FeeDraft } from '../../schemas/fees'
import { inputClass } from '../ui'

const iconButton =
  'grid size-11 place-items-center rounded-lg text-navy-900 hover:bg-mist-50 disabled:opacity-30'
// Visible on phones, where there is no column header; screen readers always get it.
const label = 'text-xs font-bold text-ink-600 sm:sr-only'
const errorText = 'text-sm font-semibold text-red-700'

/** Shared with the column header in FeeListEditor, so both line up. */
export const feeRowColumns = 'sm:grid-cols-[11.5rem_minmax(0,1fr)_9rem_8.25rem]'

export type FeeRowField = 'name' | 'detail' | 'icon' | 'price'

export function FeeRowEditor({
  fee,
  published,
  index,
  total,
  errors,
  editable,
  onChange,
  onMove,
  onRemove,
}: {
  fee: FeeDraft
  /** The row as it is on the site; null for a row added in this edit. */
  published: FeeDraft | null
  index: number
  total: number
  errors: FeeErrors
  editable: boolean
  onChange: (name: FeeRowField, value: string) => void
  onMove: (step: -1 | 1) => void
  onRemove: () => void
}) {
  const id = useId()
  const detailRef = useRef<HTMLInputElement>(null)
  // Most fees have no detail: the field stays folded behind a link until needed.
  const [detailOpen, setDetailOpen] = useState(fee.detail !== '')
  const Icon = feeIcons[fee.icon].icon
  const name = fee.name.trim() || `Fila ${index + 1}`
  const error = (field: string) => errors[`${fee.key}.${field}`]
  const describe = (field: string) => ({
    'aria-invalid': Boolean(error(field)),
    'aria-describedby': error(field) ? `${id}-${field}-error` : undefined,
    'data-field': `${fee.key}.${field}`,
  })
  const changed = published !== null && feeRowChanged(fee, published)
  const oldCents = published ? fieldToCents(published.price) : null
  const priceChanged =
    published !== null && fieldToCents(fee.price) !== oldCents
  const showDetail = detailOpen || fee.detail !== '' || Boolean(error('detail'))

  return (
    <li
      className={`relative grid grid-cols-[minmax(0,1fr)_9rem] gap-x-3 gap-y-2 border-t border-navy-900/10 py-3 first:border-t-0 ${feeRowColumns} ${
        changed || !published
          ? 'before:absolute before:inset-y-2 before:-left-4 before:w-1 before:rounded-full before:bg-sun-400 sm:before:-left-6'
          : ''
      }`}
    >
      {/* Icon: the select shows the chosen icon inside it, as it looks on the site. */}
      <div className="grid min-w-0 content-start gap-1 sm:col-start-1 sm:row-start-1">
        <label htmlFor={`${id}-icon`} className={label}>
          Ícono
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1.5 my-auto grid size-8 place-items-center rounded-md bg-navy-900 text-sun-400"
          >
            <Icon size={16} />
          </span>
          <select
            id={`${id}-icon`}
            className={`${inputClass} pl-11`}
            value={fee.icon}
            onChange={(event) => onChange('icon', event.target.value)}
          >
            {FEE_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {feeIcons[icon].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid min-w-0 content-start gap-1 max-sm:col-span-full max-sm:row-start-1 sm:col-start-2 sm:row-start-1">
        <label htmlFor={`${id}-name`} className={label}>
          Nombre
        </label>
        <div className="flex min-w-0 items-center gap-2">
          <input
            id={`${id}-name`}
            className={`${inputClass} min-w-0 flex-1`}
            value={fee.name}
            maxLength={60}
            placeholder="Ej.: Social"
            {...describe('name')}
            onChange={(event) => onChange('name', event.target.value)}
          />
          {!published && <NewBadge />}
        </div>
        {error('name') && (
          <p id={`${id}-name-error`} className={errorText}>
            {error('name')}
          </p>
        )}
      </div>

      <div className="grid min-w-0 content-start gap-1 sm:col-start-3 sm:row-start-1">
        <label htmlFor={`${id}-price`} className={label}>
          Precio
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm font-bold text-ink-600"
          >
            $
          </span>
          <input
            id={`${id}-price`}
            className={`${inputClass} pl-7 text-right font-bold tabular-nums`}
            value={fee.price}
            inputMode="decimal"
            autoComplete="off"
            placeholder="30.000"
            {...describe('price')}
            onChange={(event) => onChange('price', event.target.value)}
          />
        </div>
        {priceChanged && oldCents !== null && (
          <p className="text-right text-xs text-ink-600 tabular-nums">
            Antes: <s>{formatFeePrice(oldCents / 100)}</s>
          </p>
        )}
        {error('price') && (
          <p id={`${id}-price-error`} className={errorText}>
            {error('price')}
          </p>
        )}
      </div>

      {editable && (
        <div className="flex items-start justify-end gap-0.5 max-sm:col-start-2 max-sm:row-start-3 sm:col-start-4 sm:row-start-1">
          <button
            type="button"
            className={iconButton}
            data-move={`${fee.key}:-1`}
            disabled={index === 0}
            aria-label={`Subir «${name}»`}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={iconButton}
            data-move={`${fee.key}:1`}
            disabled={index === total - 1}
            aria-label={`Bajar «${name}»`}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${iconButton} text-red-700 hover:bg-red-50`}
            aria-label={`Quitar «${name}»`}
            onClick={onRemove}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid min-w-0 content-start gap-1 max-sm:col-start-1 max-sm:row-start-3 sm:col-start-2 sm:col-end-4">
        {showDetail ? (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <label
                htmlFor={`${id}-detail`}
                className="shrink-0 text-xs font-bold text-ink-600"
              >
                Aclaración
              </label>
              <input
                ref={detailRef}
                id={`${id}-detail`}
                className={`${inputClass} min-w-0 flex-1 py-1.5 text-sm`}
                value={fee.detail}
                maxLength={120}
                placeholder="Ej.: por día"
                {...describe('detail')}
                onChange={(event) => onChange('detail', event.target.value)}
              />
            </div>
            {error('detail') && (
              <p id={`${id}-detail-error`} className={errorText}>
                {error('detail')}
              </p>
            )}
          </>
        ) : (
          editable && (
            <button
              type="button"
              onClick={() => {
                setDetailOpen(true)
                // Focus once the field exists.
                requestAnimationFrame(() => detailRef.current?.focus())
              }}
              className="inline-flex min-h-8 items-center gap-1 justify-self-start rounded-md px-1 text-xs font-bold text-river-600 hover:bg-mist-50"
            >
              <Plus size={14} aria-hidden="true" />
              Aclaración
              <span className="sr-only"> para «{name}»</span>
            </button>
          )
        )}
      </div>
    </li>
  )
}

function NewBadge() {
  return (
    <span className="shrink-0 rounded-full bg-sun-400 px-2 py-0.5 text-xs font-bold text-navy-950">
      Nueva
    </span>
  )
}
