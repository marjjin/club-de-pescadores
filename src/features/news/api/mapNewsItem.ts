import { getClubToday } from '@/shared/lib/dates'
import type { z } from '@/shared/lib/validation'
import type { newsRowSchema } from '../schemas/news'
import type { NewsItem } from '../types'

export function mapNewsItem(row: z.infer<typeof newsRowSchema>): NewsItem {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    publishedOn: getClubToday(new Date(row.published_at)),
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
  }
}
