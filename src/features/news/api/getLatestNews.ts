import { z } from '@/shared/lib/validation'
import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import { getPageSize } from '@/shared/lib/pagination'
import type { ListRequest, ListPage } from '@/shared/lib/pagination'
import { newsCursorSchema, newsRowSchema } from '../schemas/news'
import type { NewsCursor } from '../schemas/news'
import type { NewsItem } from '../types'
import { mapNewsItem } from './mapNewsItem'

type Request = ListRequest & { cursor?: NewsCursor | undefined }

export async function getNewsPage({
  limit,
  signal,
  cursor,
}: Request = {}): Promise<ListPage<NewsItem, NewsCursor>> {
  signal?.throwIfAborted()
  const pageSize = getPageSize(limit)
  let query = getSupabase()
    .from('news')
    .select(
      'id,title,excerpt,published_at,image_url,image_alt,image_focus_x,image_focus_y',
    )
    .eq('is_published', true)
    .is('deleted_at', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pageSize)
  if (cursor) {
    const { publishedAt, id } = newsCursorSchema.parse(cursor)
    query = query.or(
      `published_at.lt.${publishedAt},and(published_at.eq.${publishedAt},id.lt.${id})`,
    )
  }
  const { data } = await query.abortSignal(requestSignal(signal)).throwOnError()
  const rows = z.array(newsRowSchema).max(pageSize).parse(data)
  const last = rows.at(-1)
  return {
    items: rows.map(mapNewsItem),
    nextCursor:
      rows.length === pageSize && last
        ? { publishedAt: last.published_at, id: last.id }
        : null,
  }
}

export async function getLatestNews(
  request: ListRequest = {},
): Promise<NewsItem[]> {
  return (await getNewsPage(request)).items
}
