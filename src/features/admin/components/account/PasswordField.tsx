import { useId } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass } from '../ui'

export function PasswordField({
  name,
  label,
  value,
  visible,
  error,
  announce,
  onChange,
  onToggle,
}: {
  name: 'password' | 'confirm'
  label: string
  value: string
  visible: boolean
  error?: string | undefined
  announce: boolean
  onChange: (value: string) => void
  onToggle: () => void
}) {
  const id = useId()
  const Icon = visible ? EyeOff : Eye
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
          className={`${inputClass} pr-12 aria-invalid:border-red-500`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${name === 'password' ? 'nueva contraseña' : 'confirmación de contraseña'}`}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute top-0 right-0 grid size-11 place-items-center rounded-r-lg text-ink-600 hover:text-navy-900"
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      </div>
      <div
        id={`${id}-help`}
        className="mt-2 flex min-w-0 justify-between gap-3 text-xs leading-5 text-ink-600"
      >
        <span>
          {name === 'password'
            ? 'Entre 12 y 128 caracteres.'
            : 'Escribí exactamente la misma contraseña.'}
        </span>
        {name === 'password' && (
          <span className="shrink-0 tabular-nums">{value.length}/128</span>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role={announce ? 'alert' : undefined}
          className="mt-2 text-xs font-semibold text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  )
}
