import { TournamentsArchive } from '@/features/tournaments'
import { container } from '@/shared/ui/layout'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function TournamentsPage() {
  return (
    <>
      <title>Torneos | Club de Pescadores San Nicolás</title>
      <meta
        name="description"
        content="Torneos de pesca del club y sus tablas de posiciones."
      />
      <link rel="canonical" href={`${import.meta.env.VITE_SITE_URL}/torneos`} />
      <PageHeader
        title="Torneos"
        description="Torneos de pesca del club y sus tablas de posiciones."
      />
      <section
        aria-label="Listado de torneos"
        className={`${container} py-12 lg:py-16`}
      >
        <TournamentsArchive />
      </section>
    </>
  )
}
