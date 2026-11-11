import { useId, useState } from 'react'
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
  const [dragging, setDragging] = useState(false)
  const blocked = disabled || full
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
        // Without these handlers a dropped photo makes the browser open the file instead.
        onDragOver={(event) => {
          event.preventDefault()
          if (!blocked) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!blocked) uploads.add([...event.dataTransfer.files])
        }}
        className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sun-400 ${blocked ? 'cursor-not-allowed border-navy-900/10 bg-mist-50 opacity-60' : dragging ? 'cursor-copy border-river-600 bg-river-600/5' : 'cursor-pointer border-navy-900/15 bg-mist-50/60 hover:border-river-600/50 hover:bg-mist-50'}`}
      >
        <ImagePlus size={26} aria-hidden="true" className="text-river-600" />
        <span className="text-sm font-bold text-navy-900">
          {full
            ? 'Llegaste al máximo de archivos'
            : dragging
              ? 'Soltá los archivos acá'
              : 'Sumar fotos o videos'}
        </span>
        <span id={`${id}-help`} className="text-xs leading-5 text-ink-600">
          Tocá para elegir o arrastralos acá. Las fotos se optimizan a WebP
          antes de subirse. Hasta {MAX_MEDIA} archivos y {MAX_VIDEOS} videos de
          60 segundos (30 MB).
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
