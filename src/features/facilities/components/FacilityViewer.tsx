import { useId, useRef } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useModalDialog } from '@/shared/hooks/useModalDialog'
import type { Facility } from '../types'

// A horizontal drag shorter than this is a tap or a shaky hand, not a swipe.
const SWIPE_DISTANCE = 48

const stepButton =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-navy-900/15 px-4 font-bold text-navy-900 transition-colors hover:border-navy-900/30 hover:bg-mist-50 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none'

type Props = {
  facilities: Facility[]
  index: number
  onIndexChange: (index: number) => void
  open: boolean
  onClose: () => void
}

/**
 * Window with one facility at a time: its photo large, its name and description,
 * and the others one tap away. A centred window on wide screens and a sheet that
 * rises from the bottom on phones (the shared .modal styles in index.css).
 */
export function FacilityViewer({
  facilities,
  index,
  onIndexChange,
  open,
  onClose,
}: Props) {
  const id = useId()
  const { requestClose, dialogProps } = useModalDialog(open, onClose)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const current = facilities[index]
  const count = facilities.length
  const go = (step: number) => {
    const next = Math.min(count - 1, Math.max(0, index + step))
    if (next !== index) onIndexChange(next)
  }
  function keys(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowLeft') go(-1)
    if (event.key === 'ArrowRight') go(1)
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    // Mouse users have the buttons; swiping is for touch.
    if (event.pointerType === 'mouse') return
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const dx = event.clientX - start.x
    if (
      Math.abs(dx) > SWIPE_DISTANCE &&
      Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.5
    )
      go(dx < 0 ? 1 : -1)
  }

  return (
    <dialog
      {...dialogProps}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onKeyDown={keys}
      style={{ '--modal-width': '58rem' } as CSSProperties}
      className="modal sm:overflow-hidden"
    >
      {current && (
        <div className="grid sm:h-[min(40rem,calc(100dvh-4rem))] sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div
            onPointerDown={pointerDown}
            onPointerUp={pointerUp}
            onPointerCancel={() => {
              swipeStart.current = null
            }}
            className="relative h-[min(46dvh,24rem)] touch-pan-y overflow-hidden bg-navy-950 sm:h-full"
          >
            {/* Remounted per facility so each photo fades in on its own. */}
            <img
              key={current.imageUrl}
              src={current.imageUrl}
              alt={current.imageAlt}
              width="600"
              height="750"
              draggable={false}
              className="lightbox-media size-full object-cover select-none"
            />
            {count > 1 && (
              <p
                aria-hidden="true"
                className="absolute bottom-3 left-3 rounded-full bg-navy-950/70 px-2.5 py-1 text-xs font-bold text-white tabular-nums"
              >
                {index + 1} de {count}
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-col gap-6 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:overflow-y-auto sm:p-8">
            {/* Every facility's text sits in the same cell and only the current one
                shows, so the block is as tall as the longest: the sheet keeps its
                height instead of jumping as people step through. */}
            <div className="grid sm:pr-10">
              {facilities.map((facility, position) => {
                const isCurrent = position === index
                return (
                  <div
                    // A new key when it becomes current, so it fades in again.
                    key={`${facility.id}-${isCurrent}`}
                    aria-hidden={!isCurrent}
                    className={`[grid-area:1/1] ${isCurrent ? 'lightbox-media' : 'invisible'}`}
                  >
                    <span
                      aria-hidden="true"
                      className="mb-4 block h-1 w-10 rounded-full bg-sun-400"
                    />
                    <h2
                      id={isCurrent ? `${id}-title` : undefined}
                      className="font-display text-4xl leading-none tracking-wide wrap-anywhere text-navy-900 uppercase sm:text-5xl"
                    >
                      {facility.name}
                    </h2>
                    <p
                      id={isCurrent ? `${id}-description` : undefined}
                      className="mt-3 text-lg leading-7 wrap-anywhere text-ink-600"
                    >
                      {facility.description}
                    </p>
                  </div>
                )
              })}
            </div>

            {count > 1 && (
              <div className="mt-auto grid gap-4">
                <ul
                  aria-label="Instalaciones"
                  className="grid grid-cols-4 gap-2"
                >
                  {facilities.map((facility, position) => (
                    <li key={facility.id}>
                      <button
                        type="button"
                        onClick={() => onIndexChange(position)}
                        aria-label={facility.name}
                        aria-current={position === index ? 'true' : undefined}
                        className={`block w-full overflow-hidden rounded-lg ring-offset-2 transition-[opacity,box-shadow] motion-reduce:transition-none ${
                          position === index
                            ? 'ring-3 ring-sun-400'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={facility.imageUrl}
                          alt=""
                          width="600"
                          height="750"
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    disabled={index === 0}
                    aria-label={
                      index > 0
                        ? `Anterior: ${facilities[index - 1]?.name}`
                        : 'Anterior'
                    }
                    className={stepButton}
                  >
                    <ChevronLeft size={20} aria-hidden="true" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    disabled={index === count - 1}
                    aria-label={
                      index < count - 1
                        ? `Siguiente: ${facilities[index + 1]?.name}`
                        : 'Siguiente'
                    }
                    className={stepButton}
                  >
                    Siguiente
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Over the photo on phones and the white panel on wide screens: it needs its
          own background to read on both. */}
      <button
        type="button"
        onClick={requestClose}
        aria-label="Cerrar"
        data-autofocus
        className="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-white text-navy-900 shadow-card ring-1 ring-navy-900/10 transition-colors hover:bg-mist-50"
      >
        <X size={20} aria-hidden="true" />
      </button>
      {/* What changed when someone steps through, for screen readers. */}
      <p aria-live="polite" className="sr-only">
        {current && count > 1 && `${current.name}, ${index + 1} de ${count}`}
      </p>
    </dialog>
  )
}
