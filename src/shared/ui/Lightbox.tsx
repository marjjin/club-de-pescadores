import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useModalDialog } from '../hooks/useModalDialog'

export type GalleryItem = {
  kind: 'image' | 'video'
  src: string
  poster: string | null
  width: number
  height: number
  alt: string
}

// A horizontal drag shorter than this is a tap or a shaky hand, not a swipe.
const SWIPE_DISTANCE = 48

const control =
  'grid size-11 place-items-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25 disabled:pointer-events-none disabled:opacity-25'

type Props = {
  items: GalleryItem[]
  index: number
  onIndexChange: (index: number) => void
  open: boolean
  onClose: () => void
  /** What the set of files is, for screen readers: "Fotos y videos del muelle". */
  label: string
}

/** Full-screen viewer for photos and videos: swipe on touch, arrows on keyboard. */
export function Lightbox({
  items,
  index,
  onIndexChange,
  open,
  onClose,
  label,
}: Props) {
  const { requestClose, dialogProps } = useModalDialog(open, onClose)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const current = items[index]
  const multiple = items.length > 1
  const go = (step: number) => {
    const next = Math.min(items.length - 1, Math.max(0, index + step))
    if (next !== index) onIndexChange(next)
  }
  function keys(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowLeft') go(-1)
    if (event.key === 'ArrowRight') go(1)
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    // Mouse users have the arrows; a drag on a video is its own scrubber.
    if (
      event.pointerType === 'mouse' ||
      event.target instanceof HTMLVideoElement
    )
      return
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5)
      go(dx < 0 ? 1 : -1)
    else if (dy > SWIPE_DISTANCE * 2 && dy > Math.abs(dx) * 1.5) requestClose()
  }
  const arrow = (step: -1 | 1, className: string) => (
    <button
      type="button"
      onClick={() => go(step)}
      disabled={step === -1 ? index === 0 : index === items.length - 1}
      aria-label={step === -1 ? 'Anterior' : 'Siguiente'}
      className={`${control} ${className}`}
    >
      {step === -1 ? (
        <ChevronLeft size={24} aria-hidden="true" />
      ) : (
        <ChevronRight size={24} aria-hidden="true" />
      )}
    </button>
  )
  return (
    <dialog
      {...dialogProps}
      aria-label={
        multiple ? `${label}: archivo ${index + 1} de ${items.length}` : label
      }
      onKeyDown={keys}
      className="lightbox"
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="flex items-center justify-between gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-6 sm:pt-5">
          <p
            aria-live="polite"
            className="text-sm font-bold text-white/80 tabular-nums"
          >
            {multiple && `${index + 1} de ${items.length}`}
          </p>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Cerrar"
            data-autofocus
            className={control}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div
          onPointerDown={pointerDown}
          onPointerUp={pointerUp}
          onPointerCancel={() => {
            swipeStart.current = null
          }}
          onClick={(event) => {
            // The empty area around the photo works like the backdrop of a smaller window.
            if (event.target === event.currentTarget) requestClose()
          }}
          // Swipes are ours; pinch-zoom stays with the browser. The explicit row gives
          // the photo a definite height to fit, so tall (portrait) photos never spill
          // past the screen.
          className="relative grid min-h-0 grid-rows-[minmax(0,1fr)] place-items-center [touch-action:pinch-zoom] sm:px-20"
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
                className="lightbox-media max-h-full max-w-full sm:rounded-lg"
              />
            ) : (
              <img
                key={current.src}
                src={current.src}
                alt={current.alt}
                width={current.width}
                height={current.height}
                draggable={false}
                className="lightbox-media h-auto max-h-full w-auto max-w-full object-contain select-none sm:rounded-lg"
              />
            ))}
          {multiple && (
            <>
              {arrow(
                -1,
                'absolute top-1/2 left-4 hidden -translate-y-1/2 sm:grid',
              )}
              {arrow(
                1,
                'absolute top-1/2 right-4 hidden -translate-y-1/2 sm:grid',
              )}
            </>
          )}
        </div>
        <div className="grid gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          {current?.alt && (
            // Screen readers already get it as the alt text.
            <p
              aria-hidden="true"
              className="mx-auto line-clamp-2 max-w-2xl text-center text-sm leading-6 text-white/75"
            >
              {current.alt}
            </p>
          )}
          {multiple && (
            <div className="flex items-center justify-center gap-5 sm:hidden">
              {arrow(-1, '')}
              {/* Past ten files the dots stop fitting; the counter at the top still tells. */}
              <span
                aria-hidden="true"
                className={`gap-1.5 ${items.length > 10 ? 'hidden' : 'flex'}`}
              >
                {items.map((item, position) => (
                  <span
                    key={item.src}
                    className={`size-1.5 rounded-full transition-colors ${position === index ? 'bg-sun-400' : 'bg-white/30'}`}
                  />
                ))}
              </span>
              {arrow(1, '')}
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}
