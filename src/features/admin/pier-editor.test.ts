import { describe, expect, it } from 'vitest'
import {
  conditionGroups,
  hasCondition,
  riverHeightToCm,
  toggleCondition,
  validatePierReport,
} from './pier-editor'
import type { UploadedMedia } from './api/media'

const owner = '10000000-0000-4000-8000-000000000010'
const image = (n: number): UploadedMedia => ({
  kind: 'image',
  path: `${owner}/2000000${n}-0000-4000-8000-000000000000.webp`,
  width: 1600,
  height: 1200,
})
const video = (n: number): UploadedMedia => ({
  kind: 'video',
  path: `${owner}/3000000${n}-0000-4000-8000-000000000000.mp4`,
  poster_path: `${owner}/3000000${n}-0000-4000-8000-000000000000.webp`,
  width: 1280,
  height: 720,
})
const now = new Date('2026-11-11T13:30:00Z')

describe('pier report form', () => {
  it('converts metres exactly and rejects ambiguous separators', () => {
    expect(riverHeightToCm('3,30')).toBe(330)
    expect(riverHeightToCm('-0.29')).toBe(-29)
    expect(riverHeightToCm('0')).toBe(0)
    for (const value of ['', '1.234,50', '2,345', '1e2', '-100,01'])
      expect(riverHeightToCm(value)).toBeNull()
  })

  it('takes the measurement time at publication and describes every photo', () => {
    const result = validatePierReport(
      { height: '3,30', conditions: '  Agua clara  ' },
      [image(1), video(2)],
      now,
    )
    expect(result).toMatchObject({
      success: true,
      data: {
        height_cm: 330,
        measured_at: '2026-11-11T13:30:00.000Z',
        conditions: 'Agua clara',
        media: [
          {
            kind: 'image',
            alt: 'Muelle del club, parte del 11/11/2026, 10:30',
          },
          {
            kind: 'video',
            alt: 'Muelle del club, parte del 11/11/2026, 10:30',
          },
        ],
      },
    })
  })

  it('accepts a report with only the height and stores empty conditions as null', () => {
    expect(
      validatePierReport({ height: '2', conditions: '   ' }, [], now),
    ).toMatchObject({ success: true, data: { conditions: null, media: [] } })
  })

  it('explains invalid heights, long conditions and too many videos', () => {
    const result = validatePierReport(
      { height: 'tres', conditions: 'x'.repeat(601) },
      [video(1), video(2), video(3), video(4)],
      now,
    )
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.height).toContain('metros')
    expect(result.errors.conditions).toContain('600')
    expect(result.errors.media).toContain('3 videos')
  })
})

describe('quick condition phrases', () => {
  const [pesca, camalotes] = conditionGroups
  it('keeps one choice per group and never confuses opposite phrases', () => {
    let text = toggleCondition('', pesca, 'Se puede pescar')
    expect(text).toBe('Se puede pescar')
    text = toggleCondition(text, camalotes, 'Pocos camalotes')
    expect(text).toBe('Se puede pescar, pocos camalotes')
    text = toggleCondition(text, pesca, 'No se puede pescar')
    expect(text).toBe('Pocos camalotes, no se puede pescar')
    expect(hasCondition(text, 'Se puede pescar')).toBe(false)
    expect(hasCondition(text, 'No se puede pescar')).toBe(true)
  })
  it('clears a chosen phrase and preserves what staff typed', () => {
    const text = toggleCondition(
      'Mucha gente en el muelle',
      pesca,
      'Se puede pescar',
    )
    expect(text).toBe('Mucha gente en el muelle, se puede pescar')
    expect(toggleCondition(text, pesca, 'Se puede pescar')).toBe(
      'Mucha gente en el muelle',
    )
  })
})
