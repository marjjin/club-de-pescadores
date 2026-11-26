import { useId } from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { FEE_ICONS, feeIcons } from '@/features/fees'
import type { FeeErrors } from '../../fee-editor'
import type { FeeDraft } from '../../schemas/fees'
import { inputClass } from '../ui'

const iconButton =
  'grid size-11 place-items-center rounded-lg text-navy-900 hover:bg-mist-50 disabled:opacity-30'
const label = 'text-xs font-bold text-ink-600'
export type FeeRowField = 'name' | 'detail' | 'icon' | 'price'

export function FeeRowEditor({
  fee,
  index,
  total,
  errors,
  editable,
  onChange,
  onMove,
  onRemove,
}: {
  fee: FeeDraft
  index: number
  total: number
  errors: FeeErrors
  editable: boolean
  onChange: (name: FeeRowField, value: string) => void
  onMove: (step: -1 | 1) => void
  onRemove: () => void
}) {
  const id = useId()
  const Icon = feeIcons[fee.icon].icon
  const name = fee.name.trim() || `Fila ${index + 1}`
  const error = (field: string) => errors[`${fee.key}.${field}`]
  const describe = (field: string) => ({
    'aria-invalid': Boolean(error(field)),
    'aria-describedby': error(field) ? `${id}-${field}-error` : undefined,
    'data-field': `${fee.key}.${field}`,
  })
  return (
    <li className="grid gap-x-3 gap-y-2 border-t border-navy-900/10 py-4 first:border-t-0 sm:grid-cols-[2.75rem_minmax(0,1fr)_9.5rem_auto]">
      {/* Shows the chosen icon as it will look on the site. */}
      <span
        aria-hidden="true"
        className="hidden size-11 place-items-center self-end rounded-lg bg-navy-900 text-sun-400 sm:grid"
      >
        <Icon size={20} />
      </span>
      <div className="grid min-w-0 gap-1">
        <label htmlFor={`${id}-name`} className={label}>
          Nombre
        </label>
        <input
          id={`${id}-name`}
          className={inputClass}
          value={fee.name}
          maxLength={60}
          placeholder="Ej.: Social"
          {...describe('name')}
          onChange={(event) => onChange('name', event.target.value)}
        />
      </div>
      <div className="grid gap-1">
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
      </div>
      {editable && (
        <div className="flex items-end justify-end gap-0.5 max-sm:order-last">
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
      <div className="grid min-w-0 gap-3 sm:col-start-2 sm:col-end-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="grid gap-1">
          <label htmlFor={`${id}-icon`} className={label}>
            Ícono
          </label>
          <select
            id={`${id}-icon`}
            className={inputClass}
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
        <div className="grid min-w-0 gap-1">
          <label htmlFor={`${id}-detail`} className={label}>
            Aclaración (opcional)
          </label>
          <input
            id={`${id}-detail`}
            className={inputClass}
            value={fee.detail}
            maxLength={120}
            placeholder="Ej.: por día"
            {...describe('detail')}
            onChange={(event) => onChange('detail', event.target.value)}
          />
        </div>
      </div>
      {(['name', 'price', 'detail'] as const).map(
        (field) =>
          error(field) && (
            <p
              key={field}
              id={`${id}-${field}-error`}
              className="text-sm font-semibold text-red-700 sm:col-start-2 sm:col-end-4"
            >
              {error(field)}
            </p>
          ),
      )}
    </li>
  )
}
