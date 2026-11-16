import {
  DEFAULT_IMAGES,
  MAX_FACILITIES,
  facilityImagePath,
} from '@/features/facilities'
import { z } from '@/shared/lib/validation'

export const facilityCardSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  image_path: z.string().nullable(),
  default_image: z.enum(DEFAULT_IMAGES).nullable(),
  image_alt: z.string(),
})
export const facilitiesSchema = z.object({
  title: z.string(),
  description: z.string(),
  updated_at: z.string(),
  cards: z.array(facilityCardSchema).max(MAX_FACILITIES),
})
export type AdminFacilities = z.infer<typeof facilitiesSchema>

/** A card while editing: new cards have a local key and no database id yet. */
export type FacilityDraft = {
  key: string
  id: string | null
  name: string
  description: string
  image_path: string | null
  default_image: AdminFacilities['cards'][number]['default_image']
  image_alt: string
}
export type FacilitiesDraft = {
  title: string
  description: string
  cards: FacilityDraft[]
}

// Same limits as the database checks, with messages for each field.
const text = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Completá ${label}.`)
    .max(max, `Usá hasta ${max} caracteres en ${label}.`)
export const facilitiesInputSchema = z.object({
  title: text('el título de la sección', 2, 80),
  description: text('la bajada de la sección', 1, 200),
  cards: z
    .array(
      z
        .object({
          id: z.uuid().nullable(),
          name: text('el título', 1, 40),
          description: text('la descripción', 1, 160),
          image_path: z.string().regex(facilityImagePath).nullable(),
          default_image: z.enum(DEFAULT_IMAGES).nullable(),
          image_alt: text('la descripción de la foto', 1, 200),
        })
        .refine((card) => card.image_path || card.default_image, {
          message: 'Subí una foto.',
          path: ['image_path'],
        }),
    )
    .min(1, 'Dejá al menos una tarjeta.')
    .max(MAX_FACILITIES, `Se admiten hasta ${MAX_FACILITIES} tarjetas.`),
})
export type FacilitiesInput = z.infer<typeof facilitiesInputSchema>
