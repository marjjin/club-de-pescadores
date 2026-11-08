import { useImageUpload } from '../hooks/useImageUpload'
import { Feedback } from './ui'

export function ImageUpload({
  onUploaded,
  onBusyChange,
}: {
  onUploaded: (url: string) => void
  onBusyChange: (busy: boolean) => void
}) {
  const upload = useImageUpload()
  return (
    <div className="mt-3 grid gap-2">
      <label className="text-sm font-bold text-river-600">
        O subí una imagen del club
        <input
          className="mt-2 block w-full text-sm font-normal file:mr-3 file:rounded file:border-0 file:bg-mist-50 file:px-3 file:py-2 file:font-bold file:text-navy-900"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={upload.isPending}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              onBusyChange(true)
              upload.mutate(file, {
                onSuccess: onUploaded,
                onSettled: () => onBusyChange(false),
              })
            }
          }}
        />
      </label>
      <p className="text-xs text-ink-600">
        JPG, PNG o WebP · Hasta 5 MB · Imagen para el sitio público.
      </p>
      {upload.isPending && (
        <p role="status" className="text-sm">
          Optimizando y subiendo imagen…
        </p>
      )}
      <Feedback
        error={upload.error}
        success={
          upload.isSuccess
            ? 'Imagen subida. Guardá la noticia para asociarla.'
            : null
        }
      />
    </div>
  )
}
