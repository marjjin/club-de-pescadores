import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { textLink } from '@/shared/ui/button'
import { container, section } from '@/shared/ui/layout'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useLatestNews } from '../hooks/useLatestNews'
import { NewsList } from './NewsList'

export function NewsSection() {
  const query = useLatestNews()
  return (
    <section id="noticias" className={`bg-mist-50 ${section}`}>
      <div className={container}>
        <SectionHeading
          title="Últimas noticias"
          action={
            <Link to="/noticias" className={textLink}>
              Ver todas las noticias
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          }
        />
        <div className="mt-10">
          <QueryBoundary
            query={query}
            emptyMessage="Todavía no hay noticias."
            loading={
              <Skeleton variant="card" lead className="md:grid-cols-2" />
            }
          >
            {(items) => <NewsList items={items} featured />}
          </QueryBoundary>
        </div>
      </div>
    </section>
  )
}
