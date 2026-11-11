import { z } from '@/shared/lib/validation'
import { mediaListSchema } from './media'

export const pierInputSchema = z.object({
  height_cm: z.number().int().min(-10000).max(10000),
  measured_at: z.iso.datetime({ offset: true }),
  conditions: z.string().trim().max(600).nullable(),
  media: mediaListSchema,
})
export type PierInput = z.infer<typeof pierInputSchema>
export const pierReportSchema = z.object({
  id: z.uuid(),
  height_cm: z.number(),
  measured_at: z.string(),
  conditions: z.string().nullable(),
  is_published: z.boolean(),
  created_at: z.string(),
  author_email: z.string().nullable(),
  media_count: z.number(),
})
export type PierReport = z.infer<typeof pierReportSchema>
