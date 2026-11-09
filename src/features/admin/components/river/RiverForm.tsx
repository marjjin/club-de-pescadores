import { CheckCircle2, LoaderCircle, Save, Send } from 'lucide-react'
import type { AdminRiverReading } from '../../river-editor'
import { useRiverEditor } from '../../hooks/useRiverEditor'
import { Feedback, primaryClass, secondaryClass } from '../ui'
import { RiverFields } from './RiverFields'
import { RiverPreview } from './RiverPreview'
import { RiverPublication } from './RiverPublication'
import { RiverSavedReading } from './RiverSavedReading'
import { RiverNewsLink } from './RiverNewsLink'

export function RiverForm({
  row,
  userId,
}: {
  row: AdminRiverReading | null
  userId: string
}) {
  const { values, errors, dirty, save, saved, change, reset, submit } =
    useRiverEditor(row, userId)
  const Icon = values.is_published ? Send : Save
  return (
    <>
      <RiverSavedReading reading={saved} />
      <RiverNewsLink dirty={dirty} pending={save.isPending} />
      <form
        noValidate
        onSubmit={submit}
        aria-label="Actualizar altura del río"
        aria-busy={save.isPending}
        className="min-w-0"
      >
        <fieldset disabled={save.isPending} className="min-w-0">
          <legend className="sr-only">
            Datos y publicación de la medición
          </legend>
          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <RiverFields values={values} errors={errors} onChange={change} />
            <aside className="grid min-w-0 gap-5 xl:sticky xl:top-6">
              <RiverPublication
                published={values.is_published}
                wasPublished={saved?.is_published ?? false}
                onChange={(value) => change('is_published', value)}
              />
              <RiverPreview values={values} />
            </aside>
          </div>
        </fieldset>
        <div className="sticky bottom-0 z-10 mt-6 rounded-xl border border-navy-900/10 bg-white/95 p-4 shadow-card backdrop-blur-sm">
          {Object.values(errors).some(Boolean) && (
            <p role="alert" className="mb-3 text-sm font-semibold text-red-700">
              Revisá los campos marcados antes de guardar.
            </p>
          )}
          <Feedback
            error={save.error}
            success={
              save.isSuccess
                ? saved?.is_published
                  ? 'Medición guardada y publicada en el sitio.'
                  : 'Medición guardada sin publicar. Solo está visible en el panel.'
                : null
            }
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-ink-600">
              {dirty ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-amber-400"
                  />
                  Cambios sin guardar
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  {saved
                    ? 'Sin cambios pendientes'
                    : 'Completá la primera medición'}
                </>
              )}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {dirty && (
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={(event) => {
                    const form = event.currentTarget.form
                    reset()
                    form
                      ?.querySelector<HTMLInputElement>('[name="height"]')
                      ?.focus()
                  }}
                  className={secondaryClass}
                >
                  Descartar cambios
                </button>
              )}
              <button
                type="submit"
                disabled={save.isPending}
                className={primaryClass}
              >
                {save.isPending ? (
                  <LoaderCircle
                    size={16}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <Icon size={16} aria-hidden="true" />
                )}
                {save.isPending
                  ? 'Guardando…'
                  : values.is_published
                    ? 'Guardar y publicar medición'
                    : 'Guardar sin publicar'}
              </button>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs leading-5 text-ink-600">
          Los campos con * son obligatorios. La altura se expresa en metros y la
          hora corresponde a Argentina.
        </p>
      </form>
    </>
  )
}
