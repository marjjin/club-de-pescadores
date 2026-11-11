import { z } from '@/shared/lib/validation'
import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import { newsRowSchema } from '../schemas/news'
import { mapNewsItem } from './mapNewsItem'
import type { NewsItem } from '../types'

export async function getNewsItem(
  id: string,
  signal?: AbortSignal,
): Promise<NewsItem | null> {
  signal?.throwIfAborted()
  const parsedId = newsRowSchema.shape.id.safeParse(id)
  if (!parsedId.success) return null
  const { data } = await getSupabase()
    .from('news')
    .select(
      'id,title,excerpt,published_at,image_url,image_alt,image_focus_x,image_focus_y',
    )
    .eq('id', parsedId.data)
    .eq('is_published', true)
    .is('deleted_at', null)
    .lte('published_at', new Date().toISOString())
    .limit(1)
    .abortSignal(requestSignal(signal))
    .throwOnError()
  const rows = z.array(newsRowSchema).max(1).parse(data)
  return rows[0] ? mapNewsItem(rows[0]) : null
}
