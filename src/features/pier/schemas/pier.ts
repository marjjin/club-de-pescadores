import { z } from '@/shared/lib/validation'

const mediaRowSchema = z.object({
  kind: z.enum(['image', 'video']),
  path: z.string().min(1).max(200),
  poster_path: z.string().min(1).max(200).nullable(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1).max(300),
  position: z.number().int(),
})
export const pierRowSchema = z.object({
  id: z.uuid(),
  height_cm: z.number().int(),
  measured_at: z.iso.datetime({ offset: true }),
  conditions: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  media_items: z.array(mediaRowSchema).max(10),
})
export type PierRow = z.infer<typeof pierRowSchema>
