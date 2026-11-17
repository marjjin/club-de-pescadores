import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/**
 * Modal window for the tournament tools (categories, annual tables, QR). It opens
 * while mounted; Esc, the backdrop and the close button all call onClose.
 */
export function TournamentDialog({
  labelledBy,
  describedBy,
  width = '40rem',
  onClose,
  children,
}: {
  labelledBy: string
  describedBy?: string
  width?: '40rem' | '46rem'
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`m-auto max-h-[90dvh] overflow-y-auto rounded-2xl border-0 bg-white p-0 text-navy-900 shadow-xl backdrop:bg-navy-950/65 ${width === '46rem' ? 'w-[min(46rem,calc(100%_-_2rem))]' : 'w-[min(40rem,calc(100%_-_2rem))]'}`}
    >
      {children}
    </dialog>
  )
}
