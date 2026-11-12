import { EventsArchive } from '@/features/events'
import { container } from '@/shared/ui/layout'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function EventsPage() {
  return (
    <>
      <title>Eventos | Club de Pescadores San Nicolás</title>
      <link rel="canonical" href={`${import.meta.env.VITE_SITE_URL}/eventos`} />
      <PageHeader
        title="Calendario de eventos"
        description="Todas las actividades programadas del club."
      />
      <section
        aria-label="Listado de eventos"
        className={`${container} py-12 lg:py-16`}
      >
        <EventsArchive />
      </section>
    </>
  )
}
