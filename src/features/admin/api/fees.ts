import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import { adminFeesSchema } from '../schemas/fees'
import type { FeesInput } from '../schemas/fees'
import { adminError, parseAdminResponse } from './errors'

export async function getAdminFees(signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('admin_get_fees')
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(adminFeesSchema, data)
}

export async function saveFees(input: FeesInput, version: string) {
  const { data, error } = await getAdminSupabase().rpc('admin_save_fees', {
    p_data: input,
    p_version: version,
  })
  if (error) throw adminError(error)
  return parseAdminResponse(adminFeesSchema, data)
}
