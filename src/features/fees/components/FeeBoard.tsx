import { formatFeePrice } from '../format'
import { feeIcons } from '../icons'
import type { Fee, FeeKind } from '../types'

const groups: { kind: FeeKind; title: string }[] = [
  { kind: 'membership', title: 'Cuotas' },
  { kind: 'service', title: 'Servicios' },
]

/**
 * The two price lists as the club posts them at the office: name, dotted leader,
 * price. Presentational only, so the panel can preview exactly what the site shows.
 */
export function FeeBoard({
  fees,
  compact = false,
}: {
  fees: readonly Pick<
    Fee,
    'id' | 'kind' | 'name' | 'detail' | 'icon' | 'price'
  >[]
  /** Single column, for the narrow preview in the panel. */
  compact?: boolean
}) {
  return (
    <div
      className={`grid gap-x-12 gap-y-10 ${compact ? '' : 'lg:grid-cols-2'}`}
    >
      {groups.map(({ kind, title }) => {
        const items = fees.filter((fee) => fee.kind === kind)
        if (!items.length) return null
        return (
          <section key={kind} aria-labelledby={`fees-${kind}`}>
            <h3
              id={`fees-${kind}`}
              className="border-b-2 border-sun-400 pb-2 font-display text-3xl tracking-wide text-sun-400 uppercase"
            >
              {title}
            </h3>
            <dl className="reveal-stagger mt-2">
              {items.map((fee) => {
                const Icon = feeIcons[fee.icon].icon
                return (
                  <div
                    key={fee.id}
                    className="flex items-end gap-3 border-b border-white/10 py-3.5 last:border-b-0"
                  >
                    <dt className="flex min-w-0 flex-1 items-end gap-3">
                      <Icon
                        aria-hidden="true"
                        size={22}
                        className="mb-0.5 shrink-0 self-start text-sun-400/85"
                      />
                      <span className="min-w-0">
                        <span className="block font-bold wrap-anywhere text-white">
                          {fee.name}
                        </span>
                        {fee.detail && (
                          <span className="block text-sm text-white/65">
                            {fee.detail}
                          </span>
                        )}
                      </span>
                      {/* The leader ties each name to its price, like the printed notice. */}
                      <span
                        aria-hidden="true"
                        className="reveal-leader mb-1.5 min-w-4 flex-1 border-b-2 border-dotted border-white/25"
                      />
                    </dt>
                    <dd className="shrink-0 font-display text-2xl leading-none tracking-wide text-white tabular-nums sm:text-[1.7rem]">
                      {formatFeePrice(fee.price)}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </section>
        )
      })}
    </div>
  )
}
