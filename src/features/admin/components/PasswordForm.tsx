import { Check, Circle, LoaderCircle, Save } from 'lucide-react'
import { usePasswordForm } from '../hooks/usePasswordForm'
import { PasswordField } from './account/PasswordField'
import { Feedback, primaryClass, secondaryClass } from './ui'

export function PasswordForm({ onSaved }: { onSaved?: () => void }) {
  const editor = usePasswordForm(onSaved)
  const lengthValid =
    editor.values.password.length >= 12 && editor.values.password.length <= 128
  const matches =
    Boolean(editor.values.confirm) &&
    editor.values.password === editor.values.confirm
  return (
    <form
      noValidate
      onSubmit={editor.submit}
      aria-label="Cambiar contraseña"
      aria-busy={editor.request.isPending}
      className="grid min-w-0 gap-5"
    >
      <fieldset
        disabled={editor.request.isPending}
        className="grid min-w-0 gap-5"
      >
        <legend className="sr-only">Nueva contraseña y confirmación</legend>
        <PasswordField
          name="password"
          label="Nueva contraseña"
          value={editor.values.password}
          visible={editor.visible.password}
          error={editor.errors.password}
          announce={Boolean(editor.errors.password)}
          onChange={(value) => editor.change('password', value)}
          onToggle={() => editor.toggle('password')}
        />
        <PasswordField
          name="confirm"
          label="Repetí la contraseña"
          value={editor.values.confirm}
          visible={editor.visible.confirm}
          error={editor.errors.confirm}
          announce={!editor.errors.password}
          onChange={(value) => editor.change('confirm', value)}
          onToggle={() => editor.toggle('confirm')}
        />
      </fieldset>
      <ul
        aria-label="Comprobaciones de la contraseña"
        className="grid gap-2 rounded-xl bg-mist-50 p-4 text-xs leading-5"
      >
        {[
          { valid: lengthValid, label: 'Longitud de 12 a 128 caracteres' },
          { valid: matches, label: 'La confirmación coincide' },
        ].map(({ valid, label }) => {
          const Icon = valid ? Check : Circle
          return (
            <li
              key={label}
              className={`flex items-center gap-2 ${valid ? 'font-semibold text-emerald-800' : 'text-ink-600'}`}
            >
              <Icon size={14} aria-hidden="true" />
              <span>
                {label}
                {valid && <span className="sr-only">: comprobado</span>}
              </span>
            </li>
          )
        })}
      </ul>
      <Feedback
        error={editor.request.error}
        success={editor.request.isSuccess ? 'Contraseña actualizada.' : null}
      />
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
            <Save size={16} aria-hidden="true" />
          )}
          {editor.request.isPending ? 'Guardando…' : 'Guardar contraseña'}
        </button>
        {editor.dirty && (
          <button
            type="button"
            onClick={(event) => {
              const form = event.currentTarget.form
              editor.reset()
              form
                ?.querySelector<HTMLInputElement>('[name="password"]')
                ?.focus()
            }}
            disabled={editor.request.isPending}
            className={secondaryClass}
          >
            Descartar cambios de contraseña
          </button>
        )}
      </div>
    </form>
  )
}
