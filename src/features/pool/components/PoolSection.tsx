import { MessageCircle } from 'lucide-react'
import { club } from '@/shared/config/club'
import { textLink } from '@/shared/ui/button'
import { container, section } from '@/shared/ui/layout'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { usePoolRates } from '../hooks/usePoolRates'
import { ExternalLink } from '@/shared/ui/ExternalLink'

const price = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  // Whole pesos read as "$ 300.000"; cents still show when a rate has them.
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function PoolSection() {
  const rates = usePoolRates()

  return (
    <section id="pileta" className={`bg-mist-50 ${section}`}>
      <div className={container}>
        <SectionHeading title="Temporada de pileta" />
        <div className="mt-10">
          <QueryBoundary
            query={rates}
            emptyMessage="Pronto publicaremos los valores."
          >
            {(items) => (
              // Each card spans three shared rows (title, prices, note): side by side,
              // their titles and prices line up even when one wraps to more lines.
              <ul className="reveal-stagger grid gap-6 md:grid-cols-2">
                {items.map((rate) => (
                  <li
                    key={rate.id}
                    className="row-span-3 grid grid-rows-subgrid gap-0 overflow-hidden rounded-2xl border border-navy-900/5 bg-white shadow-card"
                  >
                    <h3 className="flex items-center border-b border-navy-900/10 bg-mist-50 px-5 py-4 font-display text-xl tracking-wide uppercase sm:px-6 sm:text-2xl">
                      {rate.season} · {rate.period}
                    </h3>
                    <dl className="grid grid-cols-2 divide-x divide-navy-900/10 p-5 sm:p-6">
                      <div className="pr-4 sm:pr-6">
                        <dt className="text-sm font-bold text-ink-600">
                          Grupo familiar
                        </dt>
                        <dd className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">
                          {price.format(rate.familyPrice)}
                        </dd>
                        <dd className="mt-1 text-sm text-ink-600">
                          {rate.familyDescription}
                        </dd>
                      </div>
                      <div className="pl-4 sm:pl-6">
                        <dt className="text-sm font-bold text-ink-600">
                          Individual
                        </dt>
                        <dd className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">
                          {price.format(rate.individualPrice)}
                        </dd>
                      </div>
                    </dl>
                    {/* The note row stays even when empty, so the grid keeps three rows. */}
                    <div className="px-5 pb-5 empty:p-0 sm:px-6 sm:pb-6">
                      {rate.discountNote && (
                        <p className="rounded-lg bg-sun-400/15 px-4 py-3 text-sm text-navy-900">
                          {rate.discountNote}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </div>
        <p className="mt-6 flex flex-wrap items-center gap-x-3 text-ink-600">
          Consultá disponibilidad y condiciones de ingreso.
          <ExternalLink href={club.whatsappUrl} className={textLink}>
            <MessageCircle aria-hidden="true" className="size-4" />
            Consultar por WhatsApp
          </ExternalLink>
        </p>
      </div>
    </section>
  )
}
