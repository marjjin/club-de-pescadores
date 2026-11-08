import { createUserHandler } from './handler.mjs'

Deno.serve(
  createUserHandler({
    url: Deno.env.get('SUPABASE_URL'),
    publicKey: Deno.env.get('SUPABASE_ANON_KEY'),
    serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    siteUrl: Deno.env.get('ADMIN_SITE_URL'),
  }),
)
