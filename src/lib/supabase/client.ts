import { createClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'
import type { SupabaseEnvironment } from './config'

// Supply the generated Database type when the real schema is available.
// Until then, `never` prevents querying invented tables through an untyped client.
export function createPublicSupabaseClient<Database = never>(
  environment?: SupabaseEnvironment,
) {
  const { url, publishableKey } = readSupabaseConfig(environment)
  return createClient<Database>(url, publishableKey, {
    // Public content does not need to persist sessions or process auth callbacks.
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
