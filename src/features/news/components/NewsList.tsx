import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatShortDate } from '@/shared/lib/dates'
import { summarizeNews } from '../summary'
import type { NewsItem } from '../types'

export function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <article className="h-full min-w-0">
            <Link
              to={`/noticias/${item.id}`}
              aria-label={`Leer noticia: ${item.title}`}
              className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-white shadow-card transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-river-600 motion-reduce:transition-none"
            >
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
              <div className="flex min-w-0 flex-1 flex-col p-5 wrap-anywhere">
                <time
                  dateTime={item.publishedOn}
                  className="block text-sm font-semibold text-river-600"
                >
                  {formatShortDate(item.publishedOn)}
                </time>
                <h3 className="mt-1 text-xl leading-snug font-bold">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-600">
                  {summarizeNews(item.excerpt)}
                </p>
                <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-river-600 group-hover:underline">
                  Leer noticia
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          </article>
        </li>
      ))}
    </ul>
  )
}
