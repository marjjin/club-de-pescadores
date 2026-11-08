import { useId } from 'react'
import { AlertTriangle, CalendarDays } from 'lucide-react'
import type { EventEditorErrors, EventEditorValues } from '../../event-editor'
import { isPastEvent } from '../../event-editor'
import { inputClass } from '../ui'
import { EventField } from './EventField'

type TextKey = 'title' | 'date' | 'time' | 'place' | 'description'
const describedBy = (id: string, error?: string) =>
  `${id}-help${error ? ` ${id}-error` : ''}`
const control = `${inputClass} aria-invalid:border-red-500`

export function EventFields({
  values,
  errors,
  onChange,
}: {
  values: EventEditorValues
  errors: EventEditorErrors
  onChange: (name: TextKey, value: string) => void
}) {
  const id = useId()
  const field = (name: TextKey) => ({
    id: `${id}-${name}`,
    name,
    value: values[name],
    onChange: (event: { target: { value: string } }) =>
      onChange(name, event.target.value),
    required: true,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': describedBy(`${id}-${name}`, errors[name]),
  })
  return (
    <section
      aria-label="Datos del evento"
      className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-lg bg-mist-50 text-navy-800"
        >
          <CalendarDays size={19} />
        </span>
        <div>
          <h2 className="text-base font-extrabold">Datos del evento</h2>
          <p className="mt-0.5 text-xs text-ink-600">
            Qué, cuándo y dónde: lo que los socios necesitan saber.
          </p>
        </div>
      </div>
      <div className="grid gap-6">
        <EventField
          id={`${id}-title`}
          label="Título"
          error={errors.title}
          help={
            <>
              <span>Por ejemplo: «Concurso de pesca de primavera».</span>
              <span className="shrink-0 tabular-nums">
                {values.title.length}/180
              </span>
            </>
          }
        >
          <input
            {...field('title')}
            maxLength={180}
            placeholder="Nombre del evento"
            className={`${control} py-3 text-base font-semibold placeholder:font-normal`}
          />
        </EventField>
        <div className="grid gap-6 sm:grid-cols-2">
          <EventField
            id={`${id}-date`}
            label="Día"
            error={errors.date}
            help={<span>Calendario de Argentina.</span>}
          >
            <input {...field('date')} type="date" className={control} />
          </EventField>
          <EventField
            id={`${id}-time`}
            label="Hora de inicio"
            error={errors.time}
            help={<span>Hora de Argentina (UTC−3).</span>}
          >
            <input
              {...field('time')}
              type="time"
              step={300}
              className={control}
            />
          </EventField>
        </div>
        {isPastEvent(values) && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"
          >
            <AlertTriangle
              size={15}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            La fecha elegida ya pasó. El evento no aparecerá entre los próximos
            eventos del sitio.
          </p>
        )}
        <EventField
          id={`${id}-place`}
          label="Lugar"
          error={errors.place}
          help={
            <>
              <span>Indicá el sector del club o la dirección.</span>
              <span className="shrink-0 tabular-nums">
                {values.place.length}/200
              </span>
            </>
          }
        >
          <input
            {...field('place')}
            maxLength={200}
            placeholder="Por ejemplo: Muelle principal"
            className={control}
          />
        </EventField>
        <EventField
          id={`${id}-description`}
          label="Descripción"
          optional
          error={errors.description}
          help={
            <>
              <span>
                Modalidad, inscripción, qué traer o a quién consultar.
              </span>
              <span className="shrink-0 tabular-nums">
                {values.description.length}/600
              </span>
            </>
          }
        >
          <textarea
            {...field('description')}
            required={false}
            maxLength={600}
            rows={5}
            placeholder="Contá de qué se trata el evento…"
            className={`${control} min-h-32 resize-y leading-6`}
          />
        </EventField>
      </div>
    </section>
  )
}
