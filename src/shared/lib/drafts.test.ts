import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from '@/shared/lib/validation'
import { clearAllDrafts, readDraft, writeDraft } from './drafts'

const schema = z.object({ title: z.string() })
afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

describe('form drafts', () => {
  it('round-trips a valid draft and clears every draft on logout', () => {
    writeDraft('news:new', { title: 'Borrador' })
    expect(readDraft('news:new', schema)?.data).toEqual({ title: 'Borrador' })
    localStorage.setItem('other-app', 'keep')
    clearAllDrafts()
    expect(readDraft('news:new', schema)).toBeNull()
    expect(localStorage.getItem('other-app')).toBe('keep')
  })
  it('discards drafts that are malformed or older than a week', () => {
    localStorage.setItem('club-draft:bad', '{not json')
    expect(readDraft('bad', schema)).toBeNull()
    writeDraft('wrong', { title: 3 })
    expect(readDraft('wrong', schema)).toBeNull()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    writeDraft('old', { title: 'Viejo' })
    vi.setSystemTime(new Date('2026-01-09T00:00:00Z'))
    expect(readDraft('old', schema)).toBeNull()
    expect(localStorage.getItem('club-draft:old')).toBeNull()
  })
  it('keeps the form usable when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => writeDraft('news:new', { title: 'x' })).not.toThrow()
  })
})
