import type { RefObject } from 'react'
import { AdminNavigation } from './AdminNavigation'

export function AdminMobileMenu({
  id,
  dialogRef,
  onDismiss,
  onNavigate,
  onClosed,
}: {
  id: string
  dialogRef: RefObject<HTMLDialogElement | null>
  onDismiss: () => void
  onNavigate: () => void
  onClosed: () => void
}) {
  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label="Menú de administración"
      aria-modal="true"
      onClose={onClosed}
      onCancel={(event) => {
        event.preventDefault()
        onDismiss()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss()
      }}
      className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(21rem,calc(100%_-_2rem))] max-w-none overflow-hidden border-0 bg-navy-950 p-0 text-white shadow-xl backdrop:bg-navy-950/65 lg:hidden"
    >
      <AdminNavigation mobile onDismiss={onDismiss} onNavigate={onNavigate} />
    </dialog>
  )
}
