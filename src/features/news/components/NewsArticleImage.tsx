import { Expand } from 'lucide-react'
import { useState } from 'react'
import { Lightbox } from '@/shared/ui/Lightbox'

export function NewsArticleImage({ src, alt }: { src: string; alt: string }) {
  const [opened, setOpened] = useState(false)
  return (
    <figure className="relative mt-8 overflow-hidden rounded-2xl bg-navy-900 shadow-sm">
      {/* Same URL as the main image, so the browser reuses it; it fills the bands of portrait photos. */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl"
      />
      <button
        type="button"
        onClick={() => setOpened(true)}
        aria-label="Ampliar imagen"
        className="relative block w-full cursor-zoom-in focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-sun-400"
      >
        <img
          src={src}
          alt={alt}
          width="1200"
          height="800"
          fetchPriority="high"
          className="mx-auto max-h-[70vh] w-full object-contain"
        />
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-navy-950/70 px-3.5 text-xs font-bold text-white backdrop-blur-sm"
        >
          <Expand size={14} />
          Ampliar
        </span>
      </button>
      <Lightbox
        items={[
          { kind: 'image', src, poster: null, width: 1200, height: 800, alt },
        ]}
        index={0}
        onIndexChange={() => {}}
        open={opened}
        onClose={() => setOpened(false)}
        label="Imagen ampliada"
      />
    </figure>
  )
}
