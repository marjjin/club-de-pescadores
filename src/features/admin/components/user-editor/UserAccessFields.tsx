import { useId } from 'react'
import { Mail, UserCheck, UserX } from 'lucide-react'
import type { UserAccessValues } from '../../user-access'
import { inputClass } from '../ui'

export function UserAccessFields({
  values,
  editing,
  error,
  onEmail,
  onActive,
}: {
  values: UserAccessValues
  editing: boolean
  error?: string | undefined
  onEmail: (email: string) => void
  onActive: (active: boolean) => void
}) {
  const id = useId()
  return (
    <>
      <section className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold">
          <Mail size={18} aria-hidden="true" />
          {editing ? 'Cuenta del usuario' : 'Datos de la invitación'}
        </h2>
        <label htmlFor={`${id}-email`} className="mb-2 block text-sm font-bold">
          Correo electrónico
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => onEmail(event.target.value)}
          readOnly={editing}
          required
          autoComplete="email"
          maxLength={254}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
          placeholder="nombre@correo.com"
          className={`${inputClass} aria-invalid:border-red-500 read-only:bg-mist-50`}
        />
        <p id={`${id}-help`} className="mt-2 text-xs leading-5 text-ink-600">
          {editing
            ? 'El correo identifica la cuenta. Su titular puede solicitar un cambio desde Mi cuenta.'
            : 'Usá el correo personal de quien va a recibir la invitación. No necesita una contraseña creada por vos.'}
        </p>
        {error && (
          <p
            id={`${id}-error`}
            className="mt-2 text-xs font-semibold text-red-700"
          >
            {error}
          </p>
        )}
      </section>
      {editing && (
        <section className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6">
          <fieldset className="min-w-0">
            <legend className="mb-2 text-base font-extrabold">
              Estado del acceso
            </legend>
            <p className="mb-4 text-xs leading-5 text-ink-600">
              Desactivar la cuenta conserva sus datos y bloquea el acceso al
              panel.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  active: true,
                  label: 'Acceso activo',
                  text: 'Puede usar los permisos de sus roles asignados.',
                  icon: UserCheck,
                },
                {
                  active: false,
                  label: 'Acceso desactivado',
                  text: 'No puede consultar ni modificar datos del panel.',
                  icon: UserX,
                },
              ].map(({ active, label, text, icon: Icon }) => (
                <label
                  key={label}
                  className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-4 ${values.active === active ? (active ? 'border-river-600/40 bg-mist-50' : 'border-amber-300 bg-amber-50') : 'border-navy-900/10 hover:bg-mist-50/60'}`}
                >
                  <input
                    type="radio"
                    name="active"
                    aria-label={label}
                    checked={values.active === active}
                    onChange={() => onActive(active)}
                    className="mt-1 size-4 shrink-0 accent-river-600"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Icon size={16} aria-hidden="true" />
                      {label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-ink-600">
                      {text}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      )}
    </>
  )
}
