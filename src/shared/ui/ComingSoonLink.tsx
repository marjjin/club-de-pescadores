import { useState } from 'react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  label?: string
}

// Acciones del diseño cuyo destino todavía no existe en el boceto.
export function ComingSoonLink({ children, className, label }: Props) {
  const [notified, setNotified] = useState(false)

  const notify = () => {
    setNotified(true)
    window.setTimeout(() => setNotified(false), 2000)
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={notify}
      className={`cursor-pointer ${className ?? ''}`}
    >
      {notified ? <span aria-live="polite">Próximamente</span> : children}
    </button>
  )
}
