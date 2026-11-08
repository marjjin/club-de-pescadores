import { useRef, useState } from 'react'
import logo192 from '@/shared/assets/images/logo-192.webp'
import { navLinks } from '../config/navigation'
import { useActiveSection } from '@/shared/hooks/useActiveSection'
import { MobileMenu } from './MobileMenu'

const sectionIds = navLinks.map((link) => link.href.split('#')[1] ?? '')

const bar =
  'absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const activeId = useActiveSection(sectionIds)

  const close = () => setIsOpen(false)
  const dismiss = () => {
    close()
    toggleRef.current?.focus()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-navy-900/10 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-4 sm:px-6">
        <a href="/#inicio" className="flex items-center gap-3">
          <img
            src={logo192}
            width="192"
            height="192"
            alt=""
            className="size-14"
          />
          <span className="leading-tight font-extrabold">
            Club de Pescadores
            <span className="block text-sm font-semibold text-ink-600">
              San Nicolás
            </span>
          </span>
        </a>
        <nav aria-label="Principal" className="ml-auto hidden lg:block">
          <ul className="flex gap-8 font-semibold">
            {navLinks.map((link) => {
              const isActive = link.href === `/#${activeId}`
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? 'location' : undefined}
                    className={`relative py-2 transition-colors hover:text-river-600 ${
                      isActive ? 'text-river-600' : ''
                    }`}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-sun-400 transition-[scale] duration-300 motion-reduce:transition-none ${
                        isActive ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto grid size-11 place-items-center rounded-md lg:hidden"
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
