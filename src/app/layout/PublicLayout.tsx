import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Footer } from './Footer'
import { Header } from './Header'
import { WhatsAppButton } from './WhatsAppButton'
import { RiverLevelBar } from '@/features/river'

export function PublicLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // The target exists only after the lazy page has mounted.
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return (
    <>
      <a
        href="#contenido"
        className="sr-only font-bold focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-30 focus:rounded-md focus:bg-white focus:px-4 focus:py-2"
      >
        Saltar al contenido
      </a>
      <Header key={pathname} />
      <main id="contenido" tabIndex={-1}>
        <RiverLevelBar />
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
