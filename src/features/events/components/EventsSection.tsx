import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { textLink } from '@/shared/ui/button'
import { container, section } from '@/shared/ui/layout'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useUpcomingEvents } from '../hooks/useUpcomingEvents'
import { EventsList, eventsGrid } from './EventsList'

export function EventsSection() {
  const query = useUpcomingEvents()
  return (
    <section id="eventos" className={`bg-mist-50 ${section}`}>
      <div className={container}>
        <SectionHeading
          title="Próximos eventos"
          action={
            <Link to="/eventos" className={textLink}>
              Ver calendario completo
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          }
        />
        <div className="mt-10">
          <QueryBoundary
            query={query}
            emptyMessage="No hay eventos programados."
            loading={<Skeleton variant="row" className={eventsGrid} />}
          >
            {(items) => <EventsList items={items} />}
          </QueryBoundary>
        </div>
      </div>
    </section>
  )
}
