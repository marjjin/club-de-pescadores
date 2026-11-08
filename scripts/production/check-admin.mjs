import { productionConfig } from './config.mjs'

const { url, publishableKey } = productionConfig()
const headers = { apikey: publishableKey, 'Content-Type': 'application/json' }
const checks = [
  [
    'contexto administrativo',
    '/rest/v1/rpc/admin_context',
    { method: 'POST', body: '{}' },
  ],
  ['usuarios', '/rest/v1/admin_accounts?select=id&limit=1', {}],
  ['roles', '/rest/v1/roles?select=id&limit=1', {}],
  ['auditoría', '/rest/v1/audit_logs?select=id&limit=1', {}],
]
let failed = false
for (const [label, path, options] of checks) {
  try {
    const response = await fetch(`${url}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(12000),
    })
    const body = await response.json()
    if (![401, 403].includes(response.status) || body?.code !== '42501') {
      failed = true
      console.error(
        `${label}: no se pudo verificar denegación anónima del endpoint instalado (HTTP ${response.status}).`,
      )
    } else console.log(`${label}: existe y deniega el acceso anónimo.`)
  } catch {
    failed = true
    console.error(`${label}: no se pudo conectar.`)
  }
}
if (failed) process.exitCode = 1
else
  console.log(
    'La verificación anónima pasó. Falta probar una sesión real con MFA y sus permisos.',
  )
