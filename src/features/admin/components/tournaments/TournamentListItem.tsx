import { Link } from 'react-router'
import { CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react'
import { formatDayMonth } from '@/shared/lib/dates'
import type { AdminTournament } from '../../schemas/tournaments'
import { TournamentBadge } from './TournamentBadge'
import { tournamentDates } from './tournament-dates'

// One line telling staff what this tournament needs next.
const hints: Record<AdminTournament['status'], string> = {
  draft: 'Todavía no se ve en el sitio',
  published: 'Visible en el sitio · se pueden sumar puntos',
  finished: 'Tabla final publicada',
  archived: 'Oculto del sitio',
}

export function TournamentListItem({
  tournament,
}: {
  tournament: AdminTournament
}) {
  const { day, month } = formatDayMonth(tournament.starts_on)
  return (
    <li>
      <Link
        to={`/admin/torneos/${tournament.id}`}
        aria-label={`Gestionar ${tournament.name}`}
        className={`group flex min-w-0 items-center gap-4 px-4 py-4 hover:bg-mist-50 focus-visible:bg-mist-50 sm:px-5 ${tournament.status === 'archived' ? 'opacity-70' : ''}`}
      >
        <span
          aria-hidden="true"
          className="grid w-14 shrink-0 justify-items-center rounded-xl border border-navy-900/10 bg-mist-50 py-2 leading-none"
        >
          <span className="text-xl font-extrabold tabular-nums">{day}</span>
          <span className="mt-1 text-[11px] font-bold tracking-wider text-ink-600">
            {month}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold wrap-anywhere text-navy-900">
              {tournament.name}
            </span>
            <TournamentBadge status={tournament.status} />
          </span>
          <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={13} aria-hidden="true" />
              {tournamentDates(tournament)}
            </span>
            {tournament.place && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin size={13} aria-hidden="true" className="shrink-0" />
                <span className="wrap-anywhere">{tournament.place}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users size={13} aria-hidden="true" />
              {tournament.participants}{' '}
              {tournament.participants === 1 ? 'participante' : 'participantes'}
            </span>
          </span>
          <span className="mt-1 block text-xs text-ink-600/80">
            {hints[tournament.status]}
          </span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 text-sm font-bold text-river-600 group-hover:underline sm:inline-flex">
          Gestionar
          <ChevronRight size={16} aria-hidden="true" />
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="shrink-0 text-ink-600 sm:hidden"
        />
      </Link>
    </li>
  )
}
