import { z } from '@/shared/lib/validation'
import { FEE_ICONS, FEE_KINDS } from '../types'

// Mirrors the database checks; the public site never renders a row it cannot trust.
export const MAX_FEES = 40
export const MAX_FEES_PER_KIND = 20

export const feeScheduleRowSchema = z.object({
  valid_from: z.iso.date(),
  note: z.string().trim().min(1).max(300).nullable(),
})
export const feeRowSchema = z.object({
  id: z.uuid(),
  kind: z.enum(FEE_KINDS),
  name: z.string().trim().min(1).max(60),
  detail: z.string().trim().min(1).max(120).nullable(),
  icon: z.enum(FEE_ICONS),
  price_cents: z.number().int().nonnegative(),
})
