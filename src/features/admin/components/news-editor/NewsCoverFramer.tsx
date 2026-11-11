import { useId, useRef } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import { Crosshair, Move } from 'lucide-react'

type Focus = { x: number; y: number }
const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

/**
 * With object-cover only the overflowing axis can move, and a pointer delta must be
 * scaled by that overflow so the photo follows the finger instead of jumping.
 */
function overflow(container: HTMLElement) {
  const img = container.querySelector('img')
  if (!img?.naturalWidth || !img.naturalHeight) return { x: 0, y: 0 }
  const { width, height } = container.getBoundingClientRect()
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
  return {
    x: img.naturalWidth * scale - width,
    y: img.naturalHeight * scale - height,
  }
}

export function NewsCoverFramer({
  focus,
  disabled,
  onChange,
  children,
}: {
  focus: Focus
  disabled: boolean
  onChange: (focus: Focus) => void
  children: ReactNode
}) {
  const id = useId()
  const surface = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; start: Focus } | null>(null)
  function down(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, start: focus }
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !surface.current) return
    const room = overflow(surface.current)
    const { start } = drag.current
    // Dragging the photo right reveals its left side, so the focus moves the other way.
    onChange({
      x:
        room.x > 0
          ? clamp(start.x - ((event.clientX - drag.current.x) / room.x) * 100)
          : start.x,
      y:
        room.y > 0
          ? clamp(start.y - ((event.clientY - drag.current.y) / room.y) * 100)
          : start.y,
    })
  }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 2
    const delta = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }[event.key]
    if (!delta || disabled) return
    event.preventDefault()
    onChange({ x: clamp(focus.x + delta.x), y: clamp(focus.y + delta.y) })
  }
  const centred = focus.x === 50 && focus.y === 50
  return (
    <div>
      <div
        ref={surface}
        role="group"
        tabIndex={disabled ? -1 : 0}
        aria-label="Encuadre de la portada"
        aria-describedby={`${id}-help ${id}-value`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={key}
        className={`group relative touch-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-sun-400 ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-navy-950/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm"
        >
          <Move size={14} />
          Arrastrá para encuadrar
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-600">
        <p id={`${id}-help`}>
          Así se recorta en las tarjetas del sitio. También podés usar las
          flechas del teclado.
        </p>
        <button
          type="button"
          disabled={disabled || centred}
          onClick={() => onChange({ x: 50, y: 50 })}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 font-bold text-river-600 hover:bg-mist-50 disabled:opacity-50"
        >
          <Crosshair size={14} aria-hidden="true" />
          Centrar
        </button>
      </div>
      <p id={`${id}-value`} className="sr-only" aria-live="polite">
        Horizontal {focus.x} %, vertical {focus.y} %
      </p>
    </div>
  )
}
