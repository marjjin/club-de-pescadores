import { Link } from 'react-router'
import { EventsArchive } from '@/features/events'

export default function EventsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <title>Eventos | Club de Pescadores San Nicolás</title>
      <link rel="canonical" href={`${import.meta.env.VITE_SITE_URL}/eventos`} />
      <Link to="/" className="font-bold text-river-600 hover:underline">
        Volver al inicio
      </Link>
      <h1 className="mt-6 mb-8 text-4xl font-extrabold">
        Calendario de eventos
      </h1>
      <EventsArchive />
    </section>
  )
}
