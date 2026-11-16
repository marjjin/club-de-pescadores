import { LoaderCircle, Plus, Save } from 'lucide-react'
import { MAX_FACILITIES } from '@/features/facilities'
import { useFacilitiesEditor } from '../../hooks/useFacilitiesEditor'
import type { AdminFacilities } from '../../schemas/facilities'
import {
  Feedback,
  Field,
  inputClass,
  primaryClass,
  secondaryClass,
} from '../ui'
import { FacilityCardEditor } from './FacilityCardEditor'

export function FacilitiesEditor({
  data,
  userId,
  editable,
  onSaved,
}: {
  data: AdminFacilities
  userId: string
  editable: boolean
  onSaved: () => void
}) {
  const editor = useFacilitiesEditor(data, userId, onSaved)
  const { draft, errors } = editor
  const headingError = (name: string) =>
    errors[name] && (
      <p role="alert" className="-mt-2 text-sm font-semibold text-red-700">
        {errors[name]}
      </p>
    )
  return (
    <form
      noValidate
      onSubmit={editor.submit}
      aria-busy={editor.busy}
      className="min-w-0"
    >
      <fieldset
        disabled={!editable || editor.save.isPending}
        className="min-w-0"
      >
        <legend className="sr-only">Contenido de la sección</legend>
        <section className="grid gap-4 rounded-2xl border border-navy-900/10 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-extrabold">Encabezado</h2>
          <Field label="Título de la sección">
            <input
              className={inputClass}
              value={draft.title}
              maxLength={80}
              data-field="title"
              aria-invalid={Boolean(errors.title)}
              onChange={(event) =>
                editor.setHeading('title', event.target.value)
              }
            />
          </Field>
          {headingError('title')}
          <Field label="Bajada">
            <textarea
              className={`${inputClass} min-h-20`}
              value={draft.description}
              maxLength={200}
              data-field="description"
              aria-invalid={Boolean(errors.description)}
              onChange={(event) =>
                editor.setHeading('description', event.target.value)
              }
            />
          </Field>
          {headingError('description')}
        </section>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">Tarjetas</h2>
            <p className="mt-1 text-sm text-ink-600">
              Se muestran en este orden. Hasta {MAX_FACILITIES} tarjetas.
            </p>
          </div>
          {editable && (
            <button
              type="button"
              className={secondaryClass}
              disabled={editor.full}
              onClick={editor.addCard}
            >
              <Plus size={16} aria-hidden="true" />
              {editor.full ? 'Máximo de tarjetas' : 'Agregar tarjeta'}
            </button>
          )}
        </div>
        {errors.cards && (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
            {errors.cards}
          </p>
        )}
        <ol className="mt-4 grid gap-4" aria-label="Tarjetas de instalaciones">
          {draft.cards.map((card, index) => (
            <FacilityCardEditor
              key={card.key}
              card={card}
              index={index}
              total={draft.cards.length}
              errors={errors}
              uploading={Boolean(editor.uploading[card.key])}
              uploadError={editor.uploadErrors[card.key] ?? ''}
              editable={editable}
              onChange={(name, value) =>
                editor.changeCard(card.key, name, value)
              }
              onUpload={(file) => editor.uploadPhoto(card.key, file)}
              onMove={(step) => editor.moveCard(card.key, step)}
              onRemove={() => editor.removeCard(card.key)}
            />
          ))}
        </ol>
      </fieldset>
      {editable && (
        <div className="sticky bottom-0 z-10 mt-6 rounded-xl border border-navy-900/10 bg-white/95 p-4 shadow-card backdrop-blur-sm">
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="mb-3 text-sm font-semibold text-red-700">
              Revisá los campos marcados antes de publicar.
            </p>
          )}
          <Feedback error={editor.save.error} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-ink-600">
              {Object.values(editor.uploading).some(Boolean)
                ? 'Esperá a que terminen de subirse las fotos.'
                : editor.dirty
                  ? 'Cambios sin publicar'
                  : 'Sin cambios pendientes'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryClass}
                disabled={!editor.dirty || editor.busy}
                onClick={editor.discard}
              >
                Descartar cambios
              </button>
              <button
                type="submit"
                className={primaryClass}
                disabled={!editor.dirty || editor.busy}
              >
                {editor.save.isPending ? (
                  <LoaderCircle
                    size={16}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                {editor.save.isPending ? 'Publicando…' : 'Publicar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
