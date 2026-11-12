import { z } from '@/shared/lib/validation'

export const tournamentStatuses = [
  'draft',
  'published',
  'finished',
  'archived',
] as const
export type TournamentStatus = (typeof tournamentStatuses)[number]

export const adminTournamentSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  place: z.string().nullable(),
  starts_on: z.iso.date(),
  ends_on: z.iso.date().nullable(),
  status: z.enum(tournamentStatuses),
  participants: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type AdminTournament = z.infer<typeof adminTournamentSchema>

export const adminParticipantSchema = z.object({
  id: z.uuid(),
  display_name: z.string(),
  points: z.number().int(),
  ranking: z.number().int(),
  updated_at: z.string(),
})
export type AdminParticipant = z.infer<typeof adminParticipantSchema>

// Mirrors the database checks so mistakes are caught before the request.
export const tournamentInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Usá al menos 3 caracteres.')
      .max(120, 'Usá hasta 120 caracteres.'),
    place: z.string().trim().max(200, 'Usá hasta 200 caracteres.'),
    starts_on: z.iso.date('Elegí la fecha de inicio.'),
    ends_on: z.union([z.literal(''), z.iso.date()]),
  })
  .refine((value) => !value.ends_on || value.ends_on >= value.starts_on, {
    path: ['ends_on'],
    message: 'La fecha de cierre no puede ser anterior al inicio.',
  })
export type TournamentInput = z.input<typeof tournamentInputSchema>

export const participantInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Usá al menos 2 caracteres.')
    .max(80, 'Usá hasta 80 caracteres.'),
  consent: z.literal(true, {
    error: 'Confirmá que la persona aceptó aparecer en la tabla pública.',
  }),
})

export const pointsInputSchema = z.object({
  points: z
    .number({ error: 'Ingresá un número entero.' })
    .int('Ingresá un número entero.')
    .min(-1000, 'El mínimo es -1000.')
    .max(1000, 'El máximo es 1000.')
    .refine((value) => value !== 0, 'Ingresá un valor distinto de cero.'),
  reason: z.string().trim().max(200, 'Usá hasta 200 caracteres.'),
})
