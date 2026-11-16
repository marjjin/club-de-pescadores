import type { Facility } from '../types'

export function FacilityCard({
  facility,
  as: Tag = 'li',
  className = '',
}: {
  facility: Pick<Facility, 'name' | 'description' | 'imageUrl' | 'imageAlt'>
  /** The admin preview renders a single card outside a list. */
  as?: 'li' | 'div'
  className?: string
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
    </Tag>
  )
}
