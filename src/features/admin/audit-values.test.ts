import { expect, it } from 'vitest'
import {
  auditFieldLabel,
  auditTimestamp,
  formatAuditValue,
} from './audit-values'

it('formats exact cent amounts, zero prices and negative river heights for readers', () => {
  expect(formatAuditValue('family_price_cents', 123450).text).toContain(
    '1.234,50',
  )
  expect(formatAuditValue('individual_price_cents', 0).text).toContain('0,00')
  expect(formatAuditValue('height_cm', -29).text).toBe('-0,29 m')
})
it('distinguishes booleans, empty text and null without showing raw database values', () => {
  expect(formatAuditValue('active', false).text).toBe('Desactivado')
  expect(formatAuditValue('is_published', true).text).toBe('Publicado')
  expect(formatAuditValue('is_published', false).text).toBe('Borrador')
  expect(formatAuditValue('valid_until', null).text).toBe('Sin fecha final')
  expect(formatAuditValue('note', null).text).toBe('Sin aclaración')
  expect(formatAuditValue('description', '').text).toBe('Texto vacío')
  expect(formatAuditValue('description', 'null').text).toBe('null')
})
it('preserves calendar dates and uses Argentina time in a 24-hour clock', () => {
  expect(auditTimestamp('2026-11-09T01:30:00Z', true)).toBe('22:30')
  expect(formatAuditValue('valid_from', '2026-11-01').text).toContain(
    '01 de noviembre',
  )
  expect(auditTimestamp('invalid')).toBe('Fecha no disponible')
})
it('labels permissions and references and permits only explicit HTTPS image links', () => {
  expect(formatAuditValue('permission_id', 'noticias.ver').text).toBe(
    'Ver noticias',
  )
  expect(formatAuditValue('user_id', 'test-id').kind).toBe('identifier')
  expect(
    formatAuditValue('image_url', 'https://example.test/photo.webp'),
  ).toMatchObject({ kind: 'link', href: 'https://example.test/photo.webp' })
  expect(formatAuditValue('image_url', 'javascript:alert(1)').kind).toBe('text')
})
it('renders unfamiliar values without JSON syntax or inherited object properties', () => {
  expect(formatAuditValue('extra', { active: false }).text).toBe(
    'Estado del acceso: No',
  )
  expect(formatAuditValue('extra', ['Uno', 'Dos']).text).toBe('Uno · Dos')
  expect(auditFieldLabel('extra_field')).toBe('Extra field')
  expect(formatAuditValue('constructor', null).text).toBe('Sin dato')
  expect(auditFieldLabel('constructor')).toBe('Constructor')
})
