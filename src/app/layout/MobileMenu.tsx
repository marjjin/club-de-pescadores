import { ChevronRight, Phone } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { club } from '@/shared/config/club'
import { navLinks } from '../config/navigation'
import { button } from '@/shared/ui/button'

type Props = {
  id: string
  isOpen: boolean
  onClose: () => void
  onDismiss: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

// `visibility` solo se anima al cerrar: al abrir debe cambiar ya para que entre el foco.
const panelMotion = {
  open: 'transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none',
  closed:
    'transition-[opacity,translate,visibility] duration-300 ease-out motion-reduce:transition-none',
}
const itemMotion =
  'transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none'
const staggerStep = 45

// Sigue montado al cerrarse para que la salida también se anime.
export function MobileMenu({
  id,
  isOpen,
  onClose,
  onDismiss,
  triggerRef,
}: Props) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  useFocusTrap(panelRef, triggerRef, isOpen)
  const motion = isOpen ? panelMotion.open : panelMotion.closed
  const reveal = isOpen
    ? 'translate-x-0 opacity-100'
    : '-translate-x-4 opacity-0'
  const delayFor = (step: number) => ({
    transitionDelay: isOpen ? `${80 + step * staggerStep}ms` : '0ms',
  })

  useEffect(() => {
    if (!isOpen) return
    firstLinkRef.current?.focus()

    // Evita que la página de fondo se desplace mientras el panel la tapa.
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    // Al pasar a escritorio el panel se oculta y no debe dejar el scroll bloqueado.
    const desktop = window.matchMedia('(min-width: 64rem)')
    document.addEventListener('keydown', handleKeyDown)
    desktop.addEventListener('change', onClose)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      desktop.removeEventListener('change', onClose)
    }
  }, [isOpen, onClose, onDismiss])

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onDismiss}
        className={`fixed inset-x-0 top-18 bottom-0 bg-navy-950/60 lg:hidden ${motion} ${
          isOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      />
      <nav
        ref={panelRef}
        id={id}
        aria-label="Principal móvil"
        className={`absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-x-hidden overflow-y-auto border-t border-navy-900/10 bg-white shadow-xl lg:hidden ${motion} ${
          isOpen
            ? 'visible translate-y-0 opacity-100'
            : 'invisible -translate-y-3 opacity-0'
        }`}
      >
        <ul className="px-4 sm:px-6">
          {navLinks.map((link, index) => (
            <li
              key={link.href}
              style={delayFor(index)}
              className={`border-b border-navy-900/10 ${itemMotion} ${reveal}`}
            >
              <a
                ref={index === 0 ? firstLinkRef : undefined}
                href={link.href}
                onClick={onClose}
                className="flex min-h-14 items-center justify-between font-display text-2xl tracking-wide uppercase transition-colors active:text-river-600"
              >
                {link.label}
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 text-ink-600"
                />
              </a>
            </li>
          ))}
        </ul>
        <div
          style={delayFor(navLinks.length)}
          className={`grid p-4 sm:px-6 ${itemMotion} ${reveal}`}
        >
          <a href="/#sumate" onClick={onClose} className={button.primary}>
            Hacete socio
          </a>
        </div>
        <a
          href={club.whatsappUrl}
          className="flex min-h-12 items-center justify-center gap-2 bg-mist-50 px-4 font-semibold text-ink-600 hover:text-river-600"
        >
          <Phone aria-hidden="true" className="size-4" />
          {club.phone}
        </a>
      </nav>
    </>
  )
}
