import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string | undefined
  inverted?: boolean
  /** Secondary link aligned with the title, e.g. "Ver todas". */
  action?: ReactNode
  as?: 'h1' | 'h2'
}

export function SectionHeading({
  title,
  description,
  inverted = false,
  action,
  as: Heading = 'h2',
}: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="max-w-2xl">
        {/* The short yellow band echoes the club's façade; it is the site's only graphic motif. */}
        <span
          aria-hidden="true"
          className="mb-4 block h-1 w-10 rounded-full bg-sun-400"
        />
        <Heading
          className={`font-display text-4xl leading-[1.05] tracking-wide uppercase sm:text-5xl ${
            inverted ? 'text-white' : 'text-navy-900'
          }`}
        >
          {title}
        </Heading>
        {description && (
          <p
            className={`mt-3 text-lg leading-7 ${
              inverted ? 'text-white/80' : 'text-ink-600'
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
