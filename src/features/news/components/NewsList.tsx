import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatShortDate } from '@/shared/lib/dates'
import { summarizeNews } from '../summary'
import type { NewsItem } from '../types'

type Props = {
  items: NewsItem[]
  /** Home only: the latest item gets a wide card so the section has a lead. */
  featured?: boolean
}

export function NewsList({ items, featured = false }: Props) {
  return (
    <ul
      className={`grid gap-6 ${featured ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}
    >
      {items.map((item, index) => {
        const lead = featured && index === 0
        return (
          <li
            key={item.id}
            className={`min-w-0 ${lead ? 'md:col-span-2' : ''}`}
          >
            <article className="h-full min-w-0">
              <Link
                to={`/noticias/${item.id}`}
                aria-label={`Leer noticia: ${item.title}`}
                className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-navy-900/5 bg-white shadow-card transition-[box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:shadow-raised motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  lead ? 'md:grid md:grid-cols-[3fr_2fr]' : ''
                }`}
              >
                {/* On the wide card the photo is absolute, so a tall phone picture never sets the card height. */}
                <div
                  className={`overflow-hidden ${lead ? 'md:relative md:min-h-72 lg:min-h-80' : ''}`}
                >
                  <img
                    src={item.imageUrl}
                    width={lead ? 900 : 600}
                    height={lead ? 600 : 400}
                    loading="lazy"
                    alt={item.imageAlt}
                    style={{ objectPosition: item.imagePosition }}
                    className={`aspect-[3/2] w-full object-cover transition-[scale] duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none ${
                      lead
                        ? 'md:absolute md:inset-0 md:aspect-auto md:h-full'
                        : ''
                    }`}
                  />
                </div>
                <div
                  className={`flex min-w-0 flex-1 flex-col p-5 wrap-anywhere ${lead ? 'sm:p-8' : ''}`}
                >
                  <time
                    dateTime={item.publishedOn}
                    className="block text-sm font-bold text-river-600"
                  >
                    {formatShortDate(item.publishedOn)}
                  </time>
                  <h3
                    className={`mt-2 leading-snug font-extrabold ${lead ? 'text-2xl sm:text-3xl' : 'text-xl'}`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`mt-3 text-ink-600 ${lead ? 'line-clamp-5 leading-7' : 'line-clamp-3 text-sm leading-6'}`}
                  >
                    {summarizeNews(item.excerpt)}
                  </p>
                  <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-river-600">
                    <span className="underline-offset-4 group-hover:underline">
                      Leer noticia
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="transition-[translate] duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </span>
                </div>
              </Link>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
