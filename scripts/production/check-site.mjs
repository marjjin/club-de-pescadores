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
if (failures) {
  console.error(`Fallaron ${failures} comprobaciones del sitio publicado.`)
  process.exitCode = 1
} else
  console.log(
    `Sitio publicado verificado: rutas, caché, ${assets.size} archivos JS/CSS y rechazo 404 de módulos ausentes.`,
  )
