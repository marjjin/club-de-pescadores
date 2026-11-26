import { inputClass } from '../ui'

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/**
 * Month and year as two selects: Firefox and desktop Safari render
 * <input type="month"> as a bare text box with no picker.
 */
export function ValidFromPicker({
  value,
  invalid,
  onChange,
}: {
  /** YYYY-MM */
  value: string
  invalid: boolean
  onChange: (value: string) => void
}) {
  const [year = '', month = ''] = value.split('-')
  const current = new Date().getFullYear()
  const years = [
    ...new Set([Number(year) || current, current - 1, current, current + 1]),
  ].sort()
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-bold text-navy-900">
        Vigentes desde
      </legend>
      <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
        <label className="grid gap-1 text-xs font-bold text-ink-600">
          Mes
          <select
            className={inputClass}
            value={month}
            data-field="month"
            aria-invalid={invalid}
            onChange={(event) => onChange(`${year}-${event.target.value}`)}
          >
            {months.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, '0')}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-ink-600">
          Año
          <select
            className={inputClass}
            value={year}
            aria-invalid={invalid}
            onChange={(event) => onChange(`${event.target.value}-${month}`)}
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  )
}
