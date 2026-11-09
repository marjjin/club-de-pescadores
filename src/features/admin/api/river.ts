import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import { adminRiverSchema, riverInputSchema } from '../river-editor'
import type { z } from '@/shared/lib/validation'
import { adminError, parseAdminResponse } from './errors'

export async function getAdminRiverLevel(signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('admin_get_river_level')
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(adminRiverSchema.nullable(), data)
}
export async function saveRiverLevel({
  input,
  version,
}: {
  input: z.infer<typeof riverInputSchema>
  version: string | null
}) {
  const { data, error } = await getAdminSupabase().rpc(
    'admin_save_river_level',
    { p_data: riverInputSchema.parse(input), p_version: version },
  )
  if (error) throw adminError(error)
  return parseAdminResponse(adminRiverSchema, data)
}
