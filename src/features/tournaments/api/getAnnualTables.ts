import { z } from '@/shared/lib/validation'
import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import {
  annualStandingSchema,
  annualTableDetailSchema,
  annualTableSummarySchema,
} from '../schemas/tournament'
import type { AnnualStanding, AnnualTable, AnnualTableSummary } from '../types'

/** Visible annual tables, newest season first. */
export async function getAnnualTables(
  signal?: AbortSignal,
): Promise<AnnualTableSummary[]> {
  signal?.throwIfAborted()
  const { data } = await getSupabase()
    .rpc('annual_tables_public')
    .abortSignal(requestSignal(signal))
    .throwOnError()
  return z.array(annualTableSummarySchema).max(50).parse(data)
}

export async function getAnnualTable(
  id: string,
  signal?: AbortSignal,
): Promise<AnnualTable | null> {
  signal?.throwIfAborted()
  const parsedId = z.uuid().safeParse(id)
  if (!parsedId.success) return null
  const { data } = await getSupabase()
    .rpc('annual_table_get', { p_id: parsedId.data })
    .abortSignal(requestSignal(signal))
    .throwOnError()
  const table = annualTableDetailSchema.nullable().parse(data)
  return (
    table && {
      id: table.id,
      name: table.name,
      year: table.year,
      categories: table.categories,
      tournaments: table.tournaments.map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        startsOn: tournament.starts_on,
        finished: tournament.finished,
      })),
    }
  )
}

/** Everyone's points over the finished tournaments of the season, in one category. */
export async function getAnnualStandings(
  table: string,
  category: string,
  signal?: AbortSignal,
): Promise<AnnualStanding[]> {
  signal?.throwIfAborted()
  const { data } = await getSupabase()
    .rpc('annual_standings', {
      p_table: z.uuid().parse(table),
      p_category: z.uuid().parse(category),
    })
    .abortSignal(requestSignal(signal))
    .throwOnError()
  return z
    .array(annualStandingSchema)
    .max(500)
    .parse(data)
    .map((row) => ({
      name: row.display_name,
      points: row.points,
      tournaments: row.tournaments,
      ranking: row.ranking,
    }))
}
