import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import { z } from '@/shared/lib/validation'
import {
  adminParticipantSchema,
  annualTableInputSchema,
  annualTableSchema,
  adminTournamentSchema,
  categoryListSchema,
  categoryNameSchema,
  changePersonSchema,
  legacyNameSchema,
  participantInputSchema,
  pointsInputSchema,
  tournamentInputSchema,
} from '../schemas/tournaments'
import type {
  AdminParticipant,
  AnnualTable,
  AnnualTableInput,
  AdminTournament,
  CategoryListItem,
  TournamentInput,
  TournamentStatus,
} from '../schemas/tournaments'
import { adminError, parseAdminResponse } from './errors'

// Messages raised on purpose by the tournament functions are already in Spanish and safe.
const known = [
  'aceptar aparecer',
  'finalizado',
  'máximo de 500',
  'distinto de cero',
  'categoría',
  'categorías',
  'datos de la persona',
  'Archivá el torneo',
  'tabla anual',
]
function tournamentError(error: { code?: string; message?: string }) {
  if (
    error.code === '22023' &&
    known.some((text) => error.message?.includes(text))
  )
    return new Error(error.message)
  if (error.code === '23505')
    return new Error(
      error.message?.includes('anotad')
        ? 'La persona ya está anotada en esa categoría.'
        : error.message?.includes('annual_tables')
          ? 'Ya existe una tabla anual con ese nombre para ese año.'
          : 'Ya existe una categoría o un participante con ese nombre.',
    )
  if (error.code === '23503' && error.message?.includes('participantes'))
    return new Error(
      'No podés quitar una categoría que ya tiene participantes. Movelos de categoría antes.',
    )
  return adminError(error)
}

export async function listTournaments(
  cursor: Pick<AdminTournament, 'created_at' | 'id'> | null,
  signal: AbortSignal,
) {
  const { data, error } = await getAdminSupabase()
    .rpc('tournament_admin_list', {
      p_before: cursor?.created_at ?? null,
      p_id: cursor?.id ?? null,
    })
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(z.array(adminTournamentSchema), data)
}

export async function getAdminTournament(id: string, signal: AbortSignal) {
  const parsedId = z.uuid().safeParse(id)
  if (!parsedId.success) return null
  const { data, error } = await getAdminSupabase()
    .rpc('tournament_admin_get', { p_id: parsedId.data })
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(adminTournamentSchema.nullable(), data)
}

export async function saveTournament(
  input: TournamentInput,
  current?: Pick<AdminTournament, 'id' | 'updated_at'>,
) {
  const { annual_tables, ...parsed } = tournamentInputSchema.parse(input)
  const { data, error } = await getAdminSupabase().rpc('tournament_save', {
    p_data: {
      ...parsed,
      // Every chosen category is sent, so clearing one takes it out of its table.
      annual_tables: Object.fromEntries(
        parsed.categories.map((id) => [id, annual_tables[id] || null]),
      ),
    },
    p_id: current?.id ?? null,
    p_version: current?.updated_at ?? null,
  })
  if (error) throw tournamentError(error)
  return z.uuid().parse(data)
}

export async function setTournamentStatus(
  id: string,
  status: TournamentStatus,
) {
  const { error } = await getAdminSupabase().rpc('tournament_set_status', {
    p_id: id,
    p_status: status,
  })
  if (error) throw tournamentError(error)
}

export async function listCategories(signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('tournament_category_list')
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(z.array(categoryListSchema), data)
}

export async function saveCategory(
  name: string,
  current?: Pick<CategoryListItem, 'id' | 'updated_at'>,
) {
  const parsed = categoryNameSchema.parse(name)
  const { data, error } = await getAdminSupabase().rpc(
    'tournament_category_save',
    {
      p_name: parsed,
      p_id: current?.id ?? null,
      p_version: current?.updated_at ?? null,
    },
  )
  if (error) throw tournamentError(error)
  return z.uuid().parse(data)
}

export async function archiveCategory(id: string, archived: boolean) {
  const { error } = await getAdminSupabase().rpc(
    'tournament_category_archive',
    { p_id: id, p_archived: archived },
  )
  if (error) throw tournamentError(error)
}

export type ParticipantCursor = Pick<
  AdminParticipant,
  'points' | 'display_name' | 'id'
>
export async function listParticipants(
  tournamentId: string,
  category: string | null,
  search: string,
  cursor: ParticipantCursor | null,
  signal: AbortSignal,
) {
  const { data, error } = await getAdminSupabase()
    .rpc('tournament_admin_participants', {
      p_tournament: tournamentId,
      p_category: category,
      p_search: search.trim().slice(0, 80),
      p_points: cursor?.points ?? null,
      p_name: cursor?.display_name ?? null,
      p_id: cursor?.id ?? null,
    })
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(z.array(adminParticipantSchema), data)
}

export async function addParticipant(
  tournamentId: string,
  input: { category: string; angler: string },
) {
  const parsed = participantInputSchema.parse(input)
  const { error } = await getAdminSupabase().rpc('tournament_add_participant', {
    p_tournament: tournamentId,
    p_category: parsed.category,
    p_angler: parsed.angler,
    // Signing up for the tournament includes appearing in its public table, so the
    // panel no longer asks; the database still records when it was accepted.
    p_consent: true,
  })
  if (error) throw tournamentError(error)
}

/** Fixes an entry loaded with the wrong person; its points stay. */
export async function changeParticipant(id: string, input: { angler: string }) {
  const parsed = changePersonSchema.parse(input)
  const { error } = await getAdminSupabase().rpc(
    'tournament_change_participant',
    { p_id: id, p_angler: parsed.angler, p_consent: true },
  )
  if (error) throw tournamentError(error)
}

export async function moveParticipant(id: string, category: string) {
  const { error } = await getAdminSupabase().rpc(
    'tournament_move_participant',
    { p_id: id, p_category: z.uuid().parse(category) },
  )
  if (error) throw tournamentError(error)
}

export async function renameParticipant(id: string, name: string) {
  const parsed = legacyNameSchema.parse(name)
  const { error } = await getAdminSupabase().rpc(
    'tournament_rename_participant',
    { p_id: id, p_name: parsed },
  )
  if (error) throw tournamentError(error)
}

export async function removeParticipant(id: string) {
  const { error } = await getAdminSupabase().rpc(
    'tournament_remove_participant',
    { p_id: id },
  )
  if (error) throw tournamentError(error)
}

export async function addPoints(
  participantId: string,
  input: { points: number; reason: string },
) {
  const parsed = pointsInputSchema.parse(input)
  const { data, error } = await getAdminSupabase().rpc(
    'tournament_add_points',
    {
      p_participant: participantId,
      p_points: parsed.points,
      p_reason: parsed.reason || null,
    },
  )
  if (error) throw tournamentError(error)
  return z.number().int().parse(data)
}

/** Permanent: only for archived tournaments. People stay in the registry. */
export async function deleteTournament(
  tournament: Pick<AdminTournament, 'id' | 'updated_at'>,
) {
  const { error } = await getAdminSupabase().rpc('tournament_delete', {
    p_id: tournament.id,
    p_version: tournament.updated_at,
  })
  if (error) throw tournamentError(error)
}

export async function listAnnualTables(signal: AbortSignal) {
  const { data, error } = await getAdminSupabase()
    .rpc('annual_table_list')
    .abortSignal(requestSignal(signal))
  if (error) throw adminError(error)
  return parseAdminResponse(z.array(annualTableSchema), data)
}

export async function saveAnnualTable(
  input: AnnualTableInput,
  current?: Pick<AnnualTable, 'id' | 'updated_at'>,
) {
  const parsed = annualTableInputSchema.parse(input)
  const { data, error } = await getAdminSupabase().rpc('annual_table_save', {
    p_name: parsed.name,
    p_year: parsed.year,
    p_id: current?.id ?? null,
    p_version: current?.updated_at ?? null,
  })
  if (error) throw tournamentError(error)
  return z.uuid().parse(data)
}

export async function archiveAnnualTable(id: string, archived: boolean) {
  const { error } = await getAdminSupabase().rpc('annual_table_archive', {
    p_id: id,
    p_archived: archived,
  })
  if (error) throw tournamentError(error)
}
