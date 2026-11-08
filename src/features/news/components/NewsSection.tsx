import { Link } from 'react-router'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { useLatestNews } from '../hooks/useLatestNews'
import { NewsList } from './NewsList'

export function NewsSection() {
  const query = useLatestNews()
  return (
    <section id="noticias" className="bg-mist-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading title="Últimas noticias" />
          <Link
            to="/noticias"
            className="font-semibold text-river-600 hover:underline"
          >
            Ver todas las noticias
          </Link>
        </div>
        <div className="mt-8">
          <QueryBoundary query={query} emptyMessage="Todavía no hay noticias.">
            {(items) => <NewsList items={items} />}
          </QueryBoundary>
        </div>
      </div>
    </section>
  )
}
