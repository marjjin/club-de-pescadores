import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'

export function useAdminMobileMenu() {
  const location = useLocation()
  const [openFor, setOpenFor] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = openFor === location.key
  const close = useCallback(
    (destination: 'trigger' | 'content' = 'trigger') => {
      setOpenFor(null)
      if (dialogRef.current?.open) dialogRef.current.close()
      if (destination === 'trigger') triggerRef.current?.focus()
      else document.getElementById('admin-content')?.focus()
    },
    [],
  )
  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('button')?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const desktop = window.matchMedia('(min-width: 64rem)')
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) close('content')
    }
    desktop.addEventListener('change', onDesktop)
    return () => {
      desktop.removeEventListener('change', onDesktop)
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [open, close])
  return {
    open,
    triggerRef,
    dialogRef,
    show: () => setOpenFor(location.key),
    close,
    onClosed: () => setOpenFor(null),
  }
}
