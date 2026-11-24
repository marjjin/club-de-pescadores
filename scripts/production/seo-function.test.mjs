// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { respond } from '../../api/seo.js'

const env = {
  VITE_SITE_URL: 'https://www.clubdepescadores.com',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
}
const origin = 'https://www.clubdepescadores.com'
const template = `<!doctype html><html lang="es-AR"><head>
<!--seo:start--><title data-seo>Club</title><!--seo:end-->
<script type="module" src="/assets/index.js"></script></head><body><div id="root"></div></body></html>`
const newsId = '10000000-0000-4000-8000-000000000001'
const tournamentId = '60000000-0000-4000-8000-000000000001'

/** Fake network: the template, plus Supabase answers by path. */
function network(answers) {
  return vi.fn((input, init) => {
    const url = new URL(String(input))
    if (url.pathname === '/_app.html')
      return Promise.resolve(new Response(template))
    expect(init.headers.apikey).toBe('sb_publishable_test')
    const key = Object.keys(answers).find((path) => url.pathname.endsWith(path))
    const answer = key ? answers[key] : []
    if (answer instanceof Error) return Promise.reject(answer)
    return Promise.resolve(Response.json(answer))
  })
}
const call = (kind, id, answers) =>
  respond({ kind, id, origin, env, fetchImpl: network(answers) })

describe('server-rendered pages', () => {
  it('gives each news item its own title, description, image and structured data', async () => {
    const page = await call('news', newsId, {
      '/news': [
        {
          id: newsId,
          title: 'Gran pique de dorados',
          excerpt:
            'El sábado se sacaron dorados de más de 5 kilos <b>desde el muelle</b>.',
          published_at: '2026-11-10T12:00:00+00:00',
          updated_at: '2026-11-11T09:00:00+00:00',
          image_url:
            'https://example.supabase.co/storage/v1/object/public/news-images/a.webp',
          image_alt: 'Dorado recién sacado',
        },
      ],
    })
    expect(page.status).toBe(200)
    expect(page.body).toContain(
      '<title data-seo>Gran pique de dorados | Club de Pescadores San Nicolás</title>',
    )
    expect(page.body).toContain(
      `<link data-seo rel="canonical" href="${origin}/noticias/${newsId}" />`,
    )
    expect(page.body).toContain('property="og:type" content="article"')
    expect(page.body).toContain('news-images/a.webp')
    // Text from the database is escaped, never injected as markup.
    expect(page.body).toContain('&lt;b&gt;desde el muelle&lt;/b&gt;')
    expect(page.body).toContain('"@type":"NewsArticle"')
    // The club's confirmed address, hours and official profiles go with every page.
    expect(page.body).toContain('"streetAddress":"Leandro Alem 1352"')
    expect(page.body).toContain('"postalCode":"2900"')
    expect(page.body).toContain(
      'https://www.instagram.com/clubdepescadores.sn/',
    )
    expect(page.body).toContain('"opens":"00:00"')
    expect(page.body).toContain('"dateModified":"2026-11-11T09:00:00+00:00"')
    // The app still loads on top of it.
    expect(page.body).toContain('<script type="module" src="/assets/index.js">')
    expect(page.headers['Vercel-CDN-Cache-Control']).toContain('s-maxage=300')
  })

  it('answers a real 404 (not indexable) for missing or malformed ids', async () => {
    for (const id of [newsId, 'no-es-un-id', '../admin']) {
      const page = await call('news', id, { '/news': [] })
      expect(page.status).toBe(404)
      expect(page.body).toContain('content="noindex, follow"')
      expect(page.body).not.toContain('rel="canonical"')
    }
  })

  it('describes tournaments as sports events with their own dates and place', async () => {
    const page = await call('tournament', tournamentId, {
      '/tournaments': [
        {
          id: tournamentId,
          name: 'Tradicional 12 horas',
          place: 'Muelle del club',
          starts_on: '2026-11-28',
          ends_on: null,
          status: 'published',
          description: 'Categoría Mayores y Seniors.',
        },
      ],
    })
    expect(page.status).toBe(200)
    expect(page.body).toContain('"@type":"SportsEvent"')
    expect(page.body).toContain('"startDate":"2026-11-28"')
    expect(page.body).toContain('"name":"Muelle del club"')
    // A place of its own may not be at the club's street: no address is assumed.
    expect(page.body).not.toMatch(/"SportsEvent"[^<]*"streetAddress"/)
    expect(page.body).toContain(
      'content="Tradicional 12 horas: Categoría Mayores y Seniors."',
    )
  })

  it('places tournaments without a place of their own at the club', async () => {
    const page = await call('tournament', tournamentId, {
      '/tournaments': [
        {
          id: tournamentId,
          name: 'Torneo de verano',
          place: null,
          starts_on: '2027-01-10',
          ends_on: null,
          status: 'published',
          description: null,
        },
      ],
    })
    expect(page.body).toMatch(
      /"SportsEvent"[^<]*"name":"Club de Pescadores San Nicolás","address":\{"@type":"PostalAddress","streetAddress":"Leandro Alem 1352","postalCode":"2900"/,
    )
  })

  it('keeps the app working, with a 503 for crawlers, when Supabase fails', async () => {
    const page = await call('tournament', tournamentId, {
      '/tournaments': new Error('timeout'),
    })
    expect(page.status).toBe(503)
    expect(page.body).toContain('<div id="root">')
    expect(page.headers['Cache-Control']).toBe('no-store')
  })
})

describe('sitemap', () => {
  it('lists the fixed pages and every public news item, tournament and annual table', async () => {
    const result = await call('sitemap', '', {
      '/news': [
        {
          id: newsId,
          published_at: '2026-11-10T12:00:00+00:00',
          updated_at: '2026-11-12T12:00:00+00:00',
        },
      ],
      '/tournaments': [{ id: tournamentId }],
      '/rpc/annual_tables_public': [
        {
          id: '50000000-0000-4000-8000-000000000001',
          name: 'Anual',
          year: 2026,
        },
      ],
    })
    expect(result.status).toBe(200)
    expect(result.headers['Content-Type']).toContain('application/xml')
    for (const path of [
      '/',
      '/noticias',
      '/eventos',
      '/torneos',
      '/privacidad',
      `/torneos/${tournamentId}`,
      '/torneos/anual/50000000-0000-4000-8000-000000000001',
    ])
      expect(result.body).toContain(`<loc>${origin}${path}</loc>`)
    expect(result.body).toContain(
      `<loc>${origin}/noticias/${newsId}</loc><lastmod>2026-11-12</lastmod>`,
    )
    expect(result.body).not.toContain('/admin')
  })

  it('still lists the fixed pages when Supabase is down', async () => {
    const result = await call('sitemap', '', {
      '/news': new Error('down'),
      '/tournaments': new Error('down'),
      '/rpc/annual_tables_public': new Error('down'),
    })
    expect(result.status).toBe(200)
    expect(result.body).toContain(`<loc>${origin}/eventos</loc>`)
  })
})

describe('template origin', () => {
  // The template carries the page scripts and the answer is cached by the CDN, so
  // a forged X-Forwarded-Host must never choose where it comes from.
  const templateHost = async (requested, extraEnv = {}) => {
    const fetchImpl = network({})
    await respond({
      kind: 'news',
      id: newsId,
      origin: requested,
      env: { ...env, ...extraEnv },
      fetchImpl,
    })
    return new URL(String(fetchImpl.mock.calls[0][0])).origin
  }

  it('ignores hosts that are not the site or this deployment', async () => {
    expect(await templateHost('https://attacker.example')).toBe(origin)
    expect(await templateHost('http://www.clubdepescadores.com')).toBe(origin)
    expect(await templateHost('not a url')).toBe(origin)
    expect(await templateHost(undefined)).toBe(origin)
  })

  it('keeps serving previews from their own Vercel deployment', async () => {
    const preview = 'club-git-feature-club.vercel.app'
    expect(
      await templateHost(`https://${preview}`, { VERCEL_BRANCH_URL: preview }),
    ).toBe(`https://${preview}`)
    expect(
      await templateHost('https://club-abc123.vercel.app', {
        VERCEL_URL: 'club-abc123.vercel.app',
      }),
    ).toBe('https://club-abc123.vercel.app')
    expect(await templateHost('https://other.vercel.app')).toBe(origin)
  })
})
