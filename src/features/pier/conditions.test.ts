import { expect, it } from 'vitest'
import { readConditions } from './conditions'

it('separates the fishing status, other quick phrases and free notes', () => {
  expect(
    readConditions('No se puede pescar, viento fuerte, crecida en la costa'),
  ).toEqual({
    fishing: { group: 'pesca', label: 'No se puede pescar', tone: 'bad' },
    others: [{ group: 'viento', label: 'Viento fuerte', tone: 'warn' }],
    notes: 'Crecida en la costa',
  })
  expect(readConditions('')).toEqual({ fishing: null, others: [], notes: null })
})
