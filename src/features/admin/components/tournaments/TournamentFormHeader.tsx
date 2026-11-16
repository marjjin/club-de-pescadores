import { Trophy } from 'lucide-react'

export function TournamentFormHeader({ editing }: { editing: boolean }) {
  return (
    <div className="flex items-start gap-3 border-b border-navy-900/10 bg-mist-50/60 px-5 py-4 sm:px-6">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-sun-400/20 text-navy-900"
      >
        <Trophy size={19} />
      </span>
      <div className="min-w-0">
        <h2 id="tournament-form-title" className="text-base font-extrabold">
          {editing ? 'Datos del torneo' : 'Nuevo torneo'}
        </h2>
        <p className="mt-0.5 text-sm leading-5 text-ink-600">
          {editing
            ? 'Los cambios se ven en el sitio si el torneo está publicado.'
            : 'Se crea como borrador y también aparece en Eventos cuando lo publiques. Después registrás participantes.'}
        </p>
      </div>
    </div>
  )
}
