import { Link } from 'react-router'
import { NewsArchive } from '@/features/news'

export default function NewsPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <title>Noticias | Club de Pescadores San Nicolás</title>
      <link
        rel="canonical"
        href={`${import.meta.env.VITE_SITE_URL}/noticias`}
      />
      <Link to="/" className="font-bold text-river-600 hover:underline">
        Volver al inicio
      </Link>
      <h1 className="mt-6 mb-8 text-4xl font-extrabold">Noticias del club</h1>
      <NewsArchive />
    </section>
  )
}
