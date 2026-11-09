import type { ReactNode } from 'react'

type Props = {
  id: string
  label: string
  help?: ReactNode | undefined
  error?: string | undefined
  optional?: boolean
  children: ReactNode
}

// Shared label/help/error layout; the control receives `${id}` and must
// reference `${id}-help` / `${id}-error` through aria-describedby.
export function EventField({
  id,
  label,
  help,
  error,
  optional = false,
  children,
}: Props) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}{' '}
        {optional ? (
          <span className="font-normal text-ink-600">(opcional)</span>
        ) : (
          <span aria-hidden="true" className="text-river-600">
            *
          </span>
        )}
      </label>
      {children}
      {help && (
        <div
          id={`${id}-help`}
          className="mt-2 flex min-w-0 justify-between gap-3 text-xs wrap-anywhere text-ink-600"
        >
          {help}
        </div>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 text-xs font-semibold text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  )
}
