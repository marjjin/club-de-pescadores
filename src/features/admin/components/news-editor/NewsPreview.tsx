import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { summarizeNews } from '@/features/news'
import type { NewsEditorValues } from '../../news-editor'
import { NewsCover } from './NewsCover'

export function NewsPreview({
  values,
  full = false,
}: {
  values: NewsEditorValues
  full?: boolean
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-navy-900/10 bg-white">
      <NewsCover url={values.image_url} alt={values.image_alt} />
      <div className={`min-w-0 wrap-anywhere ${full ? 'p-6 sm:p-8' : 'p-4'}`}>
        <span className="text-[10px] font-extrabold tracking-[0.16em] text-river-600 uppercase">
          Novedades del club
        </span>
        <h3
          className={`mt-2 font-extrabold text-navy-900 ${full ? 'text-2xl sm:text-3xl' : 'text-lg leading-6'}`}
        >
          {values.title.trim() || 'El título de tu noticia'}
        </h3>
        <p
          className={`mt-3 text-sm leading-6 whitespace-pre-wrap text-ink-600 ${full ? '' : 'line-clamp-3'}`}
        >
          {(full ? values.excerpt.trim() : summarizeNews(values.excerpt)) ||
            'El texto que escribas aparecerá acá. La vista previa se actualiza mientras preparás la noticia.'}
        </p>
        {!full && (
          <p className="mt-4 text-sm font-bold text-river-600">
            Leer noticia →
          </p>
        )}
      </div>
    </article>
  )
}

export function NewsPreviewDialog({
  open,
  values,
  onClose,
}: {
  open: boolean
  values: NewsEditorValues
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby="news-preview-heading"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto max-h-[90dvh] w-[min(48rem,calc(100%_-_2rem))] overflow-y-auto rounded-2xl border-0 bg-mist-50 p-0 text-navy-900 shadow-xl backdrop:bg-navy-950/65"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-navy-900/10 bg-white p-4">
        <div>
          <h2 id="news-preview-heading" className="font-extrabold">
            Vista previa de la noticia
          </h2>
          <p className="mt-1 text-xs text-ink-600">
            Esta vista no guarda ni publica cambios.
          </p>
        </div>
        <button
          type="button"
          autoFocus
          aria-label="Cerrar vista previa"
          onClick={onClose}
          className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-mist-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="p-4 sm:p-6">
        <NewsPreview values={values} full />
      </div>
    </dialog>
  )
}
