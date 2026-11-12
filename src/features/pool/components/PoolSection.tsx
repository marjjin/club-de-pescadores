import { MessageCircle } from 'lucide-react'
import { club } from '@/shared/config/club'
import { textLink } from '@/shared/ui/button'
import { container, section } from '@/shared/ui/layout'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { usePoolRates } from '../hooks/usePoolRates'

const price = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

export function PoolSection() {
  const rates = usePoolRates()

  return (
    <section id="pileta" className={section}>
      <div className={container}>
        <SectionHeading title="Temporada de pileta" />
        <div className="mt-10">
          <QueryBoundary
            query={rates}
            emptyMessage="Pronto publicaremos los valores."
          >
            {(items) => (
              <ul className="grid gap-6 md:grid-cols-2">
                {items.map((rate) => (
                  <li
                    key={rate.id}
                    className="overflow-hidden rounded-2xl border border-navy-900/5 bg-white shadow-card"
                  >
                    <h3 className="border-b border-navy-900/10 bg-mist-50 px-6 py-4 font-display text-2xl tracking-wide uppercase">
                      {rate.season} · {rate.period}
                    </h3>
                    <dl className="grid gap-6 p-6 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-navy-900/10">
                      <div className="sm:pr-6">
                        <dt className="text-sm font-bold text-ink-600">
                          Grupo familiar
                        </dt>
                        <dd className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
                          {price.format(rate.familyPrice)}
                        </dd>
                        <dd className="mt-1 text-sm text-ink-600">
                          {rate.familyDescription}
                        </dd>
                      </div>
                      <div className="sm:pl-6">
                        <dt className="text-sm font-bold text-ink-600">
                          Individual
                        </dt>
                        <dd className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
                          {price.format(rate.individualPrice)}
                        </dd>
                      </div>
                    </dl>
                    {rate.discountNote && (
                      <p className="mx-6 mb-6 rounded-lg bg-sun-400/15 px-4 py-3 text-sm text-navy-900">
                        {rate.discountNote}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </div>
        <p className="mt-6 flex flex-wrap items-center gap-x-3 text-ink-600">
          Consultá disponibilidad y condiciones de ingreso.
          <a href={club.whatsappUrl} className={textLink}>
            <MessageCircle aria-hidden="true" className="size-4" />
            Consultar por WhatsApp
          </a>
        </p>
      </div>
    </section>
  )
}
