import { z } from '@/shared/lib/validation'
import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import type { ListPage } from '@/shared/lib/pagination'
import { standingCursorSchema, standingSchema } from '../schemas/tournament'
import type { StandingCursor } from '../schemas/tournament'
import type { Standing } from '../types'

// Fixed by the database function; it never returns more rows per page.
export const LEADERBOARD_PAGE = 50

/** One page of the ranking. Positions are global, so ties share a place across pages. */
export async function getLeaderboard(
  tournamentId: string,
  cursor: StandingCursor | null,
  signal?: AbortSignal,
): Promise<ListPage<Standing, StandingCursor>> {
  signal?.throwIfAborted()
  const after = cursor ? standingCursorSchema.parse(cursor) : null
  const { data } = await getSupabase()
    .rpc('tournament_leaderboard', {
      p_tournament: z.uuid().parse(tournamentId),
      p_points: after?.points ?? null,
      p_name: after?.name ?? null,
      p_id: after?.id ?? null,
    })
    .abortSignal(requestSignal(signal))
    .throwOnError()
  const rows = z.array(standingSchema).max(LEADERBOARD_PAGE).parse(data)
  const last = rows.at(-1)
  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.display_name,
      points: row.points,
      ranking: row.ranking,
    })),
    nextCursor:
      rows.length === LEADERBOARD_PAGE && last
        ? { points: last.points, name: last.display_name, id: last.id }
        : null,
  }
}
