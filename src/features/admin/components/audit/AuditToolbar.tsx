import { ListFilter, RefreshCw, X } from 'lucide-react'
import { useId } from 'react'
import { auditFilters } from '../../audit-labels'
import { inputClass, secondaryClass } from '../ui'

export function AuditToolbar({
  value,
  busy,
  onFilter,
  onRefresh,
}: {
  value: string
  busy: boolean
  onFilter: (section: string) => void
  onRefresh: () => void
}) {
  const id = useId()
  return (
    <div className="border-b border-navy-900/10 p-4 sm:px-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="mb-2 flex items-center gap-2 text-xs font-bold text-ink-600"
          >
            <ListFilter size={15} aria-hidden="true" />
            Filtrar por sección
          </label>
          <select
            id={id}
            value={value}
            onChange={(event) => onFilter(event.target.value)}
            className={`${inputClass} min-h-11`}
          >
            <option value="">Todas las secciones</option>
            {auditFilters.map(([key, label]) => (
              <option key={key} value={`${key}.`}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {value && (
          <button
            type="button"
            className={secondaryClass}
            onClick={() => onFilter('')}
          >
            <X size={15} aria-hidden="true" />
            Limpiar filtro
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          className={secondaryClass}
          onClick={onRefresh}
        >
          <RefreshCw
            size={16}
            aria-hidden="true"
            className={busy ? 'motion-safe:animate-spin' : ''}
          />
          Actualizar actividad
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-600">
        El filtro se aplica al seleccionar. Las fechas y horas corresponden a
        Argentina.
      </p>
    </div>
  )
}
