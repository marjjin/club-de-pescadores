import { z } from '@/shared/lib/validation'
import { DEFAULT_IMAGES } from '../types'

// Mirrors the database checks; the public site never trusts a row it cannot render.
export const MAX_FACILITIES = 8
export const facilityImagePath = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/

export const facilitySectionSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(1).max(200),
})
export const facilityRowSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(1).max(40),
    description: z.string().trim().min(1).max(160),
    image_path: z.string().regex(facilityImagePath).nullable(),
    default_image: z.enum(DEFAULT_IMAGES).nullable(),
    image_alt: z.string().trim().min(1).max(200),
  })
  .refine((row) => (row.image_path === null) !== (row.default_image === null))
