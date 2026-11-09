import { useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import type { Role } from '../../schemas/admin'
import type { useAdminList } from '../../hooks/useAdminData'
import { inputClass, Loading, Pagination, secondaryClass } from '../ui'

export function RolePicker({
  list,
  roles,
  selected,
  error,
  onToggle,
}: {
  list: ReturnType<typeof useAdminList>
  roles: Role[]
  selected: string[]
  error?: string | undefined
  onToggle: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  function apply(value = search) {
    list.filter('all', value.trim())
  }
  return (
    <section
      aria-label="Selección de roles"
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <fieldset
        data-role-picker
        tabIndex={-1}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? 'user-roles-help user-roles-error' : 'user-roles-help'
        }
        className="min-w-0"
      >
        <legend className="mb-2 flex flex-wrap items-center gap-2 text-base font-extrabold">
          <ShieldCheck size={18} aria-hidden="true" />
          Roles asignados{' '}
          <span className="rounded-full bg-mist-50 px-2.5 py-1 text-xs tabular-nums">
            {selected.length}/10
          </span>
        </legend>
        <p id="user-roles-help" className="mb-5 text-xs leading-5 text-ink-600">
          Elegí entre 1 y 10 roles. Las selecciones se conservan al buscar o
          cambiar de página.
        </p>
        <div className="mb-4 flex min-w-0 gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-3.5 left-3 text-ink-600"
            />
            <input
              type="search"
              aria-label="Buscar rol por inicio del nombre"
              placeholder="Buscar rol por inicio del nombre…"
              maxLength={100}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  apply()
                }
              }}
              className={`${inputClass} pl-9`}
            />
          </div>
          <button
            type="button"
            disabled={list.query.isFetching}
            onClick={() => apply()}
            className={secondaryClass}
          >
            Buscar rol
          </button>
        </div>
        {list.search && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              apply('')
            }}
            className="mb-4 min-h-9 text-xs font-bold text-river-600 hover:underline"
          >
            Limpiar búsqueda de roles
          </button>
        )}
        {error && (
          <p
            id="user-roles-error"
            className="mb-4 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}
        {list.query.isPending ? (
          <Loading />
        ) : list.query.isError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p>No pudimos cargar los roles. Conservamos tu selección.</p>
            <button
              type="button"
              className={`${secondaryClass} mt-3`}
              onClick={() => {
                void list.query.refetch()
              }}
            >
              Reintentar roles
            </button>
          </div>
        ) : !roles.length ? (
          <p className="rounded-xl bg-mist-50 p-5 text-sm text-ink-600">
            {list.search
              ? 'No hay roles con ese inicio de nombre.'
              : 'Todavía no hay roles disponibles para asignar.'}
          </p>
        ) : (
          <div className="grid gap-3">
            {roles.map((role) => {
              const checked = selected.includes(role.id)
              return (
                <label
                  key={role.id}
                  className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-disabled:cursor-not-allowed has-disabled:opacity-60 ${checked ? 'border-river-600/40 bg-mist-50 ring-1 ring-river-600/10' : 'border-navy-900/10 hover:bg-mist-50/60'}`}
                >
                  <input
                    type="checkbox"
                    aria-label={role.name}
                    checked={checked}
                    disabled={!checked && selected.length >= 10}
                    onChange={() => onToggle(role.id)}
                    className="mt-1 size-4 shrink-0 accent-river-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold wrap-anywhere">
                        {role.name}
                      </span>
                      {role.is_system && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                          Acceso completo
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-ink-600">
                      {role.is_system
                        ? 'Puede administrar contenido, usuarios, roles y permisos del club.'
                        : `${role.permissions.length} ${role.permissions.length === 1 ? 'permiso configurado' : 'permisos configurados'}.`}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
        {(list.hasNext || list.page > 1) && (
          <Pagination {...list} pending={list.query.isFetching} />
        )}
        {selected.length === 10 && (
          <p role="status" className="mt-4 text-xs font-semibold text-ink-600">
            Alcanzaste el máximo de 10 roles. Quitá uno para seleccionar otro.
          </p>
        )}
      </fieldset>
    </section>
  )
}
