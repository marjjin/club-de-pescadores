import { z } from '@/shared/lib/validation'
import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import { getPageSize } from '@/shared/lib/pagination'
import type { ListPage } from '@/shared/lib/pagination'
import {
  tournamentCursorSchema,
  tournamentRowSchema,
} from '../schemas/tournament'
import type { TournamentCursor } from '../schemas/tournament'
import type { Tournament } from '../types'

const columns = 'id,name,place,starts_on,ends_on,status'

const toTournament = (
  row: z.infer<typeof tournamentRowSchema>,
): Tournament => ({
  id: row.id,
  name: row.name,
  place: row.place,
  startsOn: row.starts_on,
  endsOn: row.ends_on,
  finished: row.status === 'finished',
})

/** Published and finished tournaments, newest first. RLS hides drafts and archived ones. */
export async function getTournamentsPage({
  cursor,
  limit = 12,
  signal,
}: {
  cursor: TournamentCursor | null
  limit?: number
  signal?: AbortSignal
}): Promise<ListPage<Tournament, TournamentCursor>> {
  signal?.throwIfAborted()
  const pageSize = getPageSize(limit)
  let query = getSupabase()
    .from('tournaments')
    .select(columns)
    .in('status', ['published', 'finished'])
    .order('starts_on', { ascending: false })
    .order('id', { ascending: false })
    .limit(pageSize)
  if (cursor) {
    const { startsOn, id } = tournamentCursorSchema.parse(cursor)
    query = query.or(
      `starts_on.lt.${startsOn},and(starts_on.eq.${startsOn},id.lt.${id})`,
    )
  }
  const { data } = await query.abortSignal(requestSignal(signal)).throwOnError()
  const rows = z.array(tournamentRowSchema).max(pageSize).parse(data)
  const last = rows.at(-1)
  return {
    items: rows.map(toTournament),
    nextCursor:
      rows.length === pageSize && last
        ? { startsOn: last.starts_on, id: last.id }
        : null,
  }
}

export async function getTournament(
  id: string,
  signal?: AbortSignal,
): Promise<Tournament | null> {
  signal?.throwIfAborted()
  const parsedId = tournamentRowSchema.shape.id.safeParse(id)
  if (!parsedId.success) return null
  const { data } = await getSupabase()
    .from('tournaments')
    .select(columns)
    .eq('id', parsedId.data)
    .in('status', ['published', 'finished'])
    .limit(1)
    .abortSignal(requestSignal(signal))
    .throwOnError()
  const rows = z.array(tournamentRowSchema).max(1).parse(data)
  return rows[0] ? toTournament(rows[0]) : null
}
