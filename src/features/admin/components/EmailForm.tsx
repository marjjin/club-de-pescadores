import { useId } from 'react'
import { CheckCircle2, Info, LoaderCircle, Send } from 'lucide-react'
import { useEmailForm } from '../hooks/useEmailForm'
import { Feedback, inputClass, primaryClass, secondaryClass } from './ui'

const fields = [
  { name: 'email', label: 'Nuevo correo electrónico' },
  { name: 'confirmation', label: 'Repetí el nuevo correo' },
] as const

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const editor = useEmailForm(currentEmail)
  const id = useId()
  return (
    <form
      noValidate
      onSubmit={editor.submit}
      aria-label="Cambiar correo de acceso"
      aria-busy={editor.request.isPending}
      className="grid min-w-0 gap-5"
    >
      <div className="min-w-0 rounded-xl bg-mist-50 p-4">
        <p className="text-xs font-semibold text-ink-600">Correo actual</p>
        <p className="mt-1 text-sm font-bold wrap-anywhere">{currentEmail}</p>
        <p className="mt-2 text-xs leading-5 text-ink-600">
          El cambio conserva tu cuenta, contraseña y permisos.
        </p>
      </div>
      {editor.request.isSuccess ? (
        <div
          role="status"
          className="flex min-w-0 items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <CheckCircle2
            size={20}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-emerald-800"
          />
          <div className="min-w-0 text-sm leading-6 text-emerald-900">
            <p className="font-extrabold">
              Solicitud enviada · Confirmación pendiente
            </p>
            <p className="mt-2">
              Revisá el correo actual y{' '}
              <strong className="wrap-anywhere">
                {editor.values.email.trim()}
              </strong>{' '}
              para confirmar el cambio. Hasta completarlo, seguí ingresando con
              el correo actual.
            </p>
          </div>
        </div>
      ) : (
        <>
          <fieldset
            disabled={editor.request.isPending}
            className="grid min-w-0 gap-5"
          >
            <legend className="sr-only">Nuevo correo y confirmación</legend>
            {fields.map(({ name: key, label }) => {
              const name = key
              const error = editor.errors[key]
              return (
                <div key={name} className="min-w-0">
                  <label
                    htmlFor={`${id}-${name}`}
                    className="mb-2 block text-sm font-bold"
                  >
                    {label}
                  </label>
                  <input
                    id={`${id}-${name}`}
                    name={name}
                    type="email"
                    value={editor.values[key]}
                    onChange={(event) => editor.change(key, event.target.value)}
                    autoComplete={name === 'email' ? 'email' : 'off'}
                    placeholder="nombre@correo.com"
                    required
                    maxLength={254}
                    aria-invalid={Boolean(error)}
                    aria-describedby={`${id}-${name}-help${error ? ` ${id}-${name}-error` : ''}`}
                    className={`${inputClass} aria-invalid:border-red-500`}
                  />
                  <p
                    id={`${id}-${name}-help`}
                    className="mt-2 text-xs leading-5 text-ink-600"
                  >
                    {name === 'email'
                      ? 'La dirección que querés usar para ingresar al panel.'
                      : 'Verificá que no haya errores de escritura.'}
                  </p>
                  {error && (
                    <p
                      id={`${id}-${name}-error`}
                      role={
                        key === 'email' || !editor.errors.email
                          ? 'alert'
                          : undefined
                      }
                      className="mt-2 text-xs font-semibold text-red-700"
                    >
                      {error}
                    </p>
                  )}
                </div>
              )
            })}
          </fieldset>
          <div className="flex items-start gap-2.5 rounded-xl border border-navy-900/10 p-4 text-xs leading-5 text-ink-600">
            <Info
              size={17}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-river-600"
            />
            <p>
              Revisá ambas casillas y seguí los enlaces de confirmación. Tu
              correo de acceso cambia cuando completás ese proceso.
            </p>
          </div>
          <Feedback error={editor.request.error} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={editor.request.isPending}
              className={primaryClass}
            >
              {editor.request.isPending ? (
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                />
              ) : (
                <Send size={16} aria-hidden="true" />
              )}
              {editor.request.isPending
                ? 'Enviando…'
                : 'Solicitar cambio de correo'}
            </button>
            {editor.dirty && (
              <button
                type="button"
                onClick={(event) => {
                  const form = event.currentTarget.form
                  editor.reset()
                  form
                    ?.querySelector<HTMLInputElement>('[name="email"]')
                    ?.focus()
                }}
                disabled={editor.request.isPending}
                className={secondaryClass}
              >
                Descartar cambios de correo
              </button>
            )}
          </div>
        </>
      )}
    </form>
  )
}
