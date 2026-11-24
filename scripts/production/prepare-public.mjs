import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import sharp from 'sharp'
import {
  applyHead,
  breadcrumbsJsonLd,
  clubJsonLd,
  headTags,
} from '../../src/shared/seo/head.mjs'
import { PAGES } from '../../src/shared/seo/pages.mjs'
import { productionConfig } from './config.mjs'

const { siteUrl, url } = productionConfig()
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
const initialFiles = new Set()
function collect(key) {
  const chunk = manifest[key]
  if (!chunk || initialFiles.has(chunk.file)) return
  initialFiles.add(chunk.file)
  for (const dependency of chunk.imports ?? []) collect(dependency)
}
collect('index.html')
collect('src/pages/home/index.ts')
const adminChunk = manifest['src/pages/admin/index.tsx']?.file
if (!adminChunk || initialFiles.has(adminChunk)) {
  throw new Error(
    'The administrative page must remain a separate lazy-loaded entry.',
  )
}
let initialBytes = 0
for (const file of initialFiles) {
  if (file.endsWith('.js'))
    initialBytes += gzipSync(await readFile(`dist/${file}`)).length
}
if (initialBytes > 200_000)
  throw new Error(
    `Initial JavaScript exceeds 200 KB gzip: ${initialBytes} bytes`,
  )
console.log(
  `Initial home JavaScript: ${(initialBytes / 1000).toFixed(1)} KB gzip (budget: 200 KB).`,
)

// One HTML file per public page, so crawlers and link previews (WhatsApp, Facebook)
// get the right title, description and image without running JavaScript.
const template = await readFile('dist/index.html', 'utf8')
const club = clubJsonLd(siteUrl)
const assets = await readdir('dist/assets')
const asset = (name) => {
  const file = assets.find((entry) =>
    new RegExp(`^${name}-[\\w-]+\\.webp$`).test(entry),
  )
  if (!file) throw new Error(`No se encontró la imagen ${name} en dist/assets.`)
  return `/assets/${file}`
}
// The hero photo is the largest element of the home page: start it with the HTML
// instead of waiting for the app. Same files, sizes and breakpoint as HeroSection.
const heroPreload = [
  `<link rel="preload" as="image" href="${asset('hero-mobile')}" media="(max-width: 639px)" fetchpriority="high" />`,
  `<link rel="preload" as="image" imagesrcset="${asset('hero-960')} 960w, ${asset('hero-1920')} 1920w" imagesizes="max(100vw, 1330px)" media="(min-width: 640px)" fetchpriority="high" />`,
].join('\n    ')
// The fixed public pages also carry their rendered markup (src/entry-server.tsx), so the
// header, hero and headings paint before the JavaScript runs; the app then hydrates them.
const { render } = await import(pathToFileURL('dist-ssr/entry-server.js').href)
const withBody = async (html, path) => {
  const body = await render(path)
  if (!body.includes('<h1'))
    throw new Error(`El prerender de ${path} salió sin título.`)
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}
const page = (meta, extra = {}) =>
  applyHead(
    template,
    headTags({
      siteUrl,
      title: meta.title,
      description: meta.description,
      path: meta.path,
      ...extra,
    }),
    extra.preload ?? '',
  )
const section = (meta, name) =>
  page(meta, {
    jsonLd: [
      club,
      breadcrumbsJsonLd(siteUrl, [
        { name: 'Inicio', path: '/' },
        { name, path: meta.path },
      ]),
    ],
  })

// The bare template serves the panel and is the base the Vercel function fills in.
await writeFile('dist/_app.html', template)
await writeFile(
  'dist/index.html',
  await withBody(
    page(PAGES.home, { jsonLd: [club], preload: heroPreload }),
    '/',
  ),
)
await mkdir('dist/_pages', { recursive: true })
await writeFile(
  'dist/_pages/noticias.html',
  await withBody(section(PAGES.news, 'Noticias'), '/noticias'),
)
await writeFile(
  'dist/_pages/eventos.html',
  await withBody(section(PAGES.events, 'Eventos'), '/eventos'),
)
await writeFile(
  'dist/_pages/torneos.html',
  await withBody(section(PAGES.tournaments, 'Torneos'), '/torneos'),
)
await writeFile(
  'dist/_pages/privacidad.html',
  await withBody(section(PAGES.privacy, 'Privacidad'), '/privacidad'),
)
// Unknown addresses answer 404 with this page; the app then shows its own "not found".
await writeFile('dist/404.html', page(PAGES.notFound, { index: false }))

// The sitemap is served live by api/seo.js, so new news and tournaments appear at once.
await writeFile(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`,
)
// JPEG: every link preview service reads it (some still skip WebP).
await sharp('src/shared/assets/images/hero-1920.webp')
  .resize(1200, 630, { fit: 'cover' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('dist/og-image.jpg')
// Square logo for search results (Google asks for at least 112×112).
await sharp('src/shared/assets/images/logo-384.webp')
  .flatten({ background: '#ffffff' })
  .png()
  .toFile('dist/logo.png')

// The tracked Vercel configuration must allow the Supabase origin.
const vercel = JSON.parse(await readFile('vercel.json', 'utf8'))
const csp =
  vercel.routes
    ?.map((route) => route.headers?.['Content-Security-Policy'])
    .find(Boolean) ?? ''
if (!csp.includes(new URL(url).origin) || !csp.includes("script-src 'self'")) {
  throw new Error('Vercel CSP does not match the Supabase origin.')
}
for (const file of [
  'dist/index.html',
  'dist/_pages/noticias.html',
  'dist/404.html',
]) {
  const html = await readFile(file, 'utf8')
  if (
    !html.includes('<link data-seo rel="canonical"') &&
    !file.endsWith('404.html')
  )
    throw new Error(`${file} no tiene dirección canónica.`)
  if (!html.includes('<script type="module"'))
    throw new Error(`${file} perdió el script de la aplicación.`)
}
console.log(
  'Generated per-page HTML, 404 page, robots, social image and logo; Vercel CSP matches.',
)
// The rendered pages leave query-cache timers behind; nothing else is pending.
process.exit(0)
