import { useEffect, useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Feedback, primaryClass } from '../ui'

export function UserAccessSuccess({
  editing,
  email,
  warning,
  onClose,
}: {
  editing: boolean
  email: string
  warning: string | null
  onClose: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-navy-900/10 bg-white p-6 text-center shadow-sm sm:p-10">
      <CheckCircle2
        size={40}
        aria-hidden="true"
        className="mx-auto text-emerald-700"
      />
      <h2 ref={heading} tabIndex={-1} className="mt-5 text-2xl font-extrabold">
        {warning
          ? 'Solicitud procesada'
          : editing
            ? 'Acceso actualizado'
            : 'Invitación enviada'}
      </h2>
      <p className="mt-3 text-sm font-bold wrap-anywhere">{email}</p>
      <p role="status" className="mt-3 text-sm leading-6 text-ink-600">
        {editing
          ? 'Los cambios de acceso ya se guardaron.'
          : warning
            ? 'Revisá la información de la solicitud antes de continuar.'
            : 'La persona debe abrir el correo y completar la configuración de su cuenta.'}
      </p>
      {warning && (
        <div className="mt-5 text-left">
          <Feedback success={warning} />
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        className={`${primaryClass} mt-6`}
      >
        Volver al listado
      </button>
    </section>
  )
}
