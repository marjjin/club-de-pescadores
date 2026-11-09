import { vi } from 'vitest'

export function requestUrl(input: RequestInfo | URL | undefined): URL {
  if (!input) throw new Error('Expected a request URL')
  return new URL(
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  )
}

export const eventRows = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: 'Evento de prueba',
    starts_at: '2026-11-15T11:00:00+00:00',
    place: 'Lugar de prueba',
    description: null,
  },
]
export const newsRows = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    title: 'Noticia de prueba',
    excerpt: 'Contenido de prueba',
    published_at: '2026-10-12T15:00:00+00:00',
    image_url: 'https://example.com/image.webp',
    image_alt: 'Imagen de prueba',
  },
]
export const rateRows = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    season: 'Temporada de prueba',
    period: 'Período de prueba',
    family_price_cents: 30000000,
    individual_price_cents: 20000000,
    family_description: 'Grupo de prueba',
    discount_note: null,
  },
]

export function mockResponse(data: unknown, status = 200) {
  return vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(data), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ),
  )
}

export function mockContentApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = requestUrl(input)
      const data = url.pathname.endsWith('/news')
        ? newsRows
        : url.pathname.endsWith('/river_levels')
          ? []
          : url.pathname.endsWith('/events')
            ? eventRows
            : rateRows
      return Promise.resolve(
        new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }),
  )
}
