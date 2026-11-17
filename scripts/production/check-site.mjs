import { productionConfig } from './config.mjs'

const { siteUrl } = productionConfig()
async function request(path) {
  return fetch(`${siteUrl}${path}`, {
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(15_000),
  })
}
let failures = 0
for (const path of [
  '/',
  '/index.html',
  '/noticias',
  '/eventos',
  '/admin',
  '/admin/cuenta',
]) {
  const response = await request(path)
  const cache = response.headers.get('cache-control') ?? ''
  const valid =
    response.ok &&
    response.headers.get('content-type')?.includes('text/html') &&
    (path.startsWith('/admin')
      ? cache.includes('no-store')
      : cache.includes('no-cache'))
  if (!valid) {
    console.error(
      `${path}: HTML o caché incorrectos (HTTP ${response.status}).`,
    )
    failures++
  }
}
const manifestResponse = await request('/.vite/manifest.json')
if (
  !manifestResponse.ok ||
  !manifestResponse.headers.get('content-type')?.includes('application/json')
)
  throw new Error('No se pudo leer el manifiesto publicado.')
const manifest = await manifestResponse.json()
const assets = new Set(
  Object.values(manifest)
    .flatMap((chunk) => [chunk.file, ...(chunk.css ?? [])])
    .filter((file) => /\.(js|css)$/.test(file)),
)
const results = await Promise.all(
  [...assets].map(async (file) => {
    const response = await request(`/${file}`)
    const type = response.headers.get('content-type') ?? ''
    const body = await response.text()
    const valid =
      response.ok &&
      (file.endsWith('.js')
        ? /(?:java|ecma)script/.test(type)
        : type.includes('text/css')) &&
      !/^\s*<!doctype html/i.test(body)
    return { file, valid, status: response.status }
  }),
)
for (const { file, valid, status } of results) {
  if (!valid) {
    console.error(
      `${file}: recurso ausente o MIME incorrecto (HTTP ${status}).`,
    )
    failures++
  }
}
const missing = await request('/assets/__missing_module_check__.js')
if (missing.status !== 404) {
  console.error(
    `Un módulo inexistente debe responder 404, recibió HTTP ${missing.status}.`,
  )
  failures++
}
// Search engines: real 404s, a live sitemap, robots and per-page titles in the HTML.
for (const path of ['/esta-pagina-no-existe', '/noticias/no-es-un-id']) {
  const response = await request(path)
  if (response.status !== 404) {
    console.error(
      `${path}: debe responder 404, recibió HTTP ${response.status}.`,
    )
    failures++
  }
}
const sitemap = await request('/sitemap.xml')
const sitemapBody = await sitemap.text()
if (!sitemap.ok || !sitemapBody.includes(`<loc>${siteUrl}/noticias</loc>`)) {
  console.error(`/sitemap.xml: incompleto o caído (HTTP ${sitemap.status}).`)
  failures++
}
const robots = await (await request('/robots.txt')).text()
if (
  !robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`) ||
  /^Disallow: \/\s*$/m.test(robots)
) {
  console.error('/robots.txt: no apunta al sitemap o bloquea todo el sitio.')
  failures++
}
for (const [path, title] of [
  ['/', 'Club de Pescadores San Nicolás | Pesca'],
  ['/noticias', 'Noticias del club'],
  ['/torneos', 'Torneos de pesca'],
]) {
  const html = await (await request(path)).text()
  const canonical = `rel="canonical" href="${siteUrl}${path}"`
  if (!html.includes(title) || !html.includes(canonical)) {
    console.error(`${path}: el HTML no trae su título o su dirección canónica.`)
    failures++
  }
}
if (failures) {
  console.error(`Fallaron ${failures} comprobaciones del sitio publicado.`)
  process.exitCode = 1
} else
  console.log(
    `Sitio publicado verificado: rutas, caché, ${assets.size} archivos JS/CSS y rechazo 404 de módulos ausentes.`,
  )
