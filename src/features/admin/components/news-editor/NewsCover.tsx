import { useEffect, useState } from 'react'
import { ImageIcon, ImageOff } from 'lucide-react'
import { safeNewsImage } from '../../news-editor'

function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center text-ink-600">
      <ImageOff size={25} aria-hidden="true" />
      <span className="text-xs">
        No pudimos cargar la imagen. Revisá el enlace o elegí otro archivo.
      </span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      width="720"
      height="405"
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}
export function NewsCover({ url, alt }: { url: string; alt: string }) {
  const candidate = safeNewsImage(url)
  const [safe, setSafe] = useState(candidate)
  useEffect(() => {
    const timer = window.setTimeout(() => setSafe(candidate), 300)
    return () => window.clearTimeout(timer)
  }, [candidate])
  return (
    <div className="aspect-video overflow-hidden bg-mist-50">
      {safe ? (
        <CoverImage key={safe} src={safe} alt={alt} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-600/80">
          <ImageIcon size={30} strokeWidth={1.5} aria-hidden="true" />
          <span className="text-xs">Tu imagen de portada</span>
        </div>
      )}
    </div>
  )
}
