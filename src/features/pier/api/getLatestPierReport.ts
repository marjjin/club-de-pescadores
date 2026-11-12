import { z } from '@/shared/lib/validation'
import { getSupabase } from '@/lib/supabase/connection'
import { publicStorageUrl } from '@/lib/supabase/client'
import { requestSignal } from '@/lib/supabase/request'
import { pierRowSchema } from '../schemas/pier'
import type { PierReport } from '../types'

export async function getLatestPierReport(
  signal?: AbortSignal,
): Promise<PierReport | null> {
  signal?.throwIfAborted()
  const client = getSupabase()
  // One report with its media embedded: a single indexed request, no N+1.
  const { data } = await client
    .from('pier_reports')
    .select(
      'id,height_cm,measured_at,conditions,created_at,media_items(kind,path,poster_path,width,height,alt,position)',
    )
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .order('position', { referencedTable: 'media_items', ascending: true })
    .limit(1)
    .abortSignal(requestSignal(signal))
    .throwOnError()
  const row = z.array(pierRowSchema).max(1).parse(data)[0]
  if (!row) return null
  const url = (path: string) => publicStorageUrl('club-media', path)
  return {
    id: row.id,
    heightCm: row.height_cm,
    measuredAt: row.measured_at,
    conditions: row.conditions,
    media: row.media_items.map((item) => ({
      kind: item.kind,
      src: url(item.path),
      poster: item.poster_path ? url(item.poster_path) : null,
      width: item.width,
      height: item.height,
      alt: item.alt,
    })),
  }
}
