import { useEffect, useState } from 'react'

// La banda central de la pantalla decide qué sección se considera activa.
const centerBand = '-45% 0px -50% 0px'

export function useActiveSection(ids: readonly string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: centerBand },
    )
    for (const id of ids) {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [ids])

  return activeId
}
