export type SupabaseEnvironment = {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

export type SupabaseConfig = {
  readonly url: string
  readonly publishableKey: string
}

export function readSupabaseConfig(
  environment: SupabaseEnvironment = import.meta.env,
): SupabaseConfig {
  const url = environment.VITE_SUPABASE_URL?.trim()
  const publishableKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !publishableKey) {
    throw new Error(
      'Configurá VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY para conectar Supabase.',
    )
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('VITE_SUPABASE_URL debe ser una URL válida de Supabase.')
  }

  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  const secure =
    parsed.protocol === 'https:' || (isLocal && parsed.protocol === 'http:')
  if (
    !secure ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'VITE_SUPABASE_URL debe usar HTTPS, o HTTP en localhost, sin credenciales ni parámetros.',
    )
  }

  if (
    !publishableKey.startsWith('sb_publishable_') ||
    publishableKey === 'sb_publishable_' ||
    /\s/.test(publishableKey)
  ) {
    throw new Error(
      'VITE_SUPABASE_PUBLISHABLE_KEY debe ser una clave pública publishable válida de Supabase.',
    )
  }

  return { url: parsed.href.replace(/\/$/, ''), publishableKey }
}
