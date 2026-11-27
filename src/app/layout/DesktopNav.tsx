import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useActiveSection } from '@/shared/hooks/useActiveSection'
import { currentNav, navLinks } from '../config/navigation'

// Only home anchors are tracked by scroll; page links are not sections.
const sectionIds = navLinks.flatMap((link) => link.href.split('#')[1] ?? [])

const linkClass = (current: boolean) =>
  `inline-flex min-h-11 items-center rounded-lg px-3 transition-colors hover:bg-mist-50 hover:text-river-600 ${
    current ? 'text-river-600' : 'text-navy-900'
  }`

type Indicator = { left: number; width: number; visible: boolean }

export function DesktopNav() {
  const { pathname } = useLocation()
  const activeId = useActiveSection(sectionIds)
  const listRef = useRef<HTMLUListElement>(null)
  const [indicator, setIndicator] = useState<Indicator | null>(null)
  const current = navLinks.map((link) => currentNav(link, pathname, activeId))
  const currentIndex = current.findIndex(Boolean)

  // One underline for the whole menu that slides to the current link, instead of
  // one per link popping in and out. Measured again when the links change width
  // (web fonts arriving, window resized).
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const link = list.querySelectorAll('a')[currentIndex]
      // With no current link the line fades out where it is, so the next one
      // slides from there instead of from the menu's edge.
      setIndicator((previous) =>
        link
          ? // inset-x-3: the line spans the text, not the link's padding.
            {
              left: link.offsetLeft + 12,
              width: link.offsetWidth - 24,
              visible: true,
            }
          : previous && { ...previous, visible: false },
      )
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [currentIndex])

  return (
    <nav aria-label="Principal" className="ml-auto hidden lg:block">
      <ul
        ref={listRef}
        className="relative flex items-center gap-1 text-[0.9375rem] font-semibold"
      >
        {navLinks.map((link, index) => (
          <li key={link.href}>
            {/* Plain anchors like the rest of the menu: Link would add router code to the initial bundle. */}
            <a
              href={link.href}
              aria-current={current[index]}
              className={linkClass(!!current[index])}
            >
              {link.label}
            </a>
          </li>
        ))}
        {/* Mounted already in place, so on page load it does not slide in from the left. */}
        {indicator && (
          <li
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-1.5 left-0 h-0.5 rounded-full bg-sun-400 transition-[translate,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              indicator.visible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              translate: `${indicator.left}px 0`,
              width: indicator.width,
            }}
          />
        )}
      </ul>
    </nav>
  )
}
