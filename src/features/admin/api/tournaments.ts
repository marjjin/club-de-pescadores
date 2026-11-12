import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import { z } from '@/shared/lib/validation'
import {
  adminParticipantSchema,
  adminTournamentSchema,
  participantInputSchema,
  pointsInputSchema,
  tournamentInputSchema,
} from '../schemas/tournaments'
import type {
  AdminParticipant,
  AdminTournament,
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
]
function tournamentError(error: { code?: string; message?: string }) {
  if (
    error.code === '22023' &&
    known.some((text) => error.message?.includes(text))
  )
    return new Error(error.message)
  if (error.code === '23505')
    return new Error('Ya hay un participante con ese nombre en este torneo.')
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
  const parsed = tournamentInputSchema.parse(input)
  const { data, error } = await getAdminSupabase().rpc('tournament_save', {
    p_data: parsed,
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

export type ParticipantCursor = Pick<
  AdminParticipant,
  'points' | 'display_name' | 'id'
>
export async function listParticipants(
  tournamentId: string,
  search: string,
  cursor: ParticipantCursor | null,
  signal: AbortSignal,
) {
  const { data, error } = await getAdminSupabase()
    .rpc('tournament_admin_participants', {
      p_tournament: tournamentId,
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
  input: { name: string; consent: boolean },
) {
  const parsed = participantInputSchema.parse(input)
  const { error } = await getAdminSupabase().rpc('tournament_add_participant', {
    p_tournament: tournamentId,
    p_name: parsed.name,
    p_consent: parsed.consent,
  })
  if (error) throw tournamentError(error)
}

export async function renameParticipant(id: string, name: string) {
  const parsed = participantInputSchema.shape.name.parse(name)
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
