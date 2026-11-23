import { Modal } from '@/shared/ui/Modal'
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
      <NewsCover
        url={values.image_url}
        alt={values.image_alt}
        position={`${values.image_focus_x}% ${values.image_focus_y}%`}
      />
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
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Vista previa de la noticia"
      description="Esta vista no guarda ni publica cambios."
      closeLabel="Cerrar vista previa"
      className="bg-mist-50"
    >
      <div className="p-4 sm:p-6">
        <NewsPreview values={values} full />
      </div>
    </Modal>
  )
}
