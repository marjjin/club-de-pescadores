import { Clock, MapPin } from 'lucide-react'
import { formatDayMonth } from '@/shared/lib/dates'
import type { ClubEvent } from '../types'

export const eventsGrid =
  'grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4 sm:gap-6'

export function EventsList({ items }: { items: ClubEvent[] }) {
  return (
    <ul className={eventsGrid}>
      {items.map((event) => {
        const { day, month } = formatDayMonth(event.startsOn)
        return (
          <li
            key={event.id}
            className="flex min-w-0 items-start gap-4 rounded-2xl border border-navy-900/5 bg-white p-4 shadow-card sm:p-5"
          >
            <time
              dateTime={event.startsOn}
              className="w-16 shrink-0 overflow-hidden rounded-xl bg-navy-900 text-center text-white"
            >
              <span className="block pt-3 font-display text-4xl leading-none">
                {day}
              </span>
              <span className="mt-2 block bg-sun-400 py-1 text-xs font-extrabold tracking-wider text-navy-950 uppercase">
                {month}
              </span>
            </time>
            <div className="min-w-0 flex-1 wrap-anywhere">
              <h3 className="text-lg leading-snug font-bold">{event.title}</h3>
              <p className="mt-2 flex min-w-0 items-start gap-1.5 text-sm text-ink-600">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">{event.place}</span>
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
                <Clock aria-hidden="true" className="size-4 shrink-0" />
                {event.startsAt} hs
              </p>
              {event.description && (
                <p className="mt-3 line-clamp-3 border-t border-navy-900/10 pt-3 text-sm leading-6 whitespace-pre-line">
                  {event.description}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
