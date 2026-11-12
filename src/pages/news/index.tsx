import { NewsArchive } from '@/features/news'
import { container } from '@/shared/ui/layout'
import { PageHeader } from '@/shared/ui/PageHeader'

export default function NewsPage() {
  return (
    <>
      <title>Noticias | Club de Pescadores San Nicolás</title>
      <link
        rel="canonical"
        href={`${import.meta.env.VITE_SITE_URL}/noticias`}
      />
      <PageHeader
        title="Noticias del club"
        description="Novedades, torneos y actividades del Club de Pescadores."
      />
      <section
        aria-label="Listado de noticias"
        className={`${container} py-12 lg:py-16`}
      >
        <NewsArchive />
      </section>
    </>
  )
}
