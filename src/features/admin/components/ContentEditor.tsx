import { useState } from 'react'
import { contentConfig, formContent, initialField } from '../content-fields'
import type { Content, ContentKind } from '../schemas/admin'
import { useContentActions } from '../hooks/useAdminActions'
import {
  Feedback,
  Field,
  inputClass,
  Panel,
  primaryClass,
  secondaryClass,
  SectionHeading,
} from './ui'
import { NewsEditor } from './news-editor/NewsEditor'
import { EventEditor } from './event-editor/EventEditor'

type Props = { kind: ContentKind; row: Content | null; onClose: () => void }

export function ContentEditor(props: Props) {
  if (props.kind === 'news')
    return (
      <NewsEditor
        row={props.row && 'excerpt' in props.row ? props.row : null}
        onClose={props.onClose}
      />
    )
  if (props.kind === 'events')
    return (
      <EventEditor
        row={props.row && 'starts_at' in props.row ? props.row : null}
        onClose={props.onClose}
      />
    )
  return <GeneralContentEditor {...props} />
}

function GeneralContentEditor({ kind, row, onClose }: Props) {
  const { save } = useContentActions()
  const [error, setError] = useState<Error | null>(null)
  const config = contentConfig[kind]
  return (
    <>
      <SectionHeading
        title={`${row ? 'Editar' : 'Crear'} ${config.singular}`}
        description="Completá los datos y elegí si querés guardar un borrador o publicar."
        action={
          <button className={secondaryClass} onClick={onClose}>
            Volver al listado
          </button>
        }
      />
      <Panel>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            try {
              const input = formContent(kind, new FormData(event.currentTarget))
              if (
                input.is_published &&
                !window.confirm('¿Confirmás la publicación de este contenido?')
              )
                return
              setError(null)
              save.mutate(
                [kind, input, row?.id ?? null, row?.updated_at ?? null],
                { onSuccess: onClose },
              )
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause
                  : new Error('Revisá los campos.'),
              )
            }
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            {config.fields.map((field) => (
              <div
                key={field.name}
                className={field.type === 'textarea' ? 'md:col-span-2' : ''}
              >
                <Field
                  label={field.label + (field.optional ? ' (opcional)' : '')}
                >
                  {field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      className={inputClass}
                      rows={4}
                      required={!field.optional}
                      maxLength={field.max}
                      defaultValue={initialField(row, field.name, field.type)}
                    />
                  ) : (
                    <input
                      name={field.name}
                      className={inputClass}
                      type={
                        field.type === 'money' ? 'text' : (field.type ?? 'text')
                      }
                      inputMode={field.type === 'money' ? 'decimal' : undefined}
                      required={!field.optional}
                      maxLength={field.max}
                      defaultValue={initialField(row, field.name, field.type)}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-3 rounded-lg bg-mist-50 p-4 text-sm font-bold">
            <input
              name="is_published"
              type="checkbox"
              defaultChecked={row?.is_published ?? false}
              className="size-5 accent-river-600"
            />
            Publicar en el sitio
          </label>
          <Feedback error={error ?? save.error} />
          <div className="flex flex-wrap gap-3">
            <button className={primaryClass} disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className={secondaryClass}
              disabled={save.isPending}
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Panel>
    </>
  )
}
