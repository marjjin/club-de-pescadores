import { useState } from 'react'
import { AlertCircle, SearchX, UserRoundPlus, UsersRound } from 'lucide-react'
import { useAdminList } from '../hooks/useAdminData'
import type { Account } from '../schemas/admin'
import { UserEditor } from './UserEditor'
import { CatalogListSkeleton } from './CatalogListSkeleton'
import { UserRow } from './users/UserRow'
import { UsersToolbar } from './users/UsersToolbar'
import {
  Feedback,
  Pagination,
  primaryClass,
  secondaryClass,
  SectionHeading,
} from './ui'

export function UsersSection({ userId }: { userId: string }) {
  const list = useAdminList('users', userId)
  const [editing, setEditing] = useState<Account | 'new' | null>(null)
  const [search, setSearch] = useState('')
  const accounts = list.rows.filter((row): row is Account => 'email' in row)
  const failed = list.query.isError && !accounts.length
  const filtered = Boolean(list.search) || list.page > 1
  function apply(value: string) {
    setSearch(value.trim())
    list.filter('all', value.trim())
  }
  if (editing)
    return (
      <UserEditor
        key={editing === 'new' ? 'new' : editing.id}
        account={editing === 'new' ? null : editing}
        userId={userId}
        onClose={() => setEditing(null)}
      />
    )
  return (
    <>
      <SectionHeading
        title="Usuarios"
        description="Invitá al equipo y revisá quién tiene acceso. Los roles definen qué puede hacer cada persona."
        action={
          <button
            type="button"
            className={primaryClass}
            onClick={() => setEditing('new')}
          >
            <UserRoundPlus size={17} aria-hidden="true" />
            Invitar usuario
          </button>
        }
      />
      <section
        aria-label="Usuarios del equipo"
        className="min-w-0 overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
      >
        <UsersToolbar
          search={search}
          applied={list.search}
          busy={list.query.isFetching}
          onChange={setSearch}
          onSearch={apply}
          onRefresh={() => {
            void list.query.refetch()
          }}
        />
        {list.query.error && accounts.length > 0 && (
          <div className="p-4 sm:px-6">
            <Feedback error={list.query.error} />
            <p className="mt-2 text-xs text-ink-600">
              Mostramos la última lista disponible.
            </p>
          </div>
        )}
        <div aria-busy={list.query.isFetching}>
          {list.query.isPending ? (
            <CatalogListSkeleton label="Cargando usuarios" />
          ) : failed ? (
            <div className="grid min-h-72 justify-items-center gap-4 px-6 py-10 text-center">
              <AlertCircle
                size={32}
                aria-hidden="true"
                className="text-ink-600"
              />
              <h2 className="text-lg font-extrabold">
                No pudimos cargar los usuarios
              </h2>
              <Feedback error={list.query.error} />
              <button
                type="button"
                className={secondaryClass}
                onClick={() => {
                  void list.query.refetch()
                }}
              >
                Reintentar usuarios
              </button>
            </div>
          ) : !accounts.length ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
              {filtered ? (
                <SearchX
                  size={34}
                  aria-hidden="true"
                  className="text-ink-600"
                />
              ) : (
                <UsersRound
                  size={34}
                  aria-hidden="true"
                  className="text-ink-600"
                />
              )}
              <h2 className="mt-5 text-xl font-extrabold">
                {filtered ? 'No encontramos usuarios' : 'Sumá a tu equipo'}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-ink-600">
                {filtered
                  ? 'Probá con otras primeras letras del correo o volvé al inicio del listado.'
                  : 'Invitá a las personas que van a administrar el club y asignales sus roles.'}
              </p>
              <button
                type="button"
                className={`${secondaryClass} mt-5`}
                onClick={() => (filtered ? apply('') : setEditing('new'))}
              >
                {filtered
                  ? 'Ver todos los usuarios'
                  : 'Invitar al primer usuario'}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-navy-900/10">
              {accounts.map((account) => (
                <UserRow
                  key={account.id}
                  account={account}
                  self={account.id === userId}
                  onEdit={() => setEditing(account)}
                />
              ))}
            </ul>
          )}
        </div>
        {!list.query.isPending &&
          !failed &&
          (accounts.length > 0 || list.page > 1) && (
            <footer className="border-t border-navy-900/10 bg-mist-50/40 px-4 py-4 sm:px-6">
              <p role="status" className="text-xs text-ink-600">
                {accounts.length}{' '}
                {accounts.length === 1
                  ? 'usuario en esta página'
                  : 'usuarios en esta página'}{' '}
                · Más recientes primero
              </p>
              {(list.hasNext || list.page > 1) && (
                <Pagination {...list} pending={list.query.isFetching} />
              )}
            </footer>
          )}
      </section>
      <p className="mt-4 text-center text-xs leading-5 text-ink-600">
        Desactivar una cuenta bloquea su acceso al panel y conserva sus datos.
        Tu propio acceso lo debe modificar otro administrador general.
      </p>
    </>
  )
}
