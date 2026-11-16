import { Check } from 'lucide-react'
import type { TournamentStatus } from '../../schemas/tournaments'

const steps = [
  { status: 'draft', label: 'Borrador' },
  { status: 'published', label: 'Publicado' },
  { status: 'finished', label: 'Finalizado' },
] as const

// What the current state means and what usually comes next.
const guidance: Record<TournamentStatus, string> = {
  draft:
    'Todavía no se ve en el sitio. Registrá a los participantes y publicalo cuando esté listo.',
  published:
    'La tabla se ve en el sitio y se actualiza con cada puntaje. Finalizalo cuando termine la competencia.',
  finished:
    'La tabla quedó fija y sigue publicada. Reabrilo solo si tenés que corregir algo.',
  archived:
    'Está oculto del sitio. Los participantes y los puntos se conservan; podés restaurarlo como borrador.',
}

export function TournamentProgress({ status }: { status: TournamentStatus }) {
  const current = steps.findIndex((step) => step.status === status)
  return (
    <div className="grid gap-3">
      {status !== 'archived' && (
        <ol
          aria-label="Etapas del torneo"
          className="grid grid-cols-3 gap-2 text-xs font-bold"
        >
          {steps.map((step, index) => {
            const done = index < current
            const active = index === current
            return (
              <li
                key={step.status}
                aria-current={active ? 'step' : undefined}
                className="grid gap-2"
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 rounded-full ${done || active ? 'bg-river-600' : 'bg-navy-900/10'}`}
                />
                <span
                  className={`inline-flex items-center gap-1 ${active ? 'text-navy-900' : done ? 'text-river-600' : 'text-ink-600'}`}
                >
                  {done && <Check size={13} aria-hidden="true" />}
                  {step.label}
                  {done && <span className="sr-only">(completado)</span>}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <p className="text-sm leading-6 text-ink-600">{guidance[status]}</p>
    </div>
  )
}
