import { z } from '@/shared/lib/validation'

export const tournamentStatuses = [
  'draft',
  'published',
  'finished',
  'archived',
] as const
export type TournamentStatus = (typeof tournamentStatuses)[number]

export const tournamentCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  participants: z.number().int(),
})
export type TournamentCategory = z.infer<typeof tournamentCategorySchema>

export const adminTournamentSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  place: z.string().nullable(),
  starts_on: z.iso.date(),
  ends_on: z.iso.date().nullable(),
  // Tournaments created before the agenda link have no start time yet.
  start_time: z.string().nullable(),
  // Only the detail returns it; listings leave it out.
  description: z.string().nullable().default(null),
  status: z.enum(tournamentStatuses),
  participants: z.number().int(),
  categories: z.array(tournamentCategorySchema).default([]),
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
  category_id: z.uuid(),
  // Null for entries loaded before the people registry existed.
  angler_id: z.uuid().nullable(),
  dni_masked: z.string().nullable(),
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
    start_time: z
      .string()
      .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Elegí la hora de inicio.'),
    description: z.string().trim().max(2000, 'Usá hasta 2000 caracteres.'),
    categories: z
      .array(z.uuid())
      .min(1, 'Elegí al menos una categoría.')
      .max(10, 'Elegí hasta 10 categorías.'),
  })
  .refine((value) => !value.ends_on || value.ends_on >= value.starts_on, {
    path: ['ends_on'],
    message: 'La fecha de cierre no puede ser anterior al inicio.',
  })
export type TournamentInput = z.input<typeof tournamentInputSchema>

/** Free-text name, only for entries loaded before the people registry. */
export const legacyNameSchema = z
  .string()
  .trim()
  .min(2, 'Usá al menos 2 caracteres.')
  .max(80, 'Usá hasta 80 caracteres.')
export const participantInputSchema = z.object({
  category: z.uuid('Elegí la categoría.'),
  angler: z.uuid('Elegí o registrá a la persona.'),
})
export const changePersonSchema = z.object({
  angler: z.uuid('Elegí a la persona correcta.'),
})

export const categoryListSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  archived_at: z.string().nullable(),
  updated_at: z.string(),
  tournaments: z.number().int(),
})
export type CategoryListItem = z.infer<typeof categoryListSchema>
export const categoryNameSchema = z
  .string()
  .trim()
  .min(2, 'Usá al menos 2 caracteres.')
  .max(60, 'Usá hasta 60 caracteres.')

export const anglerSchema = z.object({
  id: z.uuid(),
  first_name: z.string(),
  last_name: z.string(),
  updated_at: z.string(),
  // Only angler_get returns the full DNI; listings carry the masked one.
  dni: z.string().nullable(),
  dni_masked: z.string(),
})
export type Angler = z.infer<typeof anglerSchema>
const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Completá ${label}.`)
    .max(60, 'Usá hasta 60 caracteres.')
export const anglerInputSchema = z.object({
  first_name: personName('el nombre'),
  last_name: personName('el apellido'),
  // Accepts "30.123.456" as typed; the database stores digits only.
  dni: z
    .string()
    .transform((value) => value.replace(/[.\s-]/g, ''))
    .pipe(z.string().regex(/^[0-9]{7,8}$/, 'El DNI debe tener 7 u 8 números.')),
})
export type AnglerInput = z.input<typeof anglerInputSchema>

export const pointsInputSchema = z.object({
  points: z
    .number({ error: 'Ingresá un número entero.' })
    .int('Ingresá un número entero.')
    .min(-1000, 'El mínimo es -1000.')
    .max(1000, 'El máximo es 1000.')
    .refine((value) => value !== 0, 'Ingresá un valor distinto de cero.'),
  reason: z.string().trim().max(200, 'Usá hasta 200 caracteres.'),
})
