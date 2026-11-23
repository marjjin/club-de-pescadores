import { useCallback, useEffect, useRef, useState } from 'react'
import { loadTurnstile, turnstileSiteKey } from '@/lib/turnstile'
import type { TurnstileApi } from '@/lib/turnstile'

/**
 * Turnstile widget for the login form. Tokens are single-use: call `reset` after every
 * attempt, successful or not, so the next one gets a fresh token.
 */
export function useCaptcha() {
  // A callback ref: the widget mounts once the container is in the DOM.
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const widget = useRef<{ api: TurnstileApi; id: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const sitekey = turnstileSiteKey
    if (!sitekey || !element) return
    let cancelled = false
    loadTurnstile().then(
      (api) => {
        if (cancelled) return
        const id = api.render(element, {
          sitekey,
          language: 'es',
          theme: 'light',
          // The flexible widget needs 300px; narrower phones get the compact one.
          size: element.clientWidth < 300 ? 'compact' : 'flexible',
          callback: (value) => {
            setFailed(false)
            setToken(value)
          },
          'expired-callback': () => setToken(null),
          'error-callback': () => {
            setToken(null)
            setFailed(true)
          },
        })
        widget.current = { api, id }
      },
      () => {
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
      widget.current?.api.remove(widget.current.id)
      widget.current = null
    }
  }, [element])

  const reset = useCallback(() => {
    setToken(null)
    widget.current?.api.reset(widget.current.id)
  }, [])

  return {
    required: turnstileSiteKey !== null,
    container: setElement,
    token,
    failed,
    reset,
  }
}
