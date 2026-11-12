import type { TournamentStatus } from '../../schemas/tournaments'

const styles: Record<TournamentStatus, [string, string]> = {
  draft: ['Borrador', 'bg-amber-50 text-amber-900 border-amber-200'],
  published: [
    'Publicado · en curso',
    'bg-emerald-50 text-emerald-800 border-emerald-200',
  ],
  finished: ['Finalizado', 'bg-mist-50 text-navy-900 border-navy-900/10'],
  archived: ['Archivado', 'bg-mist-50 text-ink-600 border-navy-900/10'],
}

export function TournamentBadge({ status }: { status: TournamentStatus }) {
  const [label, style] = styles[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${style}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
