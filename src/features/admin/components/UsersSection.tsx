import { formText } from '../form-utils'
import { useState } from 'react'
import { useAdminList } from '../hooks/useAdminData'
import type { Account } from '../schemas/admin'
import { UserEditor } from './UserEditor'
import {
  Empty,
  Feedback,
  inputClass,
  Loading,
  Pagination,
  Panel,
  primaryClass,
  secondaryClass,
  SectionHeading,
} from './ui'

export function UsersSection({ userId }: { userId: string }) {
  const list = useAdminList('users', userId)
  const [editing, setEditing] = useState<Account | 'new' | null>(null)
  if (editing)
    return (
      <UserEditor
        account={editing === 'new' ? null : editing}
        userId={userId}
        onClose={() => setEditing(null)}
      />
    )
  const accounts = list.rows.filter((row): row is Account => 'email' in row)
  return (
    <>
      <SectionHeading
        title="Usuarios"
        description="Invitá al equipo y administrá sus accesos. Las cuentas desactivadas pierden acceso a los datos del panel."
        action={
          <button className={primaryClass} onClick={() => setEditing('new')}>
            Invitar usuario
          </button>
        }
      />
      <Panel>
        <form
          className="mb-5 flex gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            list.filter(
              'all',
              formText(new FormData(event.currentTarget).get('email')),
            )
          }}
        >
          <input
            className={inputClass}
            name="email"
            defaultValue={list.search}
            placeholder="Buscar por inicio del correo…"
            aria-label="Buscar por inicio del correo"
            maxLength={100}
          />
          <button className={secondaryClass}>Buscar</button>
        </form>
        <Feedback error={list.query.error} />
        {list.query.isPending ? (
          <Loading />
        ) : !accounts.length ? (
          <Empty />
        ) : (
          <div className="divide-y divide-navy-900/10">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 py-5"
              >
                <div className="min-w-0">
                  <h2 className="font-bold break-all">{account.email}</h2>
                  <p className="mt-1 text-sm text-ink-600">
                    {account.active ? 'Activo' : 'Desactivado'} ·{' '}
                    {account.roles.length} roles
                    {account.id === userId ? ' · Tu cuenta' : ''}
                  </p>
                </div>
                <button
                  className={secondaryClass}
                  disabled={account.id === userId}
                  onClick={() => setEditing(account)}
                >
                  Gestionar acceso
                </button>
              </div>
            ))}
          </div>
        )}
        <Pagination {...list} pending={list.query.isFetching} />
      </Panel>
    </>
  )
}
