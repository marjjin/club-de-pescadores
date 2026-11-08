import { z } from '@/shared/lib/validation'

export const eventRowSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(180),
  starts_at: z.iso.datetime({ offset: true }),
  place: z.string().trim().min(1).max(200),
  description: z.string().max(600).nullable(),
})

export const eventCursorSchema = z.object({
  startsAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
})
export type EventCursor = z.infer<typeof eventCursorSchema>
