import { NewsArchive } from '@/features/news'
import { PAGES } from '@/shared/seo/pages.mjs'
import { container } from '@/shared/ui/layout'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function NewsPage() {
  return (
    <>
      <title>{PAGES.news.title}</title>
      <meta name="description" content={PAGES.news.description} />
      <link
        rel="canonical"
        href={`${import.meta.env.VITE_SITE_URL}/noticias`}
      />
      <PageHeader
        title="Noticias del club"
        description="Novedades, torneos y actividades del Club de Pescadores."
      />
      <section
        aria-labelledby="news-list-title"
        className={`${container} py-12 lg:py-16`}
      >
        {/* Keeps the outline h1 → h2 → h3 for the cards below. */}
        <h2 id="news-list-title" className="sr-only">
          Todas las noticias
        </h2>
        <NewsArchive />
      </section>
    </>
  )
}
