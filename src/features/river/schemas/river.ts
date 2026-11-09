import { z } from '@/shared/lib/validation'

export const riverReadingSchema = z.object({
  id: z.literal(1),
  height_cm: z.number().int().min(-10000).max(10000),
  measured_at: z.iso.datetime({ offset: true }),
  station: z.string().trim().min(1).max(120),
  source: z.string().trim().min(1).max(160),
})
export type RiverReading = z.infer<typeof riverReadingSchema>
