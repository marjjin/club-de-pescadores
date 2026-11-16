import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import { facilitiesSchema } from '../schemas/facilities'
import type { FacilitiesInput } from '../schemas/facilities'
import { adminError, parseAdminResponse } from './errors'
import { isVideoFile, uploadClubMedia } from './media'

export async function getAdminFacilities(signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('admin_get_facilities')
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(facilitiesSchema, data)
}

export async function saveFacilities(input: FacilitiesInput, version: string) {
  const { data, error } = await getAdminSupabase().rpc(
    'admin_save_facilities',
    { p_data: input, p_version: version },
  )
  if (error) throw adminError(error)
  return parseAdminResponse(facilitiesSchema, data)
}

/** Optimized to WebP in the browser, like news and pier photos. */
export async function uploadFacilityPhoto(file: File) {
  if (isVideoFile(file) || !file.type.startsWith('image/'))
    throw new Error('Elegí una foto (JPG, PNG o WebP).')
  const { media } = await uploadClubMedia(file)
  return media.path
}
