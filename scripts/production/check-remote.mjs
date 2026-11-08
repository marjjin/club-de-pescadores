import { createClient } from '@supabase/supabase-js'
import { productionConfig } from './config.mjs'

const config = productionConfig()
const client = createClient(config.url, config.publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
const columns = {
  events: 'id,title,starts_at,place',
  news: 'id,title,excerpt,published_at,image_url,image_alt',
  pool_rates:
    'id,season,period,family_price_cents,individual_price_cents,family_description,discount_note',
}
let failed = false
for (const [table, select] of Object.entries(columns)) {
  const { error, data } = await client
    .from(table)
    .select(select)
    .limit(1)
    .abortSignal(AbortSignal.timeout(12_000))
  if (error) {
    failed = true
    console.error(
      `${table}: no se pudo verificar la lectura pública (${error.code || 'network'}).`,
    )
  } else {
    console.log(
      `${table}: lectura pública correcta; ${data.length ? 'hay contenido visible' : 'sin contenido publicado'}.`,
    )
  }
}
if (failed) process.exitCode = 1
else
  console.log(
    'Remote schema reads succeeded. Privileged RLS and deployment verification remain separate checks.',
  )
