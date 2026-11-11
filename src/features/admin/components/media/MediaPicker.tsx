import { useId } from 'react'
import { ImagePlus } from 'lucide-react'
import type { useMediaUploads } from '../../hooks/useMediaUploads'
import { MAX_MEDIA, MAX_VIDEOS } from '../../schemas/media'
import { MediaTile } from './MediaTile'

const ACCEPT =
  'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime'

export function MediaPicker({
  uploads,
  disabled,
  label = 'Fotos y videos',
  labelHidden = false,
}: {
  uploads: ReturnType<typeof useMediaUploads>
  disabled: boolean
  label?: string
  /** When a surrounding heading already names the field. */
  labelHidden?: boolean
}) {
  const id = useId()
  const full = uploads.drafts.length >= MAX_MEDIA
  return (
    <fieldset className="min-w-0">
      <legend className={labelHidden ? 'sr-only' : 'mb-2 text-sm font-bold'}>
        {label}
      </legend>
      {uploads.drafts.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {uploads.drafts.map((draft, index) => (
            <MediaTile
              key={draft.id}
              draft={draft}
              disabled={disabled}
              first={index === 0}
              last={index === uploads.drafts.length - 1}
              onRemove={() => uploads.remove(draft.id)}
              onMove={(step) => uploads.move(draft.id, step)}
            />
          ))}
        </ul>
      )}
      <input
        id={id}
        type="file"
        multiple
        accept={ACCEPT}
        disabled={disabled || full}
        className="peer sr-only"
        aria-describedby={`${id}-help`}
        onChange={(event) => {
          uploads.add([...(event.target.files ?? [])])
          event.target.value = ''
        }}
      />
      <label
        htmlFor={id}
        className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sun-400 ${disabled || full ? 'cursor-not-allowed border-navy-900/10 bg-mist-50 opacity-60' : 'cursor-pointer border-navy-900/15 bg-mist-50/60 hover:border-river-600/50 hover:bg-mist-50'}`}
      >
        <ImagePlus size={26} aria-hidden="true" className="text-river-600" />
        <span className="text-sm font-bold text-navy-900">
          {full ? 'Llegaste al máximo de archivos' : 'Sumar fotos o videos'}
        </span>
        <span id={`${id}-help`} className="text-xs leading-5 text-ink-600">
          Podés elegir varios a la vez. Hasta {MAX_MEDIA} archivos y{' '}
          {MAX_VIDEOS} videos de 60 segundos (30 MB).
        </span>
      </label>
      <p role="status" className="mt-2 text-xs text-ink-600">
        {uploads.busy
          ? 'Subiendo archivos… podés seguir completando el formulario.'
          : (uploads.notice ?? '')}
      </p>
    </fieldset>
  )
}
