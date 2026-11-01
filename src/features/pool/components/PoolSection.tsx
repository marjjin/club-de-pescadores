import { BadgePercent, MessageCircle } from 'lucide-react'
import { club } from '../../../shared/config/club'
import { button } from '../../../shared/ui/button'
import { QueryBoundary } from '../../../shared/ui/QueryBoundary'
import { SectionHeading } from '../../../shared/ui/SectionHeading'
import { usePoolRates } from '../hooks/usePoolRates'

const price = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function PoolSection() {
  const rates = usePoolRates()

  return (
    <section id="pileta" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading title="Temporada de pileta 2026/2027" />
        <div className="mt-8">
          <QueryBoundary
            query={rates}
            emptyMessage="Pronto publicaremos los valores."
          >
            {(items) => (
              <ul className="grid gap-6 md:grid-cols-2">
                {items.map((rate) => (
                  <li
                    key={rate.id}
                    className="overflow-hidden rounded-md shadow-card"
                  >
                    <h3 className="bg-navy-900 px-6 py-3 font-bold text-white">
                      {rate.period}
                    </h3>
                    <dl className="grid gap-5 p-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-ink-600">Grupo familiar</dt>
                        <dd className="mt-1 text-3xl font-extrabold">
                          {price.format(rate.familyPrice)}
                        </dd>
                        <dd className="text-sm text-ink-600">
                          2 adultos + 3 niños
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-600">Individual</dt>
                        <dd className="mt-1 text-3xl font-extrabold">
                          {price.format(rate.individualPrice)}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </div>
        <div className="mt-6 flex flex-col gap-4 rounded-md bg-mist-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 font-semibold">
            <BadgePercent
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-river-600"
            />
            Jubilados: 10% de descuento para quienes cobran la jubilación
            mínima.
          </p>
          <a href={club.whatsappUrl} className={`${button.primary} shrink-0`}>
            <MessageCircle aria-hidden="true" className="size-5" />
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
