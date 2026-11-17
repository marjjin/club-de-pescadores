import { AnnualTablesList, TournamentsArchive } from '@/features/tournaments'
import { PAGES } from '@/shared/seo/pages.mjs'
import { container } from '@/shared/ui/layout'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function TournamentsPage() {
  return (
    <>
      <title>{PAGES.tournaments.title}</title>
      <meta name="description" content={PAGES.tournaments.description} />
      <link rel="canonical" href={`${import.meta.env.VITE_SITE_URL}/torneos`} />
      <PageHeader
        title="Torneos"
        description="Torneos de pesca del club, sus tablas de posiciones y las tablas anuales."
      />
      <div className={`${container} py-12 lg:py-16`}>
        <AnnualTablesList />
        <section aria-labelledby="tournaments-title">
          <h2
            id="tournaments-title"
            className="mb-6 font-display text-3xl tracking-wide uppercase sm:text-4xl"
          >
            Todos los torneos
          </h2>
          <TournamentsArchive />
        </section>
      </div>
    </>
  )
}
