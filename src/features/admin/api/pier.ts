import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import { z } from '@/shared/lib/validation'
import { pierInputSchema, pierReportSchema } from '../schemas/pier'
import type { PierInput, PierReport } from '../schemas/pier'
import { adminError, parseAdminResponse } from './errors'
import { removeClubMedia } from './media'

export async function publishPierReport(input: PierInput) {
  const { data, error } = await getAdminSupabase().rpc('pier_publish_report', {
    p_data: pierInputSchema.parse(input),
  })
  if (error) {
    // The only missing record here is the river station, set once by the club.
    if (error.code === 'P0002')
      throw new Error(
        'Falta configurar el punto de medición del río. Avisale a un administrador general.',
      )
    throw adminError(error)
  }
  return data
}

export async function listPierReports(
  cursor: Pick<PierReport, 'created_at' | 'id'> | null,
  signal: AbortSignal,
) {
  const { data, error } = await getAdminSupabase()
    .rpc('pier_recent_reports', {
      p_before: cursor?.created_at ?? null,
      p_id: cursor?.id ?? null,
    })
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(z.array(pierReportSchema), data)
}

export async function setPierReportPublished(id: string, published: boolean) {
  const { error } = await getAdminSupabase().rpc('pier_set_report_published', {
    p_id: id,
    p_published: published,
  })
  if (error) throw adminError(error)
}

/** Permanent. The river bar falls back to the previous report if this was the current height. */
export async function deletePierReport(id: string) {
  const { data, error } = await getAdminSupabase().rpc('pier_delete_report', {
    p_id: z.uuid().parse(id),
  })
  if (error) throw adminError(error)
  // Best effort, like the other uploads: anything left is cleaned up later.
  await removeClubMedia(z.array(z.string()).parse(data ?? []))
}
