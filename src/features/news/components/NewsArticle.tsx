import { ArrowLeft, ArrowUpRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router'
import { formatShortDate } from '@/shared/lib/dates'
import { button } from '@/shared/ui/button'
import { useNewsItem } from '../hooks/useNewsItem'

export function NewsArticle({ id }: { id: string }) {
  const query = useNewsItem(id)
  const item = query.data
  if (query.isPending)
    return (
      <section
        role="status"
        aria-label="Cargando noticia"
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
      >
        <span className="sr-only">Cargando la noticia…</span>
        <div
          aria-hidden="true"
          className="grid gap-6 motion-safe:animate-pulse"
        >
          <div className="h-4 w-36 rounded bg-mist-50" />
          <div className="h-12 w-3/4 rounded bg-navy-900/10" />
          <div className="aspect-video rounded-2xl bg-mist-50" />
        </div>
      </section>
    )
  if (!item)
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <title>Noticia no disponible | Club de Pescadores San Nicolás</title>
        {!query.isError && <meta name="robots" content="noindex" />}
        <h1 className="text-3xl font-extrabold">
          {query.isError
            ? 'No pudimos cargar la noticia'
            : 'Esta noticia no está disponible'}
        </h1>
        <p className="mt-4 leading-7 text-ink-600">
          {query.isError
            ? 'Revisá tu conexión y volvé a intentarlo.'
            : 'Podés consultar las últimas publicaciones del club.'}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-4">
          {query.isError && (
            <button
              type="button"
              className={button.primary}
              onClick={() => {
                void query.refetch()
              }}
            >
              Reintentar
            </button>
          )}
          <Link
            to="/noticias"
            className="inline-flex min-h-12 items-center gap-2 font-bold text-river-600 hover:underline"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Volver a noticias
          </Link>
        </div>
      </section>
    )
  return (
    <section className="bg-white px-4 py-10 sm:px-6 sm:py-14">
      <title>{item.title} | Club de Pescadores San Nicolás</title>
      <link
        rel="canonical"
        href={`${import.meta.env.VITE_SITE_URL}/noticias/${item.id}`}
      />
      <article className="mx-auto min-w-0 max-w-5xl">
        <header className="mx-auto max-w-3xl">
          <Link
            to="/noticias"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-river-600 hover:underline"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Todas las noticias
          </Link>
          <p className="mt-7 text-xs font-extrabold tracking-[0.18em] text-river-600 uppercase">
            Novedades del club
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-extrabold wrap-anywhere text-navy-900 sm:text-5xl">
            {item.title}
          </h1>
          <time
            dateTime={item.publishedOn}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-600"
          >
            <CalendarDays size={16} aria-hidden="true" />
            {formatShortDate(item.publishedOn)}
          </time>
        </header>
        {query.isError && (
          <p
            role="status"
            className="mx-auto mt-5 max-w-3xl rounded-lg bg-mist-50 p-3 text-sm text-ink-600"
          >
            No pudimos actualizar esta noticia. Mostramos la última versión
            disponible.
          </p>
        )}
        <figure className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-navy-900/10 bg-mist-50">
            <img
              src={item.imageUrl}
              alt={item.imageAlt}
              width="1200"
              height="800"
              className="max-h-[65vh] w-full object-contain"
            />
          </div>
          <figcaption className="mt-3 text-right">
            <a
              href={item.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-river-600 hover:underline"
              aria-label="Ver imagen completa (abre otra pestaña)"
            >
              Ver imagen completa
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </figcaption>
        </figure>
        <div className="mx-auto mt-6 max-w-3xl text-base leading-8 whitespace-pre-wrap wrap-anywhere text-ink-600 sm:text-lg">
          {item.excerpt}
        </div>
        <footer className="mx-auto mt-12 max-w-3xl border-t border-navy-900/10 pt-6">
          <Link
            to="/noticias"
            className="inline-flex min-h-11 items-center gap-2 font-bold text-river-600 hover:underline"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Volver a todas las noticias
          </Link>
        </footer>
      </article>
    </section>
  )
}
