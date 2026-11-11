import { useId } from 'react'
import { ChevronRight, ImageIcon, Trash2 } from 'lucide-react'
import type { NewsEditorErrors, NewsEditorValues } from '../../news-editor'
import { ImageUpload } from '../ImageUpload'
import { inputClass } from '../ui'
import { NewsCover } from './NewsCover'
import { NewsCoverFramer } from './NewsCoverFramer'

export function NewsImageField({
  values,
  errors,
  busy,
  onChange,
  onFocusChange,
  onBusyChange,
}: {
  values: NewsEditorValues
  errors: NewsEditorErrors
  busy: boolean
  onChange: (name: 'image_url' | 'image_alt', value: string) => void
  onFocusChange: (focus: { x: number; y: number }) => void
  onBusyChange: (busy: boolean) => void
}) {
  const id = useId()
  return (
    <section
      aria-label="Imagen de portada"
      className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-lg bg-mist-50 text-navy-800"
        >
          <ImageIcon size={19} />
        </span>
        <div>
          <h2 className="text-base font-extrabold">
            Imagen de portada{' '}
            <span aria-hidden="true" className="text-river-600">
              *
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-ink-600">
            Elegí la foto que acompañará tu noticia.
          </p>
        </div>
      </div>
      {values.image_url && (
        <div className="relative mb-4">
          <NewsCoverFramer
            focus={{ x: values.image_focus_x, y: values.image_focus_y }}
            disabled={busy}
            onChange={onFocusChange}
          >
            <div className="overflow-hidden rounded-xl border border-navy-900/10">
              <NewsCover
                url={values.image_url}
                alt={values.image_alt}
                position={`${values.image_focus_x}% ${values.image_focus_y}%`}
              />
            </div>
          </NewsCoverFramer>
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange('image_url', '')}
            aria-label="Quitar imagen de portada"
            title="Quitar imagen de esta noticia"
            className="absolute top-3 right-3 grid size-10 place-items-center rounded-lg border border-navy-900/10 bg-white text-navy-900 shadow-sm hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <ImageUpload
        onUploaded={(url) => {
          onChange('image_url', url)
          onFocusChange({ x: 50, y: 50 })
        }}
        onBusyChange={onBusyChange}
        disabled={busy}
        errorId={errors.image_url ? `${id}-image-error` : undefined}
      />
      {errors.image_url && (
        <p
          id={`${id}-image-error`}
          className="mt-2 text-xs font-semibold text-red-700"
        >
          {errors.image_url}
        </p>
      )}
      <details className="group mt-4 rounded-lg border border-navy-900/10">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-xs font-bold text-ink-600 [&::-webkit-details-marker]:hidden">
          <ChevronRight
            size={14}
            aria-hidden="true"
            className="transition-transform group-open:rotate-90"
          />
          Usar un enlace de imagen
        </summary>
        <div className="border-t border-navy-900/10 p-3">
          <label htmlFor={`${id}-url`} className="mb-2 block text-sm font-bold">
            URL de la imagen
          </label>
          <input
            id={`${id}-url`}
            name="image_url"
            type="url"
            value={values.image_url}
            onChange={(event) => onChange('image_url', event.target.value)}
            disabled={busy}
            maxLength={2048}
            placeholder="https://…"
            className={`${inputClass} aria-invalid:border-red-500`}
            aria-invalid={Boolean(errors.image_url)}
            aria-describedby={
              errors.image_url ? `${id}-image-error` : undefined
            }
          />
          <p className="mt-2 text-xs text-ink-600">
            Usá un enlace directo a una imagen con HTTPS.
          </p>
        </div>
      </details>
      <div className="mt-5">
        <label htmlFor={`${id}-alt`} className="mb-2 block text-sm font-bold">
          Descripción de la imagen{' '}
          <span aria-hidden="true" className="text-river-600">
            *
          </span>
        </label>
        <input
          id={`${id}-alt`}
          name="image_alt"
          value={values.image_alt}
          onChange={(event) => onChange('image_alt', event.target.value)}
          maxLength={300}
          required
          placeholder="Describí brevemente qué se ve en la foto"
          className={`${inputClass} aria-invalid:border-red-500`}
          aria-invalid={Boolean(errors.image_alt)}
          aria-describedby={`${id}-alt-help${errors.image_alt ? ` ${id}-alt-error` : ''}`}
        />
        <div
          id={`${id}-alt-help`}
          className="mt-2 flex justify-between gap-3 text-xs leading-5 text-ink-600"
        >
          <span>Ayuda a quienes usan un lector de pantalla.</span>
          <span className="shrink-0 tabular-nums">
            {values.image_alt.length}/300
          </span>
        </div>
        {errors.image_alt && (
          <p
            id={`${id}-alt-error`}
            className="mt-2 text-xs font-semibold text-red-700"
          >
            {errors.image_alt}
          </p>
        )}
      </div>
    </section>
  )
}
