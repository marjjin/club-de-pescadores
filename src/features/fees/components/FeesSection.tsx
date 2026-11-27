import { MessageCircle } from 'lucide-react'
import { club } from '@/shared/config/club'
import { button } from '@/shared/ui/button'
import { container, section } from '@/shared/ui/layout'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { formatValidFrom } from '../format'
import { useFees } from '../hooks/useFees'
import { FeeBoard } from './FeeBoard'
import { ExternalLink } from '@/shared/ui/ExternalLink'

const board =
  'mt-10 rounded-3xl border border-white/10 bg-navy-900 p-5 sm:p-8 lg:p-10'

// textLink in the club yellow: river blue lacks contrast on navy.
const linkOnDark =
  'inline-flex min-h-11 items-center gap-2 font-bold text-sun-400 underline-offset-4 hover:underline'

// The one dark band between the white sections: it reads as the club's price board.
export function FeesSection() {
  const query = useFees()
  const data = query.data
  const since = data ? formatValidFrom(data.validFrom) : ''
  return (
    <section
      id="tarifas"
      aria-busy={query.isPending}
      className={`bg-navy-950 ${section}`}
    >
      <div className={container}>
        <SectionHeading
          inverted
          title="Cuotas y servicios"
          description={
            since ? `Valores vigentes desde ${since}.` : 'Valores del club.'
          }
        />
        {query.isPending ? (
          <div
            role="status"
            aria-label="Cargando cuotas y servicios"
            className={`${board} grid gap-10 lg:grid-cols-2`}
          >
            {[9, 6].map((rows) => (
              <div key={rows} className="grid gap-4">
                <div className="h-9 w-40 rounded bg-white/10 motion-safe:animate-pulse" />
                {Array.from({ length: rows }, (_, index) => (
                  <div
                    key={index}
                    className="h-8 rounded bg-white/5 motion-safe:animate-pulse"
                  />
                ))}
              </div>
            ))}
          </div>
        ) : data ? (
          <div className={board}>
            {query.isError && (
              <p role="status" className="mb-6 text-sm text-white/70">
                No pudimos actualizar los valores. Mostramos los últimos
                cargados.
              </p>
            )}
            <FeeBoard fees={data.fees} />
            {data.note && (
              <p className="mt-8 rounded-xl bg-sun-400/10 px-4 py-3 text-white/90">
                {data.note}
              </p>
            )}
          </div>
        ) : (
          <div
            role={query.isError ? 'alert' : undefined}
            className={`${board} grid justify-items-start gap-4 text-white/80`}
          >
            <p>
              {query.isError
                ? 'No pudimos cargar los valores. Probá de nuevo en unos minutos o consultalos por WhatsApp.'
                : 'Todavía no cargamos los valores. Consultalos por WhatsApp.'}
            </p>
            {query.isError && (
              <button
                type="button"
                onClick={() => void query.refetch()}
                className={button.outlineOnDark}
              >
                Reintentar
              </button>
            )}
          </div>
        )}
        <p className="mt-6 flex flex-wrap items-center gap-x-3 text-white/80">
          ¿Tenés dudas sobre qué cuota te corresponde?
          <ExternalLink href={club.whatsappUrl} className={linkOnDark}>
            <MessageCircle aria-hidden="true" className="size-4" />
            Consultar por WhatsApp
          </ExternalLink>
        </p>
      </div>
    </section>
  )
}
