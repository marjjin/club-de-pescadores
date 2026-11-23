// Cloudflare Turnstile, the CAPTCHA that Supabase Auth checks on sign-in and password
// recovery. The script is loaded only when the login screen needs it, so the public
// site never downloads it.
const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export type TurnstileOptions = {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
  language?: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
}

export type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/** Public site key; without it the panel signs in without CAPTCHA (local development). */
export const turnstileSiteKey =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || null

let loading: Promise<TurnstileApi> | null = null

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile)
      else reject(new Error('Turnstile no se inicializó.'))
    }
    script.onerror = () => {
      // A blocked or offline load can be retried by mounting the field again.
      loading = null
      script.remove()
      reject(new Error('No se pudo cargar Turnstile.'))
    }
    document.head.append(script)
  })
  return loading
}
