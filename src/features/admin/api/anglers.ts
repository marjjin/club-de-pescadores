import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import { z } from '@/shared/lib/validation'
import { anglerInputSchema, anglerSchema } from '../schemas/tournaments'
import type { Angler, AnglerInput } from '../schemas/tournaments'
import { adminError, parseAdminResponse } from './errors'

// People registry for tournaments. The full DNI only comes back from angler_get and
// angler_save; searches return it masked.
function anglerError(error: { code?: string; message?: string }) {
  if (error.code === '23505')
    return new Error(
      'Ya hay una persona registrada con ese DNI. Buscala por DNI.',
    )
  if (error.code === '22023' && error.message?.includes('DNI'))
    return new Error(error.message)
  return adminError(error)
}

export async function searchAnglers(query: string, signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('angler_search', { p_query: query.trim().slice(0, 80) })
    .abortSignal(requestSignal(signal))
  if (error) throw anglerError(error)
  return parseAdminResponse(z.array(anglerSchema).max(20), data)
}

export async function getAngler(id: string, signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('angler_get', { p_id: z.uuid().parse(id) })
    .abortSignal(requestSignal(signal))
  if (error) throw anglerError(error)
  return parseAdminResponse(anglerSchema, data)
}

export async function saveAngler(
  input: AnglerInput,
  current?: Pick<Angler, 'id' | 'updated_at'>,
) {
  const parsed = anglerInputSchema.parse(input)
  const { data, error } = await getAdminSupabase().rpc('angler_save', {
    p_data: parsed,
    p_id: current?.id ?? null,
    p_version: current?.updated_at ?? null,
  })
  if (error) throw anglerError(error)
  return parseAdminResponse(anglerSchema, data)
}
