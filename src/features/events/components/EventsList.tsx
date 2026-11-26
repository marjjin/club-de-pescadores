import { Link } from 'react-router'
import { ChevronRight, Clock, MapPin, Trophy } from 'lucide-react'
import { formatDayMonth } from '@/shared/lib/dates'
import type { ClubEvent } from '../types'

export const eventsGrid =
  'grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4 sm:gap-6'

export function EventsList({ items }: { items: ClubEvent[] }) {
  return (
    <ul className={`reveal-stagger ${eventsGrid}`}>
      {items.map((event) => {
        const { day, month } = formatDayMonth(event.startsOn)
        const tournament = event.tournamentId
        return (
          <li
            key={event.id}
            className={`relative flex min-w-0 items-start gap-4 rounded-2xl border border-navy-900/5 bg-white p-4 shadow-card sm:p-5 ${tournament ? 'transition-shadow focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-sun-400 hover:shadow-lg' : ''}`}
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
              {tournament && (
                <p className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-sun-400/25 px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-navy-900 uppercase">
                  <Trophy aria-hidden="true" className="size-3.5" />
                  Torneo
                </p>
              )}
              <h3 className="text-lg leading-snug font-bold">
                {tournament ? (
                  // The whole card is the link; the title names it for screen readers.
                  <Link
                    to={`/torneos/${tournament}`}
                    className="outline-none after:absolute after:inset-0 after:rounded-2xl hover:text-river-600"
                  >
                    {event.title}
                  </Link>
                ) : (
                  event.title
                )}
              </h3>
              <p className="mt-2 flex min-w-0 items-start gap-1.5 text-sm text-ink-600">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">{event.place}</span>
              </p>
              {event.startsAt && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
                  <Clock aria-hidden="true" className="size-4 shrink-0" />
                  {event.startsAt} hs
                </p>
              )}
              {event.description && (
                <p className="mt-3 line-clamp-3 border-t border-navy-900/10 pt-3 text-sm leading-6 whitespace-pre-line">
                  {event.description}
                </p>
              )}
              {tournament && (
                <p
                  aria-hidden="true"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-river-600"
                >
                  Ver tabla de posiciones
                  <ChevronRight className="size-4" />
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
