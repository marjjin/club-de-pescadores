import { Expand, X } from 'lucide-react'
import { useRef } from 'react'

export function NewsArticleImage({ src, alt }: { src: string; alt: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  function open() {
    dialog.current?.showModal()
    // The native modal blocks interaction but not scrolling of the page behind it.
    document.documentElement.style.overflow = 'hidden'
  }
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
        onClick={open}
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
      <dialog
        ref={dialog}
        aria-label="Imagen ampliada"
        onClose={() => {
          document.documentElement.style.overflow = ''
        }}
        onClick={(event) => {
          // Clicking the dark backdrop (the dialog itself) closes it; the photo does not.
          if (event.target === event.currentTarget) dialog.current?.close()
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-4 backdrop:bg-navy-950/90 open:grid open:place-items-center sm:p-8"
      >
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label="Cerrar imagen ampliada"
          autoFocus
          className="fixed top-4 right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-3 focus-visible:outline-sun-400"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </dialog>
    </figure>
  )
}
