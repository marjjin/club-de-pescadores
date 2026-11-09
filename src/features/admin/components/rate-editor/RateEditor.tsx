import { ArrowLeft, CheckCircle2, LoaderCircle, Save, Send } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Rate } from '../../schemas/admin'
import { useRateEditor } from '../../hooks/useRateEditor'
import { Feedback, primaryClass, secondaryClass } from '../ui'
import { RateFields } from './RateFields'
import { RatePreview } from './RatePreview'
import { RatePublication } from './RatePublication'

export function RateEditor({
  row,
  onClose,
}: {
  row: Rate | null
  onClose: () => void
}) {
  const { values, errors, dirty, save, change, close, submit } = useRateEditor(
    row,
    onClose,
  )
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])
  const label = values.is_published
    ? row?.is_published
      ? 'Guardar y publicar cambios'
      : 'Publicar tarifa'
    : 'Guardar borrador'
  const Icon = values.is_published ? Send : Save
  return (
    <>
      <header className="mb-7">
        <button
          type="button"
          onClick={close}
          disabled={save.isPending}
          className="mb-4 inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-ink-600 hover:text-navy-900 disabled:opacity-50"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Volver a tarifas
        </button>
        <p className="mb-2 text-[11px] font-extrabold tracking-[0.18em] text-ink-600 uppercase">
          Contenido del club · Pileta
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          {row ? 'Editar tarifa' : 'Crear tarifa'}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">
          Definí los precios, las condiciones y la vigencia. Revisá la vista
          previa antes de publicar.
        </p>
      </header>
      <form
        noValidate
        onSubmit={submit}
        className="min-w-0"
        aria-busy={save.isPending}
      >
        <fieldset disabled={save.isPending} className="min-w-0">
          <legend className="sr-only">Datos y publicación de la tarifa</legend>
          <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <RateFields values={values} errors={errors} onChange={change} />
            <aside className="grid min-w-0 gap-5 xl:sticky xl:top-6">
              <RatePublication
                values={values}
                onChange={(published) => change('is_published', published)}
              />
              <RatePreview values={values} />
            </aside>
          </div>
        </fieldset>
        <div className="sticky bottom-0 z-10 mt-6 rounded-xl border border-navy-900/10 bg-white/95 p-4 shadow-card backdrop-blur-sm">
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="mb-3 text-sm font-semibold text-red-700">
              Revisá los campos marcados antes de guardar la tarifa.
            </p>
          )}
          <Feedback error={save.error} />
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                  {row
                    ? 'Sin cambios pendientes'
                    : 'Completá los campos para empezar'}
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={close}
                disabled={save.isPending}
                className={secondaryClass}
              >
                Cancelar
              </button>
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
                {save.isPending ? 'Guardando…' : label}
              </button>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-ink-600">
          Los campos con * son obligatorios. Los importes se expresan en pesos
          argentinos.
        </p>
      </form>
    </>
  )
}
