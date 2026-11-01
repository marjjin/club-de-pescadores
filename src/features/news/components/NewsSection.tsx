import { formatShortDate } from '../../../shared/lib/dates'
import { ComingSoonLink } from '../../../shared/ui/ComingSoonLink'
import { QueryBoundary } from '../../../shared/ui/QueryBoundary'
import { SectionHeading } from '../../../shared/ui/SectionHeading'
import { useLatestNews } from '../hooks/useLatestNews'

export function NewsSection() {
  const news = useLatestNews()

  return (
    <section id="noticias" className="bg-mist-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading title="Últimas noticias" />
          <ComingSoonLink className="font-semibold text-river-600 hover:underline">
            Ver todas las noticias
          </ComingSoonLink>
        </div>
        <div className="mt-8">
          <QueryBoundary query={news} emptyMessage="Todavía no hay noticias.">
            {(items) => (
              <ul className="grid gap-6 md:grid-cols-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <article className="group h-full overflow-hidden rounded-md bg-white shadow-card">
                      <div className="overflow-hidden">
                        <img
                          src={item.imageUrl}
                          width="600"
                          height="400"
                          loading="lazy"
                          alt={item.imageAlt}
                          className="aspect-[3/2] w-full object-cover transition-[scale] duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
                        />
                      </div>
                      <div className="p-5">
                        <time
                          dateTime={item.publishedOn}
                          className="block text-sm font-semibold text-river-600"
                        >
                          {formatShortDate(item.publishedOn)}
                        </time>
                        <h3 className="mt-1 text-xl leading-snug font-bold">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-ink-600">{item.excerpt}</p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </div>
      </div>
    </section>
  )
}
