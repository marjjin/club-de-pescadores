import { Expand } from 'lucide-react'
import type { Facility } from '../types'

export function FacilityCard({
  facility,
  as: Tag = 'li',
  className = '',
  onOpen,
}: {
  facility: Pick<Facility, 'name' | 'description' | 'imageUrl' | 'imageAlt'>
  /** The admin preview renders a single card outside a list. */
  as?: 'li' | 'div'
  className?: string
  /** Opens the photo enlarged. Without it (admin preview) the card is static. */
  onOpen?: () => void
}) {
  return (
    <Tag
      className={`group relative isolate overflow-hidden rounded-2xl bg-navy-950 shadow-card ${className}`}
    >
      <img
        src={facility.imageUrl}
        width="600"
        height="750"
        loading="lazy"
        decoding="async"
        alt={facility.imageAlt}
        className="aspect-[4/5] w-full object-cover transition-[scale] duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
      />
      {/* Gradient only behind the caption, so the photo keeps its colour. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 via-navy-950/60 to-transparent px-5 pt-16 pb-5 text-white">
        <h3 className="font-display text-2xl tracking-wide wrap-anywhere uppercase">
          {facility.name}
        </h3>
        <p className="mt-1 text-sm leading-5 wrap-anywhere text-white/85">
          {facility.description}
        </p>
      </div>
      {onOpen && (
        // Covers the whole card, so a tap anywhere opens it; the icon shows that it can.
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Ampliar foto: ${facility.name}`}
          className="absolute inset-0 z-10 cursor-zoom-in rounded-2xl focus-visible:outline-offset-[-3px]"
        >
          <span
            aria-hidden="true"
            className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-navy-950/55 text-white backdrop-blur-sm transition-[background-color,scale] duration-200 group-hover:scale-110 group-hover:bg-navy-950/80 motion-reduce:transition-none"
          >
            <Expand size={18} />
          </span>
        </button>
      )}
    </Tag>
  )
}
