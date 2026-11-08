import { formatShortDate } from '@/shared/lib/dates'
import type { NewsItem } from '../types'

export function NewsList({ items }: { items: NewsItem[] }) {
  return (
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
  )
}
