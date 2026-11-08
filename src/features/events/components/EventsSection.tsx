import { Link } from 'react-router'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { useUpcomingEvents } from '../hooks/useUpcomingEvents'
import { EventsList } from './EventsList'

export function EventsSection() {
  const query = useUpcomingEvents()
  return (
    <section id="eventos" className="bg-mist-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading title="Próximos eventos" />
          <Link
            to="/eventos"
            className="font-semibold text-river-600 hover:underline"
          >
            Ver calendario completo
          </Link>
        </div>
        <div className="mt-8">
          <QueryBoundary
            query={query}
            emptyMessage="No hay eventos programados."
          >
            {(items) => <EventsList items={items} />}
          </QueryBoundary>
        </div>
      </div>
    </section>
  )
}
