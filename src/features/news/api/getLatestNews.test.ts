import { beforeEach, describe, expect, it, vi } from 'vitest'
import { newsRows, mockResponse, requestUrl } from '@/test/content-api'
import { getLatestNews, getNewsPage } from './getLatestNews'

beforeEach(() => mockResponse(newsRows))
describe('remote news', () => {
  it('requests only published data in stable descending order', async () => {
    expect(await getLatestNews({ limit: 2 })).toMatchObject([
      { title: 'Noticia de prueba', publishedOn: '2026-10-12' },
    ])
    const url = requestUrl(vi.mocked(fetch).mock.calls[0]?.[0])
    expect(url.searchParams.get('limit')).toBe('2')
    expect(url.searchParams.get('order')).toBe('published_at.desc,id.desc')
    expect(url.searchParams.get('is_published')).toBe('eq.true')
    expect(url.searchParams.get('deleted_at')).toBe('is.null')
    expect(url.searchParams.get('published_at')).toMatch(/^lte\./)
    expect(url.searchParams.get('select')).not.toContain('*')
  })
  it('validates cursors before using PostgREST filters', async () => {
    const page = await getNewsPage({ limit: 1 })
    await getNewsPage({ cursor: page.nextCursor! })
    const url = requestUrl(vi.mocked(fetch).mock.calls.at(-1)?.[0])
    expect(url.searchParams.get('or')).toContain('id.lt.')
    await expect(
      getNewsPage({ cursor: { publishedAt: 'invalid', id: 'invalid' } }),
    ).rejects.toThrow()
  })
  it('rejects unsafe URLs, oversized and canceled requests', async () => {
    await expect(getLatestNews({ limit: 51 })).rejects.toThrow(RangeError)
    const controller = new AbortController()
    controller.abort()
    await expect(
      getLatestNews({ signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    mockResponse([{ ...newsRows[0], image_url: 'javascript:alert(1)' }])
    await expect(getLatestNews()).rejects.toThrow()
  })
})
