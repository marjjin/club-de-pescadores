import { Banknote, CalendarDays, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  RateEditorErrors,
  RateEditorValues,
  RateTextKey,
} from '../../rate-editor'
import { RateField } from './RateField'

function FieldSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <section
      aria-label={title}
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <header className="mb-6 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-mist-50 text-navy-800"
        >
          <Icon size={19} />
        </span>
        <div>
          <h2 className="text-base font-extrabold">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-ink-600">{description}</p>
        </div>
      </header>
      <div className="grid gap-6">{children}</div>
    </section>
  )
}

export function RateFields({
  values,
  errors,
  onChange,
}: {
  values: RateEditorValues
  errors: RateEditorErrors
  onChange: (name: RateTextKey, value: string) => void
}) {
  const field = (name: RateTextKey) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange,
  })
  return (
    <div className="grid min-w-0 gap-5">
      <FieldSection
        title="Datos de la tarifa"
        description="Identificá la temporada y el tipo de acceso que estás ofreciendo."
        icon={Waves}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <RateField
            {...field('season')}
            label="Temporada"
            max={120}
            hint="Nombre de la temporada, por ejemplo: Verano 2026/2027."
          />
          <RateField
            {...field('period')}
            label="Período"
            max={120}
            hint="Indicá a qué corresponde el precio: día, mes o temporada."
          />
        </div>
      </FieldSection>
      <FieldSection
        title="Precios y condiciones"
        description="Importes en pesos argentinos (ARS). Sin separadores de miles; usá coma o punto para los decimales."
        icon={Banknote}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <RateField
            {...field('family_price_cents')}
            label="Precio familiar (ARS)"
            type="money"
            hint="Importe total para el grupo familiar. El valor 0 es válido."
          />
          <RateField
            {...field('individual_price_cents')}
            label="Precio individual (ARS)"
            type="money"
            hint="Importe por persona. Hasta dos decimales."
          />
        </div>
        <RateField
          {...field('family_description')}
          label="Condiciones del grupo familiar"
          type="textarea"
          max={300}
          hint="Detallá quiénes integran el grupo y qué incluye esta tarifa."
        />
        <RateField
          {...field('discount_note')}
          label="Descuento o aclaración"
          type="textarea"
          max={500}
          optional
          hint="Se mostrará debajo de los precios. Dejalo vacío si no corresponde."
        />
      </FieldSection>
      <FieldSection
        title="Vigencia"
        description="Definí cuándo se mostrará esta tarifa si elegís publicarla. Fechas de Argentina."
        icon={CalendarDays}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <RateField
            {...field('valid_from')}
            label="Vigente desde"
            type="date"
            hint="Se mostrará a partir de este día, inclusive."
          />
          <RateField
            {...field('valid_until')}
            label="Vigente hasta"
            type="date"
            min={values.valid_from}
            optional
            hint="Incluye este día. Sin fecha final, seguirá vigente hasta que la retires."
          />
        </div>
      </FieldSection>
    </div>
  )
}
