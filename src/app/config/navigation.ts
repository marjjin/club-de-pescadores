type NavLink = {
  label: string
  href: string
  /** Page that also belongs to this link, so it stays highlighted there. */
  page?: string
}

export const navLinks: readonly NavLink[] = [
  // Same order as the home page sections.
  { label: 'Noticias', href: '/#noticias', page: '/noticias' },
  { label: 'Eventos', href: '/#eventos', page: '/eventos' },
  { label: 'Instalaciones', href: '/#instalaciones' },
  { label: 'Pileta', href: '/#pileta' },
  { label: 'Tarifas', href: '/#tarifas' },
  { label: 'Contacto', href: '/#contacto' },
  { label: 'Torneos', href: '/torneos', page: '/torneos' },
]

/** Home anchors follow the scroll; on other pages the matching page link is current. */
export function currentNav(
  link: NavLink,
  pathname: string,
  activeSection: string | null,
): 'page' | 'location' | undefined {
  if (
    link.page &&
    (pathname === link.page || pathname.startsWith(`${link.page}/`))
  )
    return 'page'
  if (pathname === '/' && link.href === `/#${activeSection}`) return 'location'
  return undefined
}
