import { useEffect, useRef } from 'react'
import { ArrowLeft, LoaderCircle, Save, Send } from 'lucide-react'
import type { Account } from '../schemas/admin'
import { useUserEditor } from '../hooks/useUserEditor'
import { Feedback, primaryClass, secondaryClass } from './ui'
import { RolePicker } from './user-editor/RolePicker'
import { UserAccessFields } from './user-editor/UserAccessFields'
import { UserAccessSummary } from './user-editor/UserAccessSummary'
import { UserAccessSuccess } from './user-editor/UserAccessSuccess'
import { RemoveUser } from './user-editor/RemoveUser'

export function UserEditor({
  account,
  userId,
  onClose,
}: {
  account: Account | null
  userId: string
  onClose: () => void
}) {
  const editor = useUserEditor(account, userId, onClose)
  const { values, errors, operation, busy } = editor
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const Icon = account ? Save : Send
  return (
    <>
      <header className="mb-7">
        <button
          type="button"
          onClick={editor.close}
          disabled={busy}
          className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-ink-600 hover:text-navy-900 disabled:opacity-50"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a usuarios
        </button>
        <p className="mb-2 text-[11px] font-extrabold tracking-[0.18em] text-ink-600 uppercase">
          Equipo y accesos
        </p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          {account ? 'Gestionar acceso' : 'Invitar usuario'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
          {account
            ? 'Revisá los roles y el estado de la cuenta antes de aplicar los cambios.'
            : 'Ingresá el correo y elegí los roles. La persona recibirá un enlace para configurar su cuenta.'}
        </p>
      </header>
      {operation.isSuccess ? (
        <UserAccessSuccess
          editing={Boolean(account)}
          email={values.email.trim()}
          warning={typeof operation.data === 'string' ? operation.data : null}
          onClose={editor.close}
        />
      ) : (
        <form
          noValidate
          onSubmit={editor.submit}
          aria-busy={busy}
          className="min-w-0"
        >
          {editor.self && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              Otro administrador general debe modificar tu acceso. Podés
              gestionar tu correo y contraseña desde Mi cuenta.
            </p>
          )}
          <fieldset disabled={busy || editor.self} className="min-w-0">
            <legend className="sr-only">Datos y roles del usuario</legend>
            <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
              <div className="grid min-w-0 gap-5">
                <UserAccessFields
                  values={values}
                  editing={Boolean(account)}
                  error={errors.email}
                  onEmail={(email) => editor.change('email', email)}
                  onActive={(active) => editor.change('active', active)}
                />
                <RolePicker
                  list={editor.list}
                  roles={editor.roles}
                  selected={values.roles}
                  error={errors.roles}
                  onToggle={editor.toggleRole}
                />
              </div>
              <UserAccessSummary values={values} editing={Boolean(account)} />
            </div>
          </fieldset>
          <div className="sticky bottom-0 z-10 mt-6 rounded-xl border border-navy-900/10 bg-white/95 p-4 shadow-card backdrop-blur-sm">
            {Object.keys(errors).length > 0 && (
              <p
                role="alert"
                className="mb-3 text-sm font-semibold text-red-700"
              >
                Revisá los campos marcados antes de continuar.
              </p>
            )}
            <Feedback error={operation.error} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-ink-600">
                {editor.dirty
                  ? 'Cambios sin guardar'
                  : account
                    ? 'Sin cambios pendientes'
                    : 'Completá el correo y seleccioná al menos un rol'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={editor.close}
                  disabled={busy}
                  className={secondaryClass}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    busy ||
                    editor.self ||
                    editor.list.query.isPending ||
                    editor.list.query.isError ||
                    (Boolean(account) && !editor.dirty)
                  }
                  className={primaryClass}
                >
                  {busy ? (
                    <LoaderCircle
                      size={16}
                      aria-hidden="true"
                      className="motion-safe:animate-spin"
                    />
                  ) : (
                    <Icon size={16} aria-hidden="true" />
                  )}
                  {busy
                    ? 'Procesando…'
                    : account
                      ? 'Guardar acceso'
                      : 'Enviar invitación'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
      {account && !editor.self && !operation.isSuccess && (
        <RemoveUser account={account} disabled={busy} onRemoved={onClose} />
      )}
    </>
  )
}
