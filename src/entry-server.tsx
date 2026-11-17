// Build-time rendering of the fixed public pages (scripts/production/prepare-public.mjs):
// the served HTML already shows the header, hero and headings, and the browser hydrates
// it instead of drawing from an empty page. Data still loads in the browser.
import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import { Providers } from './app/Providers'
import { AppRoutes } from './app/routes'

async function once(url: string) {
  const errors: unknown[] = []
  const { prelude } = await prerender(
    <StrictMode>
      <Providers>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </Providers>
    </StrictMode>,
    {
      onError: (error) => void errors.push(error),
      // Keep finished sections in place: big ones would otherwise be moved in later with
      // inline scripts, which the CSP blocks.
      progressiveChunkSize: Number.POSITIVE_INFINITY,
    },
  )
  // A page that fails here would ship broken markup: stop the build instead.
  if (errors.length)
    throw errors[0] instanceof Error ? errors[0] : new Error(String(errors[0]))
  // React leaves title and meta out of a body-only render; the page head already has them.
  return new Response(prelude).text()
}

export async function render(url: string) {
  // The first pass loads the lazy pages; the second renders them without waiting.
  // The output must be plain markup: the CSP blocks the inline scripts React would
  // otherwise use to slot parts in, and the browser would then redo them.
  await once(url)
  const html = await once(url)
  if (/<script|<template/.test(html))
    throw new Error(`El prerender de ${url} todavía tiene partes diferidas.`)
  return html
}
