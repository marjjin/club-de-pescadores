type Props = {
  /** Mirrors the real list so the layout does not jump when data arrives. */
  items?: number
  variant: 'card' | 'row'
  className?: string
  /** First card mirrors NewsList's wide lead card (md+: spans both columns, photo beside text). */
  lead?: boolean
}

const block = 'rounded-md bg-navy-900/8'

export function Skeleton({
  items = 3,
  variant,
  className = '',
  lead = false,
}: Props) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`grid gap-6 motion-safe:animate-pulse ${className}`}
    >
      {Array.from({ length: items }, (_, index) => {
        const wide = lead && index === 0
        return variant === 'card' ? (
          <div
            key={index}
            aria-hidden="true"
            className={`overflow-hidden rounded-2xl bg-white shadow-card ${
              wide ? 'md:col-span-2 md:grid md:grid-cols-[3fr_2fr]' : ''
            }`}
          >
            <div
              className={`aspect-[3/2] bg-navy-900/8 ${
                wide ? 'md:aspect-auto md:min-h-72 lg:min-h-80' : ''
              }`}
            />
            <div className="grid content-start gap-3 p-5">
              <div className={`h-4 w-24 ${block}`} />
              <div className={`h-6 w-4/5 ${block}`} />
              <div className={`h-4 w-full ${block}`} />
            </div>
          </div>
        ) : (
          <div
            key={index}
            aria-hidden="true"
            className="flex gap-4 rounded-2xl bg-white p-4 shadow-card"
          >
            <div className="h-20 w-16 shrink-0 rounded-xl bg-navy-900/8" />
            <div className="grid flex-1 content-start gap-3 py-1">
              <div className={`h-5 w-3/4 ${block}`} />
              <div className={`h-4 w-1/2 ${block}`} />
              <div className={`h-4 w-1/3 ${block}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
