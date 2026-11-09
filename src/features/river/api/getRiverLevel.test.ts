import { describe, expect, it, vi } from 'vitest'
import { mockResponse, requestUrl } from '@/test/content-api'
import { getRiverLevel } from './getRiverLevel'
import { riverRow } from '@/test/river'

describe('public river measurement query', () => {
  it('requests only the current published measurement with explicit columns and a bounded limit', async () => {
    mockResponse([])
    expect(await getRiverLevel()).toBeNull()
    const url = requestUrl(vi.mocked(fetch).mock.calls[0]?.[0])
    expect(url.pathname).toContain('/river_levels')
    expect(url.searchParams.get('id')).toBe('eq.1')
    expect(url.searchParams.get('is_published')).toBe('eq.true')
    expect(url.searchParams.get('limit')).toBe('1')
    expect(url.searchParams.get('measured_at')).toMatch(/^lte\./)
    expect(url.searchParams.get('select')).not.toContain('*')
    expect(url.searchParams.get('select')).not.toContain('note')
  })
  it('rejects invalid data, oversized responses and canceled requests', async () => {
    mockResponse([{ height_cm: 'invented' }])
    await expect(getRiverLevel()).rejects.toThrow()
    mockResponse([riverRow, riverRow])
    await expect(getRiverLevel()).rejects.toThrow()
    const controller = new AbortController()
    controller.abort()
    await expect(getRiverLevel(controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    })
  })
})
