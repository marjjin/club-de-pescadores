import { formatLongDate } from '@/shared/lib/dates'
import type { Tournament } from '../types'

export function TournamentDates({
  tournament,
}: {
  tournament: Pick<Tournament, 'startsOn' | 'endsOn'>
}) {
  const { startsOn, endsOn } = tournament
  return (
    <>
      <time dateTime={startsOn}>{formatLongDate(startsOn)}</time>
      {endsOn && endsOn !== startsOn && (
        <>
          {' al '}
          <time dateTime={endsOn}>{formatLongDate(endsOn)}</time>
        </>
      )}
    </>
  )
}

export function TournamentStatus({ finished }: { finished: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${
        finished ? 'bg-mist-100 text-navy-900' : 'bg-sun-400 text-navy-950'
      }`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {finished ? 'Finalizado' : 'En curso'}
    </span>
  )
}
