import { useState } from 'react'
import { Plus, ShieldCheck } from 'lucide-react'
import { useAdminList } from '../hooks/useAdminData'
import { useRoleActions } from '../hooks/useAdminActions'
import type { Role } from '../schemas/admin'
import { CatalogToolbar } from './CatalogToolbar'
import { CatalogListSkeleton } from './CatalogListSkeleton'
import { RoleEditor } from './role-editor/RoleEditor'
import { RoleRow } from './roles/RoleRow'
import { RolesListMessage } from './roles/RolesListMessage'
import { Feedback, Pagination, primaryClass, SectionHeading } from './ui'

export function RolesSection({ userId }: { userId: string }) {
  const list = useAdminList('roles', userId)
  const { remove } = useRoleActions()
  const [editing, setEditing] = useState<Role | 'new' | null>(null)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const roles = list.rows.filter((row): row is Role => 'is_system' in row)
  const failed = list.query.isError && !roles.length
  const filtered = Boolean(list.search) || list.page > 1
  function apply(value: string) {
    setSearch(value.trim())
    list.filter('all', value.trim())
  }
  function create() {
    if (remove.isPending) return
    remove.reset()
    setNotice(null)
    setEditing('new')
  }
  if (editing)
    return (
      <RoleEditor
        key={editing === 'new' ? 'new' : editing.id}
        role={editing === 'new' ? null : editing}
        userId={userId}
        onClose={() => setEditing(null)}
        onSaved={(name) => {
          setNotice(`Rol «${name}» guardado.`)
          setEditing(null)
        }}
      />
    )
  return (
    <>
      <SectionHeading
        title="Roles y permisos"
        description="Definí las responsabilidades del equipo. Cada rol reúne las acciones que pueden realizar sus cuentas asignadas."
        action={
          <button
            type="button"
            className={primaryClass}
            disabled={remove.isPending}
            onClick={create}
          >
            <Plus size={17} aria-hidden="true" />
            Crear rol
          </button>
        }
      />
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-river-600/15 bg-white p-4">
        <ShieldCheck
          size={20}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-river-600"
        />
        <p className="text-sm leading-6 text-ink-600">
          El administrador general conserva el control completo. Los roles
          personalizados combinan permisos; sus paneles se habilitarán en una
          etapa posterior.
        </p>
      </div>
      <section
        aria-label="Roles del equipo"
        className="min-w-0 overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
      >
        <CatalogToolbar
          kind="roles"
          search={search}
          applied={list.search}
          busy={list.query.isFetching || remove.isPending}
          onChange={setSearch}
          onSearch={apply}
          onRefresh={() => {
            void list.query.refetch()
          }}
        />
        {(remove.error ||
          notice ||
          remove.isSuccess ||
          (list.query.isError && roles.length > 0)) && (
          <div className="p-4 sm:px-6">
            <Feedback
              error={remove.error ?? (roles.length ? list.query.error : null)}
              success={notice ?? (remove.isSuccess ? 'Rol eliminado.' : null)}
            />
          </div>
        )}
        <div aria-busy={list.query.isFetching}>
          {list.query.isPending ? (
            <CatalogListSkeleton label="Cargando roles" />
          ) : failed || !roles.length ? (
            <RolesListMessage
              failed={failed}
              error={list.query.error}
              filtered={filtered}
              onRetry={() => {
                void list.query.refetch()
              }}
              onReset={() => apply('')}
              onCreate={create}
            />
          ) : (
            <ul className="divide-y divide-navy-900/10">
              {roles.map((role) => (
                <RoleRow
                  key={role.id}
                  role={role}
                  busy={remove.isPending}
                  onEdit={() => {
                    setNotice(null)
                    remove.reset()
                    setEditing(role)
                  }}
                  onRemove={() => {
                    if (
                      !window.confirm(
                        `¿Eliminar el rol «${role.name}»? Solo se puede eliminar si no tiene usuarios asignados.`,
                      )
                    )
                      return
                    setNotice(null)
                    remove.mutate(role)
                  }}
                />
              ))}
            </ul>
          )}
        </div>
        {!list.query.isPending &&
          !failed &&
          (roles.length > 0 || list.page > 1) && (
            <footer className="border-t border-navy-900/10 bg-mist-50/40 px-4 py-4 sm:px-6">
              <p role="status" className="text-xs text-ink-600">
                {roles.length}{' '}
                {roles.length === 1
                  ? 'rol en esta página'
                  : 'roles en esta página'}{' '}
                · Más recientes primero
              </p>
              {(list.hasNext || list.page > 1) && (
                <Pagination
                  {...list}
                  pending={list.query.isFetching || remove.isPending}
                />
              )}
            </footer>
          )}
      </section>
      <p className="mt-4 text-center text-xs leading-5 text-ink-600">
        Solo se pueden eliminar roles sin usuarios asignados. Modificar los
        permisos afecta a todas las cuentas que tengan ese rol.
      </p>
    </>
  )
}
