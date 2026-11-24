import { useEffect, useState } from 'react'

// La banda central de la pantalla decide qué sección se considera activa.
const centerBand = '-45% 0px -50% 0px'

// The last section (the footer) is shorter than half a screen, so it never reaches the
// center band: at the bottom of the page it is the active one.
function atPageBottom() {
  const root = document.documentElement
  return window.innerHeight + window.scrollY >= root.scrollHeight - 2
}

export function useActiveSection(ids: readonly string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const sections = () =>
      ids.flatMap((id) => document.getElementById(id) ?? [])
    const observer = new IntersectionObserver(
      (entries) => {
        if (atPageBottom()) return
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: centerBand },
    )
    for (const section of sections()) observer.observe(section)
    const onScroll = () => {
      if (!atPageBottom()) return
      const last = sections().reduce<HTMLElement | null>(
        (lowest, section) =>
          !lowest || section.offsetTop > lowest.offsetTop ? section : lowest,
        null,
      )
      if (last) setActiveId(last.id)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [ids])

  return activeId
}
