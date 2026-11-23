import { productionConfig } from './config.mjs'

const { turnstile } = productionConfig()
if (!turnstile) {
  console.warn(
    'Sin VITE_TURNSTILE_SITE_KEY: el panel ingresa sin CAPTCHA. Si el CAPTCHA está activo en Supabase Auth, el ingreso va a fallar.',
  )
}
console.log('Public production configuration is valid.')
