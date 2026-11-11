import type { ReactNode } from 'react'

export function PierStep({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: ReactNode
}) {
  return (
    <section className="min-w-0">
      <h3 className="mb-3 flex items-center gap-2.5 text-sm font-extrabold">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs text-white"
        >
          {number}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}
