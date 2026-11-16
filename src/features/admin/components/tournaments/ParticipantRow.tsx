import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeftRight,
  IdCard,
  Pencil,
  Plus,
  Tags,
  Trash2,
  UserRoundSearch,
} from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import type { useParticipantActions } from '../../hooks/useAdminTournaments'
import type {
  AdminParticipant,
  TournamentCategory,
} from '../../schemas/tournaments'
import { Feedback } from '../ui'
import { ParticipantTools } from './ParticipantTools'
import { RankBadge } from './RankBadge'
import type { ParticipantMode } from './ParticipantTools'

type Actions = ReturnType<typeof useParticipantActions>
const tool =
  'inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-ink-600 hover:bg-mist-50 hover:text-navy-900'

export function ParticipantRow({
  userId,
  participant,
  categories,
  actions,
  canEdit,
  canScore,
}: {
  userId: string
  participant: AdminParticipant
  categories: TournamentCategory[]
  actions: Actions
  canEdit: boolean
  canScore: boolean
}) {
  const confirm = useConfirm()
  const [mode, setMode] = useState<ParticipantMode | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const name = participant.display_name
  const linked = Boolean(participant.angler_id)
  const open = (next: ParticipantMode) => {
    setMode(next)
    setDone(null)
  }
  const button = (
    next: ParticipantMode,
    label: string,
    icon: ReactNode,
    aria: string,
  ) => (
    <button
      type="button"
      className={tool}
      aria-label={aria}
      onClick={() => open(next)}
    >
      {icon}
      {label}
    </button>
  )
  const removing =
    actions.remove.isPending && actions.remove.variables === participant.id
  const removeError =
    actions.remove.isError && actions.remove.variables === participant.id
      ? actions.remove.error
      : null
  return (
    <li className="grid min-w-0 gap-3 px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <RankBadge ranking={participant.ranking} />
        <div className="min-w-0 flex-1">
          <p className="font-bold wrap-anywhere">{name}</p>
          <p className="text-xs text-ink-600 tabular-nums">
            {linked ? (
              `DNI ${participant.dni_masked ?? ''}`
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-900">
                Sin ficha
              </span>
            )}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-xl leading-none font-extrabold tabular-nums">
            {participant.points}
          </span>
          <span className="text-[11px] text-ink-600">
            {participant.points === 1 ? 'punto' : 'puntos'}
          </span>
        </p>
      </div>
      {!mode && (canScore || canEdit) && (
        <div className="flex flex-wrap items-center gap-1 sm:pl-12">
          {canScore && (
            <button
              type="button"
              aria-label={`Sumar puntos a ${name}`}
              onClick={() => open('points')}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-river-600/30 bg-river-600/5 px-3 text-sm font-bold text-river-600 hover:bg-river-600/10"
            >
              <Plus size={16} aria-hidden="true" />
              Sumar puntos
            </button>
          )}
          {done && (
            <span
              role="status"
              className="px-2 text-sm font-semibold text-emerald-800"
            >
              {done}
            </span>
          )}
          {canEdit && (
            <span className="flex flex-wrap sm:ml-auto">
              {linked
                ? button(
                    'person',
                    'Cambiar persona',
                    <ArrowLeftRight size={15} aria-hidden="true" />,
                    `Cambiar la persona de ${name}`,
                  )
                : button(
                    'person',
                    'Vincular persona',
                    <UserRoundSearch size={15} aria-hidden="true" />,
                    `Vincular ${name} a una persona registrada`,
                  )}
              {categories.length > 1 &&
                button(
                  'category',
                  'Categoría',
                  <Tags size={15} aria-hidden="true" />,
                  `Cambiar la categoría de ${name}`,
                )}
              {linked
                ? button(
                    'data',
                    'Datos',
                    <IdCard size={15} aria-hidden="true" />,
                    `Corregir los datos de ${name}`,
                  )
                : button(
                    'rename',
                    'Nombre',
                    <Pencil size={15} aria-hidden="true" />,
                    `Editar nombre de ${name}`,
                  )}
              <button
                type="button"
                aria-label={`Quitar a ${name}`}
                className={`${tool} hover:text-red-700`}
                disabled={removing}
                onClick={() => {
                  void confirm({
                    title: `¿Quitar a ${name}?`,
                    message:
                      'Deja de aparecer en la tabla. Sus puntos quedan registrados en el historial.',
                    confirmLabel: 'Quitar',
                    tone: 'danger',
                  }).then((ok) => ok && actions.remove.mutate(participant.id))
                }}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
      )}
      {mode && (
        <div className="sm:pl-12">
          <ParticipantTools
            mode={mode}
            userId={userId}
            participant={participant}
            categories={categories}
            actions={actions}
            onDone={(message) => {
              setMode(null)
              setDone(message ?? null)
            }}
          />
        </div>
      )}
      <Feedback error={removeError} />
    </li>
  )
}
