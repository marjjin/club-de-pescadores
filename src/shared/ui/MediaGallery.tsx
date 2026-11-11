import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'

export type GalleryItem = {
  kind: 'image' | 'video'
  src: string
  poster: string | null
  width: number
  height: number
  alt: string
}

const control =
  'grid size-11 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-3 focus-visible:outline-sun-400 disabled:opacity-30'

function Thumbnail({ item, large }: { item: GalleryItem; large: boolean }) {
  return (
    <>
      <img
        src={item.kind === 'video' ? (item.poster ?? '') : item.src}
        alt=""
        width={item.width}
        height={item.height}
        loading="lazy"
        decoding="async"
        className="size-full object-cover transition-[scale] duration-300 group-hover:scale-105 motion-reduce:transition-none"
      />
      {item.kind === 'video' && (
        <span className="absolute inset-0 grid place-items-center bg-navy-950/15">
          <span
            className={`grid place-items-center rounded-full bg-navy-950/70 text-white ${large ? 'size-16' : 'size-11'}`}
          >
            <Play size={large ? 28 : 20} className="translate-x-0.5" />
          </span>
        </span>
      )}
    </>
  )
}

/** Grid of photos and videos; videos load only when opened, from their poster. */
export function MediaGallery({
  items,
  label,
}: {
  items: GalleryItem[]
  label: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const [opened, setOpened] = useState(false)
  const current = items[index]
  // The native modal blocks interaction but not scrolling of the page behind it.
  useEffect(() => {
    if (!opened) return
    const root = document.documentElement
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = ''
    }
  }, [opened])
  function open(next: number) {
    setIndex(next)
    setOpened(true)
    dialog.current?.showModal()
  }
  const go = (step: number) =>
    setIndex((value) => Math.min(items.length - 1, Math.max(0, value + step)))
  function keys(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowLeft') go(-1)
    if (event.key === 'ArrowRight') go(1)
  }
  if (!items.length) return null
  return (
    <>
      <ul
        aria-label={label}
        className={`grid gap-2 sm:gap-3 ${items.length === 1 ? '' : 'grid-cols-2 sm:grid-cols-4'}`}
      >
        {items.map((item, position) => {
          const large = position === 0 && items.length > 1
          return (
            <li
              key={item.src}
              className={`min-w-0 ${large ? 'col-span-2 row-span-2' : ''}`}
            >
              <button
                type="button"
                onClick={() => open(position)}
                aria-label={`${item.kind === 'video' ? 'Reproducir video' : 'Ampliar foto'} ${position + 1} de ${items.length}: ${item.alt}`}
                className={`group relative block w-full cursor-zoom-in overflow-hidden rounded-xl bg-mist-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sun-400 ${items.length === 1 ? 'aspect-video' : 'aspect-square'}`}
              >
                <Thumbnail item={item} large={large || items.length === 1} />
              </button>
            </li>
          )
        })}
      </ul>
      <dialog
        ref={dialog}
        aria-label={`${label}: archivo ${index + 1} de ${items.length}`}
        onKeyDown={keys}
        onClose={() => setOpened(false)}
        onClick={(event) => {
          // Clicking the dark backdrop (the dialog itself) closes it; the media does not.
          if (event.target === event.currentTarget) dialog.current?.close()
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-4 backdrop:bg-navy-950/95 open:grid open:place-items-center sm:p-16"
      >
        {current &&
          (current.kind === 'video' ? (
            // Remounted per item so switching never keeps playing the previous video.
            <video
              key={current.src}
              src={current.src}
              poster={current.poster ?? undefined}
              controls
              autoPlay
              playsInline
              preload="metadata"
              aria-label={current.alt}
              className="max-h-full max-w-full rounded-lg"
            />
          ) : (
            <img
              key={current.src}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          ))}
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label="Cerrar"
          autoFocus
          className={`${control} fixed top-4 right-4`}
        >
          <X size={22} aria-hidden="true" />
        </button>
        {items.length > 1 && (
          <div className="fixed inset-x-0 bottom-4 flex items-center justify-center gap-4 text-sm font-bold text-white">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Anterior"
              className={control}
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <span aria-live="polite" className="tabular-nums">
              {index + 1} de {items.length}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={index === items.length - 1}
              aria-label="Siguiente"
              className={control}
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        )}
      </dialog>
    </>
  )
}
