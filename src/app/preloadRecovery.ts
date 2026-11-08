const storageKey = 'club:preload-reload-at'
const cooldownMs = 60_000

// Recover stale lazy imports once; persistent failures must not cause a reload loop.
export function installPreloadRecovery(
  reload = () => window.location.reload(),
) {
  const recover = (event: Event) => {
    if (!navigator.onLine) return
    try {
      const previous = sessionStorage.getItem(storageKey)
      const now = Date.now()
      if (
        previous !== null &&
        Number.isFinite(Number(previous)) &&
        now - Number(previous) < cooldownMs
      )
        return
      sessionStorage.setItem(storageKey, String(now))
    } catch {
      // Without persistent storage, leave the error boundary available for manual retry.
      return
    }
    event.preventDefault()
    reload()
  }
  window.addEventListener('vite:preloadError', recover)
  return () => window.removeEventListener('vite:preloadError', recover)
}
