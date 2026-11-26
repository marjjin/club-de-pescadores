import { FEE_ICONS, FEE_KINDS, MAX_FEES } from '@/features/fees'
import type { FeeIcon, FeeKind } from '@/features/fees'
import { z } from '@/shared/lib/validation'

export const adminFeeSchema = z.object({
  id: z.uuid(),
  kind: z.enum(FEE_KINDS),
  name: z.string(),
  detail: z.string().nullable(),
  icon: z.enum(FEE_ICONS),
  price_cents: z.number().int().nonnegative(),
})
export const adminFeesSchema = z.object({
  valid_from: z.iso.date(),
  note: z.string().nullable(),
  updated_at: z.string(),
  fees: z.array(adminFeeSchema).max(MAX_FEES),
})
export type AdminFees = z.infer<typeof adminFeesSchema>

/** A row while editing: new rows have a local key and no database id yet. */
export type FeeDraft = {
  key: string
  id: string | null
  kind: FeeKind
  name: string
  detail: string
  icon: FeeIcon
  /** As typed, e.g. "176.000" or "176000". */
  price: string
}
export type FeesDraft = {
  /** YYYY-MM, the value of the month input. */
  month: string
  note: string
  fees: FeeDraft[]
}

// Same limits as the database checks; what the save RPC receives.
export const feesInputSchema = z.object({
  valid_from: z.iso.date(),
  note: z.string().max(300).nullable(),
  fees: z
    .array(
      z.object({
        id: z.uuid().nullable(),
        kind: z.enum(FEE_KINDS),
        name: z.string().trim().min(1).max(60),
        detail: z.string().trim().min(1).max(120).nullable(),
        icon: z.enum(FEE_ICONS),
        price_cents: z.number().int().min(0).max(2147483647),
      }),
    )
    .min(1)
    .max(MAX_FEES),
})
export type FeesInput = z.infer<typeof feesInputSchema>
