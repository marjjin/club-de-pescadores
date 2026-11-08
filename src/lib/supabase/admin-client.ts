import { createClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'
import type { Database } from './database.types'

function createAdminClient() {
  const { url, publishableKey } = readSupabaseConfig()
  return createClient<Database>(url, publishableKey, {
    auth: {
      storageKey: 'club-admin-auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  })
}

let client: ReturnType<typeof createAdminClient> | undefined
export function getAdminSupabase() {
  client ??= createAdminClient()
  return client
}
