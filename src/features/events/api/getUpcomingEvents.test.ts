import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eventRows, mockResponse, requestUrl } from '@/test/content-api'
import { getEventsPage, getUpcomingEvents } from './getUpcomingEvents'
import { eventKeys } from './queries'

beforeEach(() => mockResponse(eventRows))
describe('remote upcoming events', () => {
  it('filters and bounds the remote request and maps Argentine dates and times', async () => {
    const events = await getUpcomingEvents({ from: '2026-11-15', limit: 1 })
    expect(events[0]).toMatchObject({
      title: 'Evento de prueba',
      startsOn: '2026-11-15',
      startsAt: '08:00',
    })
    const url = requestUrl(vi.mocked(fetch).mock.calls[0]?.[0])
    expect(url.searchParams.get('starts_at')).toBe(
      'gte.2026-11-15T00:00:00-03:00',
    )
    expect(url.searchParams.get('limit')).toBe('1')
    expect(url.searchParams.get('order')).toBe('starts_at.asc,id.asc')
    expect(url.searchParams.get('select')).toBe('id,title,starts_at,place')
  })
  it('includes the tie breaker in cursor requests and cache parameters', async () => {
    const first = await getEventsPage({ from: '2026-11-15', limit: 1 })
    expect(first.nextCursor).toEqual({
      startsAt: eventRows[0]!.starts_at,
      id: eventRows[0]!.id,
    })
    await getEventsPage({
      from: '2026-11-15',
      limit: 1,
      cursor: first.nextCursor!,
    })
    const url = requestUrl(vi.mocked(fetch).mock.calls.at(-1)?.[0])
    expect(url.searchParams.get('or')).toContain('id.gt.')
    expect(eventKeys.upcoming('2026-11-15', 1)).not.toEqual(
      eventKeys.upcoming('2026-11-16', 1),
    )
  })
  it('rejects invalid inputs, malformed responses and canceled requests', async () => {
    await expect(getUpcomingEvents({ from: 'invalid' })).rejects.toThrow()
    await expect(
      getUpcomingEvents({ from: '2026-11-15', limit: 51 }),
    ).rejects.toThrow(RangeError)
    expect(fetch).not.toHaveBeenCalled()
    const controller = new AbortController()
    controller.abort()
    await expect(
      getUpcomingEvents({ from: '2026-11-15', signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    mockResponse([{ ...eventRows[0], starts_at: 'invalid' }])
    await expect(getUpcomingEvents({ from: '2026-11-15' })).rejects.toThrow()
  })
  it('propagates remote errors without falling back to demo data', async () => {
    mockResponse({ code: 'PGRST205', message: 'Missing table' }, 404)
    await expect(
      getUpcomingEvents({ from: '2026-11-15' }),
    ).rejects.toMatchObject({ code: 'PGRST205' })
  })
})
