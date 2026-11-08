import { useRef, useState } from 'react'
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
import { ImageUpload } from './ImageUpload'

export function ContentEditor({
  kind,
  row,
  onClose,
}: {
  kind: ContentKind
  row: Content | null
  onClose: () => void
}) {
  const { save } = useContentActions()
  const [imageBusy, setImageBusy] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [preview, setPreview] = useState<Record<
    string,
    string | number | boolean | null
  > | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
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
          ref={formRef}
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            try {
              const input = formContent(kind, new FormData(event.currentTarget))
              if (
                input.is_published &&
                !window.confirm(
                  '¿Confirmás la publicación de este contenido? Si la noticia tiene una fecha futura, quedará programada.',
                )
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
                className={
                  field.type === 'textarea' || field.name === 'image_url'
                    ? 'md:col-span-2'
                    : ''
                }
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
                {field.name === 'image_url' && (
                  <ImageUpload
                    onBusyChange={setImageBusy}
                    onUploaded={(url) => {
                      const input =
                        formRef.current?.elements.namedItem('image_url')
                      if (input instanceof HTMLInputElement) input.value = url
                    }}
                  />
                )}
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
            <button
              className={primaryClass}
              disabled={save.isPending || imageBusy}
            >
              {save.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {kind === 'news' && (
              <button
                type="button"
                className={secondaryClass}
                onClick={() => {
                  if (formRef.current?.reportValidity()) {
                    try {
                      setPreview(
                        formContent(kind, new FormData(formRef.current)),
                      )
                      setError(null)
                    } catch {
                      setError(
                        new Error(
                          'Revisá los datos antes de generar la vista previa.',
                        ),
                      )
                    }
                  }
                }}
              >
                Vista previa
              </button>
            )}
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
      {preview && (
        <section className="mt-6" aria-label="Vista previa de noticia">
          <Panel>
            <p className="mb-4 text-xs font-bold tracking-wider text-ink-600 uppercase">
              Vista previa · No publicada
            </p>
            {typeof preview.image_url === 'string' &&
              preview.image_url.startsWith('https://') && (
                <img
                  src={preview.image_url}
                  alt={String(preview.image_alt)}
                  className="mb-5 max-h-80 w-full rounded-lg object-cover"
                />
              )}
            <h2 className="text-2xl font-bold">{preview.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-ink-600">
              {preview.excerpt}
            </p>
          </Panel>
        </section>
      )}
    </>
  )
}
