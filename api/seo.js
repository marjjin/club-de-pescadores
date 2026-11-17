// Vercel function for the pages whose content lives in Supabase: each news item,
// tournament and annual table gets its own title, description, image and structured
// data in the HTML itself, and missing ones answer a real 404. It also serves the
// sitemap, always current. Only public data, read with the publishable key under RLS.
import {
  applyHead,
  breadcrumbsJsonLd,
  clubJsonLd,
  headTags,
  newsArticleJsonLd,
  tournamentJsonLd,
} from '../src/shared/seo/head.mjs'
import {
  PAGES,
  annualTableDescription,
  annualTableTitle,
  clip,
  pageTitle,
  tournamentDescription,
} from '../src/shared/seo/pages.mjs'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Browsers revalidate; Vercel's CDN keeps a copy for a few minutes.
const fresh = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control':
    'public, s-maxage=300, stale-while-revalidate=86400',
}
const missing = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
}

function settings(env) {
  const site = new URL(env.VITE_SITE_URL ?? '').origin
  const supabase = new URL(env.VITE_SUPABASE_URL ?? '').origin
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!key) throw new Error('Falta VITE_SUPABASE_PUBLISHABLE_KEY.')
  return { site, supabase, key }
}

async function rest(config, fetchImpl, path, body) {
  const response = await fetchImpl(`${config.supabase}/rest/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      apikey: config.key,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(4000),
  })
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}.`)
  return response.json()
}

const crumbs = (site, items) =>
  breadcrumbsJsonLd(site, [{ name: 'Inicio', path: '/' }, ...items])

/** The head for one content page, or null when it is not public. */
async function contentHead(kind, id, config, fetchImpl, now) {
  const { site } = config
  const club = clubJsonLd(site)
  if (kind === 'news') {
    const [news] = await rest(
      config,
      fetchImpl,
      `news?select=id,title,excerpt,published_at,updated_at,image_url,image_alt&id=eq.${id}&is_published=eq.true&deleted_at=is.null&published_at=lte.${encodeURIComponent(now.toISOString())}&limit=1`,
    )
    if (!news) return null
    const description = clip(news.excerpt)
    const path = `/noticias/${news.id}`
    return headTags({
      siteUrl: site,
      title: pageTitle(news.title),
      description,
      path,
      type: 'article',
      image: news.image_url,
      imageAlt: news.image_alt,
      publishedTime: news.published_at,
      jsonLd: [
        club,
        newsArticleJsonLd(site, {
          id: news.id,
          title: news.title,
          description,
          publishedAt: news.published_at,
          updatedAt: news.updated_at,
          image: news.image_url,
        }),
        crumbs(site, [
          { name: 'Noticias', path: '/noticias' },
          { name: news.title, path },
        ]),
      ],
    })
  }
  if (kind === 'tournament') {
    const [tournament] = await rest(
      config,
      fetchImpl,
      `tournaments?select=id,name,place,starts_on,ends_on,status,description&id=eq.${id}&status=in.(published,finished)&limit=1`,
    )
    if (!tournament) return null
    const path = `/torneos/${tournament.id}`
    return headTags({
      siteUrl: site,
      title: pageTitle(tournament.name),
      description: tournamentDescription(tournament),
      path,
      jsonLd: [
        club,
        tournamentJsonLd(site, {
          id: tournament.id,
          name: tournament.name,
          place: tournament.place,
          startsOn: tournament.starts_on,
          endsOn: tournament.ends_on,
          description: tournament.description
            ? clip(tournament.description, 500)
            : null,
        }),
        crumbs(site, [
          { name: 'Torneos', path: '/torneos' },
          { name: tournament.name, path },
        ]),
      ],
    })
  }
  const table = await rest(config, fetchImpl, 'rpc/annual_table_get', {
    p_id: id,
  })
  if (!table) return null
  const path = `/torneos/anual/${table.id}`
  return headTags({
    siteUrl: site,
    title: annualTableTitle(table),
    description: annualTableDescription(table),
    path,
    jsonLd: [
      club,
      crumbs(site, [
        { name: 'Torneos', path: '/torneos' },
        { name: `${table.name} ${table.year}`, path },
      ]),
    ],
  })
}

const missingTitles = {
  news: 'Noticia no disponible',
  tournament: 'Torneo no disponible',
  annual: 'Tabla anual no disponible',
}

async function page(kind, id, origin, config, fetchImpl, now) {
  const templateResponse = await fetchImpl(`${origin}/_app.html`, {
    signal: AbortSignal.timeout(4000),
  })
  if (!templateResponse.ok) throw new Error('No se pudo leer la plantilla.')
  const template = await templateResponse.text()
  let head
  try {
    head = UUID.test(id)
      ? await contentHead(kind, id.toLowerCase(), config, fetchImpl, now)
      : null
  } catch (error) {
    // Supabase is down for a moment: people still get the app (it retries on its own),
    // while 503 tells crawlers to come back instead of indexing an error.
    console.error('seo:', error instanceof Error ? error.message : error)
    return {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '120' },
      body: template,
    }
  }
  if (head)
    return { status: 200, headers: fresh, body: applyHead(template, head) }
  return {
    status: 404,
    headers: missing,
    body: applyHead(
      template,
      headTags({
        siteUrl: config.site,
        title: pageTitle(missingTitles[kind]),
        description: PAGES.notFound.description,
        path: PAGES.notFound.path,
        index: false,
      }),
    ),
  }
}

const xmlEscape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

async function sitemap(config, fetchImpl, now) {
  const { site } = config
  const entries = [PAGES.home, PAGES.news, PAGES.events, PAGES.tournaments].map(
    (meta) => ({ path: meta.path }),
  )
  // One failing list still leaves the others (and the fixed pages) in the sitemap.
  const lists = await Promise.allSettled([
    rest(
      config,
      fetchImpl,
      `news?select=id,published_at,updated_at&is_published=eq.true&deleted_at=is.null&published_at=lte.${encodeURIComponent(now.toISOString())}&order=published_at.desc&limit=1000`,
    ),
    rest(
      config,
      fetchImpl,
      'tournaments?select=id&status=in.(published,finished)&order=starts_on.desc&limit=1000',
    ),
    rest(config, fetchImpl, 'rpc/annual_tables_public', {}),
  ])
  const [news, tournaments, annual] = lists.map((list) =>
    list.status === 'fulfilled' && Array.isArray(list.value) ? list.value : [],
  )
  for (const item of news)
    entries.push({
      path: `/noticias/${item.id}`,
      lastmod: (item.updated_at ?? item.published_at)?.slice(0, 10),
    })
  for (const item of tournaments) entries.push({ path: `/torneos/${item.id}` })
  for (const item of annual) entries.push({ path: `/torneos/anual/${item.id}` })
  const urls = entries
    .map(
      ({ path, lastmod }) =>
        `<url><loc>${xmlEscape(`${site}${path}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    )
    .join('')
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control':
        'public, s-maxage=3600, stale-while-revalidate=86400',
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`,
  }
}

/** Pure entry point, tested without Vercel: returns status, headers and body. */
export async function respond({
  kind,
  id = '',
  origin,
  env = process.env,
  fetchImpl = fetch,
  now = new Date(),
}) {
  try {
    const config = settings(env)
    if (kind === 'sitemap') return await sitemap(config, fetchImpl, now)
    if (!['news', 'tournament', 'annual'].includes(kind))
      return { status: 404, headers: missing, body: 'No encontrado' }
    return await page(
      kind,
      String(id),
      origin ?? config.site,
      config,
      fetchImpl,
      now,
    )
  } catch (error) {
    // Not even the template could be read: ask crawlers to come back later.
    console.error('seo:', error instanceof Error ? error.message : error)
    return {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '120' },
      body: 'El sitio no está disponible en este momento. Probá de nuevo en unos minutos.',
    }
  }
}

export default async function handler(request, response) {
  const host = request.headers['x-forwarded-host'] ?? request.headers.host
  const result = await respond({
    kind: request.query.kind,
    id: request.query.id,
    origin: host ? `https://${String(host).split(',')[0].trim()}` : undefined,
  })
  response.status(result.status)
  response.setHeader(
    'Content-Type',
    result.headers['Content-Type'] ?? 'text/html; charset=utf-8',
  )
  for (const [name, value] of Object.entries(result.headers))
    if (name !== 'Content-Type') response.setHeader(name, value)
  response.send(result.body)
}
