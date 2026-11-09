import { expect, it } from 'vitest'
import {
  auditCreated,
  auditDeleted,
  auditRateData,
  auditUpdated,
} from '@/test/audit'
import { auditDiff, auditValuesEqual } from './audit-diff'

it('compares only changed business fields and separates timestamp updates', () => {
  const diff = auditDiff(auditUpdated)
  expect(diff.mode).toBe('updated')
  expect(diff.changes).toEqual([
    {
      key: 'family_price_cents',
      label: 'Precio familiar',
      before: 123450,
      after: 123500,
    },
  ])
  expect(diff.technical.map((field) => field.key)).toEqual(['updated_at'])
})
it('handles creation and deletion without manufacturing an empty before or after snapshot', () => {
  expect(auditDiff(auditCreated).mode).toBe('created')
  expect(auditDiff(auditDeleted).mode).toBe('deleted')
  expect(auditDiff(auditCreated).changes[0]?.key).toBe('season')
  expect(
    auditDiff(auditCreated).changes.some((field) => field.key === 'id'),
  ).toBe(false)
})
it('compares object values independently of key order and preserves meaningful zero and false changes', () => {
  expect(auditValuesEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
  expect(auditValuesEqual([1, 2], [2, 1])).toBe(false)
  expect(auditValuesEqual(null, undefined)).toBe(true)
  expect(auditValuesEqual(false, null)).toBe(false)
  expect(auditValuesEqual(0, null)).toBe(false)
  expect(
    auditDiff({
      ...auditUpdated,
      after_data: { ...auditRateData, is_published: false },
    }).changes.map((field) => field.key),
  ).toEqual(['is_published'])
})
it('keeps assignment identifiers and malformed historical records out of the business comparison', () => {
  const diff = auditDiff({
    ...auditCreated,
    action: 'user_roles.insert',
    after_data: { user_id: 'user-ref', role_id: 'role-ref' },
  })
  expect(diff.changes).toEqual([])
  expect(diff.technical).toHaveLength(2)
  expect(
    auditDiff({ ...auditCreated, after_data: 'legacy payload' }).changes,
  ).toEqual([])
})
