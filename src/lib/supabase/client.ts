import { PostgrestClient } from '@supabase/postgrest-js'
import { readSupabaseConfig } from './config'
import type { SupabaseEnvironment } from './config'

/**
 * Read-only client for the public site. Visitors only query tables and RPCs, so it
 * uses the PostgREST part of Supabase alone: the full SDK (auth, realtime, storage)
 * would add about 50 KB gzip to every first visit. The admin panel keeps the full
 * client in its own lazy chunk.
 *
 * Supply the generated Database type; `never` prevents querying invented tables.
 */
export function createPublicSupabaseClient<Database = never>(
  environment?: SupabaseEnvironment,
) {
  const { url, publishableKey } = readSupabaseConfig(environment)
  // Publishable keys go only in the apikey header, never as a Bearer token.
  return new PostgrestClient<Database>(`${url}/rest/v1`, {
    headers: { apikey: publishableKey },
    // Looked up per request, like supabase-js, so the client never pins a stale fetch.
    fetch: (...args) => fetch(...args),
  })
}

/** Public URL of a file in a public Storage bucket, built without the Storage SDK. */
export function publicStorageUrl(
  bucket: string,
  path: string,
  environment?: SupabaseEnvironment,
) {
  const { url } = readSupabaseConfig(environment)
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encoded}`
}
