import { ArrowLeft, Eye } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { News } from '../../schemas/admin'
import { useNewsEditor } from '../../hooks/useNewsEditor'
import { secondaryClass } from '../ui'
import { NewsEditorActions } from './NewsEditorActions'
import { NewsImageField } from './NewsImageField'
import { NewsPreview, NewsPreviewDialog } from './NewsPreview'
import { NewsPublication } from './NewsPublication'
import { NewsTextFields } from './NewsTextFields'
import { DraftNotice } from '../DraftNotice'

export function NewsEditor({
  row,
  onClose,
}: {
  row: News | null
  onClose: () => void
}) {
  const editor = useNewsEditor(row, onClose)
  const { values, errors, save } = editor
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])
  return (
    <>
      <header className="mb-7">
        <button
          type="button"
          onClick={editor.close}
          disabled={editor.busy}
          className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-ink-600 hover:text-navy-900 disabled:opacity-50"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a noticias
        </button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-extrabold tracking-[0.18em] text-ink-600 uppercase">
              Contenido del club · Noticias
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              {row ? 'Editar noticia' : 'Crear noticia'}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">
              Publicá fotos y condiciones del muelle, o cualquier novedad del
              club. La altura del río se actualiza en su propia sección del
              panel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => editor.setPreviewOpen(true)}
            className={secondaryClass}
          >
            <Eye size={16} aria-hidden="true" />
            Vista previa
          </button>
        </div>
      </header>
      {editor.draftNotice && (
        <DraftNotice
          savedAt={editor.draftNotice}
          onDiscard={editor.discardDraft}
        />
      )}
      <form noValidate onSubmit={editor.submit} className="min-w-0">
        <fieldset disabled={save.isPending} className="min-w-0">
          <legend className="sr-only">
            Editar contenido y publicación de la noticia
          </legend>
          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <div className="grid min-w-0 gap-6">
              <NewsTextFields
                values={values}
                errors={errors}
                onChange={editor.change}
              />
              <NewsImageField
                values={values}
                errors={errors}
                busy={editor.busy}
                onChange={editor.change}
                onFocusChange={({ x, y }) => {
                  editor.change('image_focus_x', x)
                  editor.change('image_focus_y', y)
                }}
                onBusyChange={editor.setImageBusy}
              />
            </div>
            <aside className="grid min-w-0 gap-5 xl:sticky xl:top-6">
              <NewsPublication
                values={values}
                errors={errors}
                onModeChange={(mode) => editor.change('publication', mode)}
                onDateChange={(date) => editor.change('published_at', date)}
              />
              <section
                aria-label="Vista previa en vivo"
                className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold">
                    Así se verá tu noticia
                  </h2>
                  <Eye size={16} aria-hidden="true" className="text-ink-600" />
                </div>
                <NewsPreview values={values} />
                <button
                  type="button"
                  onClick={() => editor.setPreviewOpen(true)}
                  className="mt-3 min-h-9 w-full text-xs font-bold text-river-600 hover:underline"
                >
                  Ampliar vista previa
                </button>
              </section>
            </aside>
          </div>
        </fieldset>
        <NewsEditorActions
          row={row}
          publication={values.publication}
          dirty={editor.dirty}
          imageBusy={editor.imageBusy}
          pending={save.isPending}
          error={save.error}
          hasErrors={Object.keys(errors).length > 0}
          onCancel={editor.close}
        />
        <p className="mt-3 text-center text-xs text-ink-600">
          Los campos con * son obligatorios. El contenido se guarda al presionar
          el botón.
        </p>
      </form>
      <NewsPreviewDialog
        open={editor.previewOpen}
        values={values}
        onClose={() => editor.setPreviewOpen(false)}
      />
    </>
  )
}
