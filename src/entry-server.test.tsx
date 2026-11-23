import { describe, expect, it, vi } from 'vitest'
import { render } from './entry-server'
import { mockContentApi } from '@/test/content-api'

class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('prerendered public pages', () => {
  it.each(['/', '/noticias', '/eventos', '/torneos'])(
    'keeps head tags out of the body of %s',
    async (path) => {
      mockContentApi()
      vi.stubGlobal('IntersectionObserver', Observer)
      const html = await render(path)
      // The served <head> already has them; a copy in <body> is invalid HTML and Google
      // ignores a canonical outside <head>. React 19 never hydrates these against the
      // container (it looks them up in the document), so removing them is safe.
      expect(html).not.toMatch(/<title|<meta|rel="canonical"/)
      expect(html).toMatch(/^<(?:link rel="preload"|!--|a )/)
      expect(html.match(/<h1/g)).toHaveLength(1)
    },
  )
})
