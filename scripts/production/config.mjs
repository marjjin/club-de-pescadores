import { loadEnv } from 'vite'
import { readSupabaseConfig } from '../../src/lib/supabase/config.ts'

export function productionConfig() {
  const environment = {
    ...loadEnv('production', process.cwd(), 'VITE_'),
    ...process.env,
  }
  const supabase = readSupabaseConfig(environment)
  const site = new URL(environment.VITE_SITE_URL ?? '')
  if (
    site.protocol !== 'https:' ||
    site.username ||
    site.password ||
    site.pathname !== '/' ||
    site.search ||
    site.hash
  ) {
    throw new Error('VITE_SITE_URL debe ser el origen HTTPS público del sitio.')
  }
  for (const [name, value] of Object.entries(environment)) {
    if (
      name.startsWith('VITE_') &&
      (name.includes('SERVICE_ROLE') ||
        name.includes('SECRET') ||
        value?.startsWith('sb_secret_'))
    ) {
      throw new Error(
        `La variable pública ${name} no puede contener credenciales privadas.`,
      )
    }
  }
  const captcha = environment.VITE_TURNSTILE_SITE_KEY?.trim()
  // Cloudflare's test keys (1x…, 2x…, 3x…) always pass or always fail: never in production.
  if (captcha && !/^0x[\w-]{10,}$/.test(captcha)) {
    throw new Error(
      'VITE_TURNSTILE_SITE_KEY debe ser la clave pública de un widget real de Turnstile (empieza con 0x).',
    )
  }
  return { ...supabase, siteUrl: site.origin, turnstile: Boolean(captcha) }
}
