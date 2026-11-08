import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAdminList } from '../hooks/useAdminData'
import { useContentActions } from '../hooks/useAdminActions'
import type { Content, ContentKind } from '../schemas/admin'
import { contentConfig } from '../content-fields'
import { contentListCopy } from '../content-list'
import { ContentEditor } from './ContentEditor'
import { ContentEmptyState } from './ContentEmptyState'
import { ContentListItem } from './ContentListItem'
import { ContentListSkeleton } from './ContentListSkeleton'
import { ContentToolbar } from './ContentToolbar'
import { ContentSectionHeader } from './ContentSectionHeader'
import { Feedback, Pagination, secondaryClass } from './ui'

export function ContentSection({
  kind,
  userId,
}: {
  kind: ContentKind
  userId: string
}) {
  const list = useAdminList(kind, userId)
  const { archive } = useContentActions()
  const [editing, setEditing] = useState<Content | 'new' | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const config = contentConfig[kind]
  const copy = contentListCopy[kind]
  const applyFilter = (state: string, search: string) => {
    setSearchInput(search.trim())
    list.filter(state, search.trim())
  }
  if (editing)
    return (
      <ContentEditor
        key={editing === 'new' ? 'new' : editing.id}
        kind={kind}
        row={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    )
  const rows = list.rows.filter((row): row is Content => 'is_published' in row)
  const failed = list.query.isError && !rows.length
  const activeFilters = Boolean(list.search) || list.state !== 'all'
  return (
    <>
      <ContentSectionHeader kind={kind} onCreate={() => setEditing('new')} />
      <section
        aria-label={`Administrar ${copy.noun}`}
        className="overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
      >
        <ContentToolbar
          kind={kind}
          state={list.state}
          search={searchInput}
          busy={list.query.isFetching}
          onSearchChange={setSearchInput}
          onFilter={applyFilter}
          onRefresh={() => {
            void list.query.refetch()
          }}
        />
        {activeFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy-900/5 bg-mist-50/70 px-4 py-2.5 sm:px-6">
            <p className="text-xs text-ink-600">
              {list.search ? (
                <>
                  Búsqueda:{' '}
                  <strong className="break-all text-navy-900">
                    «{list.search}»
                  </strong>
                </>
              ) : (
                'Mostrando el estado seleccionado'
              )}
            </p>
            <button
              type="button"
              className="min-h-8 text-xs font-bold text-river-600 hover:underline"
              onClick={() => applyFilter('all', '')}
            >
              Limpiar filtros
            </button>
          </div>
        )}
        {(archive.error ||
          archive.isSuccess ||
          (list.query.error && rows.length > 0)) && (
          <div className="px-4 pb-4 sm:px-6">
            <Feedback
              error={archive.error ?? list.query.error}
              success={
                archive.isSuccess
                  ? archive.variables?.[3]
                    ? 'Contenido restaurado como borrador.'
                    : 'Contenido enviado a la papelera.'
                  : null
              }
            />
          </div>
        )}
        <div aria-busy={list.query.isFetching}>
          {list.query.isPending ? (
            <ContentListSkeleton />
          ) : failed ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
              <AlertCircle
                size={32}
                aria-hidden="true"
                className="text-ink-600"
              />
              <h2 className="text-lg font-bold">
                No pudimos cargar el contenido
              </h2>
              <div role="alert" className="max-w-md text-sm text-ink-600">
                {list.query.error?.message}
              </div>
              <button
                className={secondaryClass}
                type="button"
                onClick={() => {
                  void list.query.refetch()
                }}
              >
                Reintentar
              </button>
            </div>
          ) : !rows.length ? (
            <ContentEmptyState
              kind={kind}
              state={list.state}
              search={list.search}
              page={list.page}
              onCreate={() => setEditing('new')}
              onReset={() =>
                applyFilter(
                  list.page > 1 ? list.state : 'all',
                  list.page > 1 ? list.search : '',
                )
              }
            />
          ) : (
            <div className="divide-y divide-navy-900/10 border-t border-navy-900/10">
              {rows.map((row) => (
                <ContentListItem
                  key={row.id}
                  row={row}
                  busy={archive.isPending}
                  onEdit={() => setEditing(row)}
                  onArchive={() => {
                    if (
                      window.confirm(
                        row.deleted_at
                          ? '¿Restaurar este contenido como borrador?'
                          : '¿Enviar este contenido a la papelera? Dejará de verse en el sitio.',
                      )
                    )
                      archive.mutate([
                        kind,
                        row.id,
                        row.updated_at,
                        Boolean(row.deleted_at),
                      ])
                  }}
                />
              ))}
            </div>
          )}
        </div>
        {!list.query.isPending &&
          !failed &&
          (rows.length > 0 || list.page > 1) && (
            <footer className="border-t border-navy-900/10 bg-mist-50/40 px-4 py-4 sm:px-6">
              <p role="status" className="text-xs text-ink-600">
                {rows.length} {rows.length === 1 ? config.singular : copy.noun}{' '}
                en esta página · Más recientes primero
              </p>
              {(list.page > 1 || list.hasNext) && (
                <Pagination {...list} pending={list.query.isFetching} />
              )}
            </footer>
          )}
      </section>
      <p className="mt-4 text-center text-xs leading-5 text-ink-600">
        {list.state === 'archived'
          ? 'Restaurar contenido lo devuelve a borrador. Podés revisarlo antes de publicarlo otra vez.'
          : kind === 'news'
            ? 'Los borradores son privados. Las publicaciones programadas aparecerán en la fecha que elijas.'
            : 'El contenido solo aparece en el sitio cuando lo publicás. Los borradores son privados.'}
      </p>
    </>
  )
}
