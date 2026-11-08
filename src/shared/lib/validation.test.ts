import { expect, it, vi } from 'vitest'
import { z } from './validation'

it('validates external data without evaluating generated code under strict CSP', () => {
  const evaluate = vi.fn(() => {
    throw new EvalError('Blocked by CSP')
  })
  vi.stubGlobal('Function', evaluate)
  const schema = z.object({ title: z.string().min(1), count: z.number().int() })
  expect(schema.parse({ title: 'Valid', count: 2 })).toEqual({
    title: 'Valid',
    count: 2,
  })
  expect(schema.safeParse({ title: '', count: 1.5 }).success).toBe(false)
  expect(evaluate).not.toHaveBeenCalled()
})
