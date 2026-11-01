import catchImage from '../../../assets/images/news-catch.webp'
import contestImage from '../../../assets/images/news-contest.webp'
import riverImage from '../../../assets/images/news-river.webp'
import type { NewsItem } from '../types'

// Datos del diseño. Se reemplazan por la consulta a Supabase sin tocar la interfaz.
export async function getLatestNews(): Promise<NewsItem[]> {
  return [
    {
      id: 'capturas',
      title: 'Grandes capturas en el club',
      excerpt:
        'Nuestros socios siguen disfrutando de excelentes jornadas de pesca en el río. ¡Felicitaciones!',
      publishedOn: '2026-10-12',
      imageUrl: catchImage,
      imageAlt: 'Chico sonriente sosteniendo un pescado a orillas del río',
    },
    {
      id: 'muelle',
      title: 'Mejoras en el muelle',
      excerpt:
        'Se realizaron trabajos de mantenimiento y mejoras en el muelle para una mejor experiencia de todos los socios.',
      publishedOn: '2026-10-08',
      imageUrl: riverImage,
      imageAlt: 'Vista del río y la bajada de lanchas del club',
    },
    {
      id: 'concurso',
      title: 'Concurso de pesca - Fecha 6',
      excerpt:
        'Nueva fecha del Ranking 2026. ¡Los esperamos a todos los socios!',
      publishedOn: '2026-09-28',
      imageUrl: contestImage,
      imageAlt:
        'Afiche del concurso de pesca deportiva, fecha 6 del ranking 2026',
    },
  ]
}
