import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import { z } from '@/shared/lib/validation'
import { MAX_FEES, feeRowSchema, feeScheduleRowSchema } from '../schemas/fees'
import type { FeeSchedule } from '../types'

export async function getFees(
  signal?: AbortSignal,
): Promise<FeeSchedule | null> {
  signal?.throwIfAborted()
  const client = getSupabase()
  const [schedule, fees] = await Promise.all([
    client
      .from('fee_schedules')
      .select('valid_from,note')
      .eq('id', 1)
      .limit(1)
      .abortSignal(requestSignal(signal))
      .throwOnError(),
    client
      .from('fees')
      .select('id,kind,name,detail,icon,price_cents')
      .order('kind')
      .order('position')
      .limit(MAX_FEES)
      .abortSignal(requestSignal(signal))
      .throwOnError(),
  ])
  const head = z.array(feeScheduleRowSchema).max(1).parse(schedule.data)[0]
  const rows = z.array(feeRowSchema).max(MAX_FEES).parse(fees.data)
  if (!head || !rows.length) return null
  return {
    validFrom: head.valid_from,
    note: head.note,
    fees: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      detail: row.detail,
      icon: row.icon,
      price: row.price_cents / 100,
    })),
  }
}
