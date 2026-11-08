import { expect, it } from 'vitest'
import {
  initialEventValues,
  isPastEvent,
  validateEventEditor,
} from './event-editor'
import type { ClubEvent } from './schemas/admin'

const values = {
  title: 'Concurso',
  date: '2030-01-01',
  time: '15:30',
  place: 'Muelle',
  description: '',
  is_published: false,
}

it('splits a stored instant into Argentina date and time', () => {
  const row: ClubEvent = {
    id: '20000000-0000-4000-8000-000000000001',
    title: 'Concurso',
    place: 'Muelle',
    description: null,
    starts_at: '2030-01-01T02:00:00.000Z',
    is_published: true,
    deleted_at: null,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2020-01-01T00:00:00Z',
  }
  expect(initialEventValues(row)).toMatchObject({
    date: '2029-12-31',
    time: '23:00',
    is_published: true,
  })
})

it('converts Argentina local time to UTC on save', () => {
  const result = validateEventEditor(values)
  expect(result.success && result.data.starts_at).toBe(
    '2030-01-01T18:30:00.000Z',
  )
})

it('reports each missing field in Spanish', () => {
  const result = validateEventEditor({
    ...values,
    title: ' ',
    date: '',
    time: '',
    place: '',
  })
  expect(result.success).toBe(false)
  if (!result.success)
    expect(Object.keys(result.errors).sort()).toEqual([
      'date',
      'place',
      'time',
      'title',
    ])
})

it('detects past dates for the warning', () => {
  const now = new Date('2030-06-01T12:00:00Z')
  expect(isPastEvent(values, now)).toBe(true)
  expect(isPastEvent({ ...values, date: '2031-01-01' }, now)).toBe(false)
})

it('trims the optional description and stores empty text as null', () => {
  const empty = validateEventEditor({ ...values, description: '   ' })
  expect(empty.success && empty.data.description).toBeNull()
  const filled = validateEventEditor({ ...values, description: ' Traer caña ' })
  expect(filled.success && filled.data.description).toBe('Traer caña')
  const long = validateEventEditor({ ...values, description: 'a'.repeat(601) })
  expect(!long.success && long.errors.description).toBe(
    'La descripción admite hasta 600 caracteres.',
  )
})
