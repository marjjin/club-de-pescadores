import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import sharp from 'sharp'
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
let html = await readFile('dist/index.html', 'utf8')
const structured = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SportsClub',
  name: 'Club de Pescadores San Nicolás',
  url: siteUrl,
})
const hash = createHash('sha256').update(structured).digest('base64')
html = html.replace(
  '</head>',
  `<meta property="og:url" content="${siteUrl}/"><meta property="og:image" content="${siteUrl}/og-image.webp"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${structured}</script></head>`,
)
await writeFile('dist/index.html', html)
const paths = ['', '/noticias', '/eventos', '/torneos']
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((route) => `<url><loc>${siteUrl}${route || '/'}</loc></url>`).join('')}</urlset>\n`,
)
await writeFile(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl}/sitemap.xml\n`,
)
await sharp('src/shared/assets/images/hero-1920.webp')
  .resize(1200, 630, { fit: 'cover' })
  .webp({ quality: 80 })
  .toFile('dist/og-image.webp')
// The tracked Vercel configuration must authorize the exact structured-data block.
const vercel = JSON.parse(await readFile('vercel.json', 'utf8'))
const csp =
  vercel.headers
    .flatMap((entry) => entry.headers)
    .find((header) => header.key === 'Content-Security-Policy')?.value ?? ''
if (!csp.includes(`'sha256-${hash}'`) || !csp.includes(new URL(url).origin)) {
  throw new Error(
    'Vercel CSP does not match the production metadata or Supabase origin.',
  )
}
console.log(
  'Generated sitemap, robots, social image and structured data; Vercel CSP matches.',
)
