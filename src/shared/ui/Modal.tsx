import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { X } from 'lucide-react'
import { useModalDialog } from '../hooks/useModalDialog'

const widths = {
  sm: '28rem',
  md: '40rem',
  lg: '48rem',
}

const iconTones = {
  river: 'bg-river-600/10 text-river-600',
  sun: 'bg-sun-400/25 text-navy-900',
  danger: 'bg-red-50 text-red-700',
}

type Props = {
  open: boolean
  /** Called once the window has finished closing, whatever closed it. */
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  iconTone?: keyof typeof iconTones
  /** Shows a close button in the header, with this accessible name. */
  closeLabel?: string
  size?: keyof typeof widths
  /** Sticky action bar at the bottom; on phones it stays within thumb reach. */
  footer?: ReactNode | ((close: () => void) => ReactNode)
  className?: string
  children?: ReactNode
}

/**
 * Modal window: a sheet that rises from the bottom on phones and a centred window
 * from 640px up. Esc, the back gesture and a click outside close it, animated.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  iconTone = 'river',
  closeLabel,
  size = 'md',
  footer,
  className = '',
  children,
}: Props) {
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const { requestClose, dialogProps } = useModalDialog(open, onClose)
  return (
    <dialog
      {...dialogProps}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      style={{ '--modal-width': widths[size] } as CSSProperties}
      className={`modal ${className}`}
    >
      <header className="sticky top-0 z-10 flex items-start gap-3 border-b border-navy-900/10 bg-white px-5 py-4 sm:px-6">
        {icon && (
          <span
            aria-hidden="true"
            className={`grid size-10 shrink-0 place-items-center rounded-full ${iconTones[iconTone]}`}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1 self-center">
          <h1
            id={titleId}
            className="text-base leading-snug font-extrabold text-navy-900 sm:text-lg"
          >
            {title}
          </h1>
          {description && (
            <p
              id={descriptionId}
              className="mt-1 text-sm leading-6 text-ink-600"
            >
              {description}
            </p>
          )}
        </div>
        {closeLabel && (
          <button
            type="button"
            data-autofocus
            aria-label={closeLabel}
            onClick={requestClose}
            className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 transition-colors hover:bg-mist-50 hover:text-navy-900"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </header>
      {children}
      {footer && (
        <footer className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-navy-900/10 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          {typeof footer === 'function' ? footer(requestClose) : footer}
        </footer>
      )}
    </dialog>
  )
}
