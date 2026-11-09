import { z } from '@/shared/lib/validation'
import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import { getClubToday } from '@/shared/lib/dates'
import { getPageSize } from '@/shared/lib/pagination'
import type { ListRequest } from '@/shared/lib/pagination'
import { poolRateRowSchema } from '../schemas/rate'
import type { PoolRate } from '../types'

export async function getPoolRates({
  limit,
  signal,
}: ListRequest = {}): Promise<PoolRate[]> {
  signal?.throwIfAborted()
  const pageSize = getPageSize(limit)
  const today = getClubToday()
  const { data } = await getSupabase()
    .from('pool_rates')
    .select(
      'id,season,period,family_price_cents,individual_price_cents,family_description,discount_note',
    )
    .eq('is_published', true)
    .is('deleted_at', null)
    .lte('valid_from', today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order('valid_from')
    .order('id')
    .limit(pageSize)
    .abortSignal(requestSignal(signal))
    .throwOnError()
  return z
    .array(poolRateRowSchema)
    .max(pageSize)
    .parse(data)
    .map((row) => ({
      id: row.id,
      season: row.season,
      period: row.period,
      familyPrice: row.family_price_cents / 100,
      individualPrice: row.individual_price_cents / 100,
      familyDescription: row.family_description,
      discountNote: row.discount_note,
    }))
}
