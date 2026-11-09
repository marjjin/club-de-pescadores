import { describe, expect, it } from 'vitest'
import { summarizeNews } from './summary'

describe('news summaries', () => {
  it('keeps short text and normalizes paragraph whitespace for cards', () => {
    expect(summarizeNews('  Primer párrafo.\n\nSegundo párrafo.  ')).toBe(
      'Primer párrafo. Segundo párrafo.',
    )
  })

  it('cuts long text at a word boundary and signals more content', () => {
    expect(
      summarizeNews('Una noticia con todos sus detalles para leer', 25),
    ).toBe('Una noticia con todos…')
  })

  it('bounds text without spaces without splitting Unicode characters', () => {
    expect(summarizeNews('🐟'.repeat(200))).toBe(`${'🐟'.repeat(160)}…`)
  })
})
