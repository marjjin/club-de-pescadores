import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import { z } from '@/shared/lib/validation'
import { riverReadingSchema } from '../schemas/river'

export async function getRiverLevel(signal?: AbortSignal) {
  signal?.throwIfAborted()
  const { data } = await getSupabase()
    .from('river_levels')
    .select('id,height_cm,measured_at,station,source')
    .eq('id', 1)
    .eq('is_published', true)
    .lte('measured_at', new Date().toISOString())
    .limit(1)
    .abortSignal(requestSignal(signal))
    .throwOnError()
  return z.array(riverReadingSchema).max(1).parse(data)[0] ?? null
}
