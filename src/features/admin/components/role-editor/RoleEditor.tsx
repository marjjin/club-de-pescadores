import { ArrowLeft, LoaderCircle, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { Role } from '../../schemas/admin'
import { useRoleEditor } from '../../hooks/useRoleEditor'
import { Feedback, inputClass, primaryClass, secondaryClass } from '../ui'
import { PermissionsPicker } from './PermissionsPicker'
import { RoleSummary } from './RoleSummary'

export function RoleEditor({
  role,
  userId,
  onClose,
  onSaved = onClose,
}: {
  role: Role | null
  userId: string
  onClose: () => void
  onSaved?: (name: string) => void
}) {
  const editor = useRoleEditor(role, userId, onClose, onSaved)
  const heading = useRef<HTMLHeadingElement>(null)
  const id = useId()
  const selected = role?.is_system
    ? editor.groups.flatMap((group) =>
        group.permissions.map((permission) => permission.id),
      )
    : editor.selected
  useEffect(() => {
    heading.current?.focus()
  }, [])
  return (
    <>
      <header className="mb-7">
        <button
          type="button"
          onClick={editor.close}
          disabled={editor.save.isPending}
          className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-ink-600 hover:text-navy-900 disabled:opacity-50"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a roles
        </button>
        <p className="mb-2 text-[11px] font-extrabold tracking-[0.18em] text-ink-600 uppercase">
          Equipo y accesos · Roles
        </p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          {role ? 'Editar rol' : 'Crear rol'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
          Definí las responsabilidades del equipo. Elegí los permisos por módulo
          y revisá el alcance antes de guardar.
        </p>
      </header>
      <form
        noValidate
        onSubmit={editor.submit}
        aria-busy={editor.save.isPending}
        className="min-w-0"
      >
        {role?.is_system && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            El administrador general es un rol protegido. Sus permisos y su
            nombre no se pueden modificar.
          </p>
        )}
        <fieldset
          disabled={editor.save.isPending || role?.is_system}
          className="min-w-0"
        >
          <legend className="sr-only">Nombre y permisos del rol</legend>
          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <div className="grid min-w-0 gap-5">
              <section className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold">
                  <ShieldCheck size={18} aria-hidden="true" />
                  Datos del rol
                </h2>
                <label
                  htmlFor={`${id}-name`}
                  className="mb-2 block text-sm font-bold"
                >
                  Nombre del rol
                </label>
                <input
                  id={`${id}-name`}
                  name="name"
                  value={editor.name}
                  onChange={(event) => editor.changeName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="off"
                  placeholder="Por ejemplo: Editor de noticias"
                  aria-invalid={Boolean(editor.errors.name)}
                  aria-describedby={`${id}-help${editor.errors.name ? ` ${id}-error` : ''}`}
                  className={`${inputClass} aria-invalid:border-red-500`}
                />
                <div
                  id={`${id}-help`}
                  className="mt-2 flex min-w-0 justify-between gap-3 text-xs leading-5 text-ink-600"
                >
                  <span>Usá un nombre claro, según la responsabilidad.</span>
                  <span className="shrink-0 tabular-nums">
                    {editor.name.length}/80
                  </span>
                </div>
                {editor.errors.name && (
                  <p
                    id={`${id}-error`}
                    className="mt-2 text-xs font-semibold text-red-700"
                  >
                    {editor.errors.name}
                  </p>
                )}
              </section>
              <PermissionsPicker
                groups={editor.groups}
                selected={selected}
                pending={editor.permissions.isPending}
                failed={editor.permissions.isError}
                error={editor.errors.permissions}
                onRetry={() => {
                  void editor.permissions.refetch()
                }}
                onToggle={editor.toggle}
                onToggleGroup={editor.toggleGroup}
              />
            </div>
            <RoleSummary
              name={editor.name}
              selected={selected}
              system={Boolean(role?.is_system)}
              groups={editor.groups}
              catalog={editor.permissions.data ?? []}
            />
          </div>
        </fieldset>
        <div className="sticky bottom-0 z-10 mt-6 rounded-xl border border-navy-900/10 bg-white/95 p-4 shadow-card backdrop-blur-sm">
          {Object.keys(editor.errors).length > 0 && (
            <p role="alert" className="mb-3 text-sm font-semibold text-red-700">
              Revisá los campos marcados antes de guardar el rol.
            </p>
          )}
          <Feedback error={editor.save.error} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-ink-600">
              {editor.dirty
                ? 'Cambios sin guardar'
                : role
                  ? 'Sin cambios pendientes'
                  : 'Completá el nombre y elegí el alcance del rol'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={editor.close}
                disabled={editor.save.isPending}
                className={secondaryClass}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  editor.save.isPending ||
                  role?.is_system ||
                  editor.permissions.isPending ||
                  editor.permissions.isError ||
                  (Boolean(role) && !editor.dirty)
                }
                className={primaryClass}
              >
                {editor.save.isPending ? (
                  <LoaderCircle
                    size={16}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                {editor.save.isPending ? 'Guardando…' : 'Guardar rol'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
