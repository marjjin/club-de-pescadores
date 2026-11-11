import { Check, Share2 } from 'lucide-react'
import { useState } from 'react'

export function ShareNewsButton({
  title,
  url,
}: {
  title: string
  url: string
}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  async function share() {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setStatus('copied')
    } catch (error) {
      // Closing the native share sheet is not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus('error')
    }
  }
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          void share()
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-navy-900/15 px-4 text-sm font-bold text-navy-900 transition-colors hover:bg-mist-50"
      >
        {status === 'copied' ? (
          <Check size={16} aria-hidden="true" className="text-river-600" />
        ) : (
          <Share2 size={16} aria-hidden="true" />
        )}
        Compartir
      </button>
      <p role="status" className="text-xs text-ink-600">
        {status === 'copied'
          ? 'Enlace copiado.'
          : status === 'error'
            ? 'No pudimos compartir. Copiá la dirección del navegador.'
            : ''}
      </p>
    </div>
  )
}
