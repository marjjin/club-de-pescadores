import { useId, useState } from 'react'
import { LoaderCircle, UploadCloud } from 'lucide-react'
import { useImageUpload } from '../hooks/useImageUpload'
import { Feedback } from './ui'

export function ImageUpload({
  onUploaded,
  onBusyChange,
  errorId,
  disabled = false,
}: {
  onUploaded: (url: string) => void
  onBusyChange: (busy: boolean) => void
  errorId?: string | undefined
  disabled?: boolean
}) {
  const upload = useImageUpload()
  const id = useId()
  const [dragging, setDragging] = useState(false)
  function choose(file?: File) {
    if (!file || disabled || upload.isPending) return
    onBusyChange(true)
    upload.mutate(file, {
      onSuccess: onUploaded,
      onSettled: () => onBusyChange(false),
    })
  }
  return (
    <div className="grid gap-3">
      <input
        id={id}
        name="image_file"
        className="peer sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || upload.isPending}
        aria-invalid={Boolean(errorId)}
        aria-describedby={`${id}-help${errorId ? ` ${errorId}` : ''}`}
        onChange={(event) => {
          choose(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          choose(event.dataTransfer.files[0])
        }}
        className={`flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sun-400 ${disabled || upload.isPending ? 'cursor-wait border-navy-900/15 bg-mist-50' : dragging ? 'cursor-pointer border-river-600 bg-river-600/5' : 'cursor-pointer border-navy-900/15 bg-mist-50/60 hover:border-river-600/50 hover:bg-mist-50'}`}
      >
        {upload.isPending ? (
          <LoaderCircle
            size={27}
            aria-hidden="true"
            className="text-river-600 motion-safe:animate-spin"
          />
        ) : (
          <UploadCloud size={27} aria-hidden="true" className="text-navy-800" />
        )}
        <span className="text-sm font-bold text-navy-900">
          {upload.isPending ? 'Preparando tu imagen…' : 'Elegir una imagen'}
        </span>
        <span id={`${id}-help`} className="text-xs leading-5 text-ink-600">
          {upload.isPending
            ? 'La estamos optimizando y subiendo.'
            : 'O arrastrá un archivo acá. JPG, PNG o WebP · Hasta 5 MB.'}
        </span>
      </label>
      {upload.isPending && (
        <span role="status" className="sr-only">
          Optimizando y subiendo imagen…
        </span>
      )}
      <Feedback error={upload.error} />
    </div>
  )
}
