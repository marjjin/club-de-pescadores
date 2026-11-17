// Build-time rendering of the fixed public pages (scripts/production/prepare-public.mjs):
// the served HTML already shows the header, hero and headings, and the browser hydrates
// it instead of drawing from an empty page. Data still loads in the browser.
import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import { Providers } from './app/Providers'
import { AppRoutes } from './app/routes'

export async function render(url: string) {
  const errors: unknown[] = []
  const { prelude } = await prerender(
    <StrictMode>
      <Providers>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </Providers>
    </StrictMode>,
    { onError: (error) => void errors.push(error) },
  )
  // A page that fails here would ship broken markup: stop the build instead.
  if (errors.length)
    throw errors[0] instanceof Error ? errors[0] : new Error(String(errors[0]))
  // React leaves title and meta out of a body-only render; the page head already has them.
  return new Response(prelude).text()
}
