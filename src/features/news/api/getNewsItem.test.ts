import { describe, expect, it, vi } from 'vitest'
import { mockResponse, newsRows, requestUrl } from '@/test/content-api'
import { getNewsItem } from './getNewsItem'

const id = newsRows[0]!.id

describe('public news detail', () => {
  it('fetches one publication by ID with all public visibility filters', async () => {
    mockResponse(newsRows)
    expect(await getNewsItem(id)).toMatchObject({
      id,
      title: 'Noticia de prueba',
      excerpt: 'Contenido de prueba',
    })
    const url = requestUrl(vi.mocked(fetch).mock.calls[0]?.[0])
    expect(url.searchParams.get('id')).toBe(`eq.${id}`)
    expect(url.searchParams.get('limit')).toBe('1')
    expect(url.searchParams.get('is_published')).toBe('eq.true')
    expect(url.searchParams.get('deleted_at')).toBe('is.null')
    expect(url.searchParams.get('published_at')).toMatch(/^lte\./)
    expect(url.searchParams.get('select')).not.toContain('*')
  })

  it('does not request invalid IDs and returns null for unavailable content', async () => {
    mockResponse([])
    expect(await getNewsItem('invalid,id.eq.something')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    expect(await getNewsItem(id)).toBeNull()
  })

  it('rejects canceled requests, unsafe responses and server errors', async () => {
    mockResponse(newsRows)
    const controller = new AbortController()
    controller.abort()
    await expect(getNewsItem(id, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    })
    expect(fetch).not.toHaveBeenCalled()
    mockResponse([{ ...newsRows[0], image_url: 'javascript:alert(1)' }])
    await expect(getNewsItem(id)).rejects.toThrow()
    mockResponse({ message: 'internal error' }, 500)
    await expect(getNewsItem(id)).rejects.toThrow()
  })
})
