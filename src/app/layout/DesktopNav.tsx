import { useLocation } from 'react-router'
import { useActiveSection } from '@/shared/hooks/useActiveSection'
import { currentNav, navLinks } from '../config/navigation'

// Only home anchors are tracked by scroll; page links are not sections.
const sectionIds = navLinks.flatMap((link) => link.href.split('#')[1] ?? [])

const linkClass = (current: boolean) =>
  `relative inline-flex min-h-11 items-center rounded-lg px-3 transition-colors hover:bg-mist-50 hover:text-river-600 ${
    current ? 'text-river-600' : 'text-navy-900'
  }`

export function DesktopNav() {
  const { pathname } = useLocation()
  const activeId = useActiveSection(sectionIds)
  return (
    <nav aria-label="Principal" className="ml-auto hidden lg:block">
      <ul className="flex items-center gap-1 text-[0.9375rem] font-semibold">
        {navLinks.map((link) => {
          const current = currentNav(link, pathname, activeId)
          const content = (
            <>
              {link.label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-3 bottom-1.5 h-0.5 origin-left rounded-full bg-sun-400 transition-[scale] duration-300 motion-reduce:transition-none ${
                  current ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </>
          )
          return (
            <li key={link.href}>
              {/* Plain anchors like the rest of the menu: Link would add router code to the initial bundle. */}
              <a
                href={link.href}
                aria-current={current}
                className={linkClass(!!current)}
              >
                {content}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
