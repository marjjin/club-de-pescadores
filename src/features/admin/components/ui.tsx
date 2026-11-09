import type { ReactNode } from 'react'

export const inputClass =
  'w-full min-w-0 max-w-full rounded-lg border border-navy-900/20 bg-white px-3 py-2.5 text-sm focus:border-river-600 disabled:bg-mist-50'
export const primaryClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-800 disabled:cursor-wait disabled:opacity-50'
export const secondaryClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-navy-900/20 bg-white px-4 py-2 text-sm font-bold hover:bg-mist-50 disabled:opacity-50'

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-navy-900">
      <span>{label}</span>
      {children}
      {hint && <span className="font-normal text-ink-600">{hint}</span>}
    </label>
  )
}
export function Feedback({
  error,
  success,
}: {
  error?: Error | null
  success?: string | null
}) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error.message}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {success}
        </p>
      )}
    </>
  )
}
export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">{description}</p>
      </div>
      {action}
    </div>
  )
}
export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6">
      {children}
    </div>
  )
}
export function Loading() {
  return (
    <p role="status" className="p-6 text-sm text-ink-600">
      Cargando datos…
    </p>
  )
}
export function Empty({
  text = 'Todavía no hay registros para mostrar.',
}: {
  text?: string
}) {
  return <p className="py-12 text-center text-sm text-ink-600">{text}</p>
}
export function Pagination({
  page,
  hasNext,
  pending,
  next,
  previous,
}: {
  page: number
  hasNext: boolean
  pending: boolean
  next: () => void
  previous: () => void
}) {
  return (
    <nav
      aria-label="Paginación"
      className="mt-5 flex items-center justify-between gap-3"
    >
      <button
        className={secondaryClass}
        type="button"
        disabled={page === 1 || pending}
        onClick={previous}
      >
        Anterior
      </button>
      <span className="text-sm text-ink-600">Página {page}</span>
      <button
        className={secondaryClass}
        type="button"
        disabled={!hasNext || pending}
        onClick={next}
      >
        Siguiente
      </button>
    </nav>
  )
}
