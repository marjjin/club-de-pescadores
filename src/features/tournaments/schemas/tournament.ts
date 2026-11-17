import { z } from '@/shared/lib/validation'

export const tournamentRowSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
  place: z.string().max(200).nullable(),
  starts_on: z.iso.date(),
  ends_on: z.iso.date().nullable(),
  status: z.enum(['published', 'finished']),
  description: z.string().max(2000).nullable().default(null),
})

export const standingSchema = z.object({
  id: z.uuid(),
  display_name: z.string().trim().min(1).max(80),
  points: z.number().int(),
  ranking: z.number().int().min(1),
})

export const boardCategorySchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(60),
  participants: z.number().int().min(0),
})
export type BoardCategory = z.infer<typeof boardCategorySchema>

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

export const annualTableSummarySchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
  year: z.number().int(),
  finished: z.number().int().min(0),
})
export const annualTableDetailSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
  year: z.number().int(),
  categories: z
    .array(z.object({ id: z.uuid(), name: z.string().trim().min(1).max(60) }))
    .max(100),
  tournaments: z
    .array(
      z.object({
        id: z.uuid(),
        name: z.string().trim().min(1).max(120),
        starts_on: z.iso.date(),
        finished: z.boolean(),
      }),
    )
    .max(500),
})
export const annualStandingSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  points: z.number().int(),
  tournaments: z.number().int().min(1),
  ranking: z.number().int().min(1),
})
