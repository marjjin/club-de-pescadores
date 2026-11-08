import { createPublicSupabaseClient } from './client'
import type { Database } from './database.types'

let client: ReturnType<typeof createPublicSupabaseClient<Database>> | undefined

export function getSupabase() {
  client ??= createPublicSupabaseClient<Database>()
  return client
}
