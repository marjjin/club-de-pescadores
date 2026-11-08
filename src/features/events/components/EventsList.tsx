import { Clock, MapPin } from 'lucide-react'
import { formatDayMonth } from '@/shared/lib/dates'
import type { ClubEvent } from '../types'

export function EventsList({ items }: { items: ClubEvent[] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
      {items.map((event) => {
        const { day, month } = formatDayMonth(event.startsOn)
        return (
          <li
            key={event.id}
            className="flex items-center gap-4 rounded-md bg-white p-4 shadow-card"
          >
            <time
              dateTime={event.startsOn}
              className="w-16 shrink-0 rounded-md bg-navy-900 py-3 text-center text-white"
            >
              <span className="block text-3xl leading-none font-extrabold">
                {day}
              </span>
              <span className="mt-1 block text-sm font-bold text-sun-400">
                {month}
              </span>
            </time>
            <div className="min-w-0">
              <h3 className="text-lg leading-snug font-bold">{event.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                {event.place}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-ink-600">
                <Clock aria-hidden="true" className="size-4 shrink-0" />
                {event.startsAt} hs
              </p>
              {event.description && (
                <p className="mt-2 line-clamp-3 text-sm leading-5 whitespace-pre-line">
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
