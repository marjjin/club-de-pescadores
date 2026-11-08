import { z } from '@/shared/lib/validation'

export const poolRateRowSchema = z.object({
  id: z.uuid(),
  season: z.string().trim().min(1).max(120),
  period: z.string().trim().min(1).max(120),
  family_price_cents: z.number().int().nonnegative(),
  individual_price_cents: z.number().int().nonnegative(),
  family_description: z.string().trim().min(1).max(300),
  discount_note: z.string().trim().min(1).max(500).nullable(),
})
