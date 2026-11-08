import { z } from '@/shared/lib/validation'
import { getSupabase } from '@/lib/supabase/connection'
import { requestSignal } from '@/lib/supabase/request'
import { getClubToday } from '@/shared/lib/dates'
import { getPageSize } from '@/shared/lib/pagination'
import type { ListPage } from '@/shared/lib/pagination'
import { eventCursorSchema, eventRowSchema } from '../schemas/event'
import type { EventCursor } from '../schemas/event'
import type { UpcomingEventsRequest, ClubEvent } from '../types'

type Request = UpcomingEventsRequest & { cursor?: EventCursor | undefined }
const time = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export async function getEventsPage({
  from,
  limit,
  signal,
  cursor,
}: Request): Promise<ListPage<ClubEvent, EventCursor>> {
  signal?.throwIfAborted()
  const pageSize = getPageSize(limit)
  z.iso.date().parse(from)
  let query = getSupabase()
    .from('events')
    .select('id,title,starts_at,place')
    .eq('is_published', true)
    .is('deleted_at', null)
    .gte('starts_at', `${from}T00:00:00-03:00`)
    .order('starts_at')
    .order('id')
    .limit(pageSize)
  if (cursor) {
    const { startsAt, id } = eventCursorSchema.parse(cursor)
    query = query.or(
      `starts_at.gt.${startsAt},and(starts_at.eq.${startsAt},id.gt.${id})`,
    )
  }
  const { data } = await query.abortSignal(requestSignal(signal)).throwOnError()
  const rows = z.array(eventRowSchema).max(pageSize).parse(data)
  const last = rows.at(-1)
  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      place: row.place,
      startsOn: getClubToday(new Date(row.starts_at)),
      startsAt: time.format(new Date(row.starts_at)),
    })),
    nextCursor:
      rows.length === pageSize && last
        ? { startsAt: last.starts_at, id: last.id }
        : null,
  }
}

export async function getUpcomingEvents(
  request: UpcomingEventsRequest,
): Promise<ClubEvent[]> {
  return (await getEventsPage(request)).items
}
