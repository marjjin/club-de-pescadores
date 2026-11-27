import { useLayoutEffect, useState, ViewTransition } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Footer } from './Footer'
import { Header } from './Header'
import { WhatsAppButton } from './WhatsAppButton'
import { RiverLevelBar } from '@/features/river'

export function PublicLayout() {
  const { pathname, hash, key } = useLocation()
  // React also runs view transitions when the first page finishes loading
  // (hydration, lazy route revealed). Only a real navigation may animate: on a
  // reload the fade blanked the hero for a moment.
  const [firstKey] = useState(key)
  const navigated = key !== firstKey

  // Layout effect: it runs inside the page-change transition, so the new page is
  // captured already scrolled to its place instead of jumping after the fade.
  useLayoutEffect(() => {
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
        {/* Router navigations run in a transition, so the new page fades in (index.css).
            One element with the river bar inside: it moves with the page, and fading
            it apart from it ghosted the bar where it sat on the old, scrolled page. */}
        <ViewTransition default={navigated ? 'page' : 'none'}>
          <div>
            <RiverLevelBar />
            <Outlet />
          </div>
        </ViewTransition>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
