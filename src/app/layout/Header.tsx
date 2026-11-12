import { useRef, useState } from 'react'
import logo192 from '@/shared/assets/images/logo-192.webp'
import { useScrolled } from '@/shared/hooks/useScrolled'
import { container } from '@/shared/ui/layout'
import { DesktopNav } from './DesktopNav'
import { MobileMenu } from './MobileMenu'

const bar =
  'absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const scrolled = useScrolled()

  const close = () => setIsOpen(false)
  const dismiss = () => {
    close()
    toggleRef.current?.focus()
  }

  return (
    <header
      className={`sticky top-0 z-20 border-b bg-white transition-[box-shadow,border-color] duration-300 motion-reduce:transition-none ${
        scrolled || isOpen
          ? 'border-transparent shadow-[0_6px_24px_rgb(7_27_51/0.08)]'
          : 'border-navy-900/10'
      }`}
    >
      <div className={`${container} flex h-18 items-center gap-8`}>
        <a href="/#inicio" className="flex items-center gap-3 rounded-lg">
          <img
            src={logo192}
            width="192"
            height="192"
            alt=""
            className="size-12"
          />
          <span className="leading-tight font-extrabold">
            Club de Pescadores
            <span className="block text-sm font-semibold text-ink-600">
              San Nicolás
            </span>
          </span>
        </a>
        <DesktopNav />
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto grid size-11 place-items-center rounded-lg hover:bg-mist-50 lg:hidden"
        >
          <span aria-hidden="true" className="relative block h-4 w-6">
            <span
              className={`${bar} top-0 ${isOpen ? 'translate-y-[7px] rotate-45' : ''}`}
            />
            <span
              className={`${bar} top-[7px] ${isOpen ? 'scale-x-0 opacity-0' : ''}`}
            />
            <span
              className={`${bar} top-[14px] ${isOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
            />
          </span>
        </button>
      </div>
      <MobileMenu
        id="mobile-menu"
        isOpen={isOpen}
        onClose={close}
        onDismiss={dismiss}
        triggerRef={toggleRef}
      />
    </header>
  )
}
