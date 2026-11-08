import { formText, dateLabel } from '../form-utils'
import { useState } from 'react'
import { useAdminList } from '../hooks/useAdminData'
import { useContentActions } from '../hooks/useAdminActions'
import type { Content, ContentKind } from '../schemas/admin'
import { contentConfig } from '../content-fields'
import { ContentEditor } from './ContentEditor'
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
  return (
    <>
      <SectionHeading
        title={contentConfig[kind].title}
        description="Administrá el contenido que se muestra en el sitio del club."
        action={
          <button className={primaryClass} onClick={() => setEditing('new')}>
            Crear {contentConfig[kind].singular}
          </button>
        }
      />
      <Panel>
        <form
          className="mb-5 flex flex-wrap gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            list.filter(
              formText(data.get('state')),
              formText(data.get('search')),
            )
          }}
        >
          <input
            name="search"
            defaultValue={list.search}
            aria-label="Buscar por palabras"
            placeholder="Buscar por palabras…"
            maxLength={100}
            className={`${inputClass} min-w-40 flex-1`}
          />
          <select
            name="state"
            aria-label="Estado del contenido"
            className={`${inputClass} sm:w-auto`}
            defaultValue={list.state}
          >
            <option value="all">Todo el contenido activo</option>
            <option value="draft">Borradores</option>
            <option value="published">Publicados y programados</option>
            <option value="archived">Papelera</option>
          </select>
          <button className={secondaryClass}>Filtrar</button>
        </form>
        <Feedback
          error={list.query.error ?? archive.error}
          success={archive.isSuccess ? 'Contenido actualizado.' : null}
        />
        {list.query.isPending ? (
          <Loading />
        ) : !rows.length ? (
          <Empty />
        ) : (
          <div className="divide-y divide-navy-900/10">
            {rows.map((row) => (
              <article
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold break-words">
                    {'title' in row
                      ? row.title
                      : `${row.season} · ${row.period}`}
                  </h2>
                  <p className="mt-1 text-xs text-ink-600">
                    Actualizado {dateLabel(row.updated_at)}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${row.deleted_at ? 'bg-red-50 text-red-800' : row.is_published ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}
                  >
                    {row.deleted_at
                      ? 'En papelera'
                      : row.is_published
                        ? 'published_at' in row &&
                          new Date(row.published_at) > new Date()
                          ? 'Programado'
                          : 'Publicado'
                        : 'Borrador'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!row.deleted_at && (
                    <button
                      className={secondaryClass}
                      onClick={() => setEditing(row)}
                    >
                      Editar
                    </button>
                  )}
                  <button
                    className={secondaryClass}
                    disabled={archive.isPending}
                    onClick={() => {
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
                  >
                    {row.deleted_at ? 'Restaurar' : 'Archivar'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination {...list} pending={list.query.isFetching} />
        <button
          className="mt-4 text-sm font-bold text-river-600"
          onClick={() => {
            void list.query.refetch()
          }}
        >
          Actualizar listado
        </button>
      </Panel>
    </>
  )
}
