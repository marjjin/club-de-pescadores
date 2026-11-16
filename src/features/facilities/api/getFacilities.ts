import { getSupabase } from '@/lib/supabase/connection'
import { publicStorageUrl } from '@/lib/supabase/client'
import { requestSignal } from '@/lib/supabase/request'
import { z } from '@/shared/lib/validation'
import { defaultImages } from '../content'
import {
  facilityRowSchema,
  facilitySectionSchema,
  MAX_FACILITIES,
} from '../schemas/facilities'
import type { FacilitiesContent } from '../types'

export async function getFacilities(
  signal?: AbortSignal,
): Promise<FacilitiesContent | null> {
  signal?.throwIfAborted()
  const client = getSupabase()
  const [section, cards] = await Promise.all([
    client
      .from('facility_sections')
      .select('title,description')
      .eq('id', 1)
      .limit(1)
      .abortSignal(requestSignal(signal))
      .throwOnError(),
    client
      .from('facilities')
      .select('id,name,description,image_path,default_image,image_alt')
      .order('position')
      .limit(MAX_FACILITIES)
      .abortSignal(requestSignal(signal))
      .throwOnError(),
  ])
  const heading = z.array(facilitySectionSchema).max(1).parse(section.data)[0]
  const rows = z.array(facilityRowSchema).max(MAX_FACILITIES).parse(cards.data)
  if (!heading || !rows.length) return null
  return {
    title: heading.title,
    description: heading.description,
    cards: rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_path
        ? publicStorageUrl('club-media', row.image_path)
        : defaultImages[row.default_image ?? 'pier'],
      imageAlt: row.image_alt,
    })),
  }
}
