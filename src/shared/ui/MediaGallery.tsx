import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Lightbox } from './Lightbox'
import type { GalleryItem } from './Lightbox'

export type { GalleryItem }

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
        className="absolute inset-0 size-full object-cover transition-[scale] duration-300 group-hover:scale-105 motion-reduce:transition-none"
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

// Tiles keep each photo's shape within limits, so a row mixes portrait and landscape
// shots without extreme crops; the caller fixes the strip height.
const ratio = (item: GalleryItem) =>
  Math.min(1.8, Math.max(0.6, item.width / item.height))

/** Horizontal strip of photos and videos; videos load only when opened, from their poster. */
export function MediaGallery({
  items,
  label,
}: {
  items: GalleryItem[]
  label: string
}) {
  const [index, setIndex] = useState(0)
  const [opened, setOpened] = useState(false)
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  function open(next: number) {
    setIndex(next)
    setOpened(true)
  }
  function measure() {
    const element = track.current
    if (!element) return
    setEdges({
      start: element.scrollLeft <= 4,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4,
    })
  }
  // Recomputes the arrows once images size the strip (and on resize).
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [items.length])
  function slide(direction: 1 | -1) {
    const element = track.current
    if (element)
      element.scrollBy({ left: direction * element.clientWidth * 0.8 })
  }
  if (!items.length) return null
  const single = items.length === 1
  return (
    <>
      <div className="relative h-full">
        <ul
          ref={track}
          aria-label={label}
          tabIndex={0}
          onScroll={measure}
          className="flex h-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain rounded-xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sun-400 motion-safe:scroll-smooth sm:gap-3 [scrollbar-width:thin]"
        >
          {items.map((item, position) => (
            <li
              key={item.src}
              style={single ? undefined : { aspectRatio: ratio(item) }}
              className={`h-full shrink-0 snap-start ${single ? 'w-full' : ''}`}
            >
              <button
                type="button"
                onClick={() => open(position)}
                aria-label={`${item.kind === 'video' ? 'Reproducir video' : 'Ampliar foto'} ${position + 1} de ${items.length}: ${item.alt}`}
                className="group relative block size-full cursor-zoom-in overflow-hidden rounded-xl bg-mist-50 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-sun-400"
              >
                <Thumbnail item={item} large />
              </button>
            </li>
          ))}
        </ul>
        {!single && (
          <>
            {/* Touch users swipe; arrows help mouse users and hint there is more. */}
            {(['start', 'end'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => slide(side === 'start' ? -1 : 1)}
                disabled={edges[side]}
                aria-label={side === 'start' ? 'Ver anteriores' : 'Ver más'}
                className={`absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy-900 shadow-card transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:grid ${side === 'start' ? 'left-3' : 'right-3'}`}
              >
                {side === 'start' ? (
                  <ChevronLeft size={22} aria-hidden="true" />
                ) : (
                  <ChevronRight size={22} aria-hidden="true" />
                )}
              </button>
            ))}
            <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-navy-950/70 px-2.5 py-1 text-xs font-bold text-white">
              {items.length} archivos
            </span>
          </>
        )}
      </div>
      <Lightbox
        items={items}
        index={index}
        onIndexChange={setIndex}
        open={opened}
        onClose={() => setOpened(false)}
        label={label}
      />
    </>
  )
}
