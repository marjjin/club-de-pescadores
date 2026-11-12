import { z } from '@/shared/lib/validation'

export const tournamentRowSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
  place: z.string().max(200).nullable(),
  starts_on: z.iso.date(),
  ends_on: z.iso.date().nullable(),
  status: z.enum(['published', 'finished']),
})

export const standingSchema = z.object({
  id: z.uuid(),
  display_name: z.string().trim().min(1).max(80),
  points: z.number().int(),
  ranking: z.number().int().min(1),
})

export const tournamentCursorSchema = z.object({
  startsOn: z.iso.date(),
  id: z.uuid(),
})
export type TournamentCursor = z.infer<typeof tournamentCursorSchema>

export const standingCursorSchema = z.object({
  points: z.number().int(),
  name: z.string(),
  id: z.uuid(),
})
export type StandingCursor = z.infer<typeof standingCursorSchema>
