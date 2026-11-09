import { expect, it } from 'vitest'
import { auditCreated, auditRateData, auditUpdated } from '@/test/audit'
import { auditActor, auditPresentation, groupAuditDays } from './audit-entry'

it('identifies actual archive, restore and access changes while preserving the record title', () => {
  expect(auditPresentation(auditCreated)).toMatchObject({
    label: 'Creación',
    resource: 'Tarifa',
    title: 'Temporada de prueba · Día',
  })
  expect(
    auditPresentation({
      ...auditUpdated,
      after_data: {
        ...auditRateData,
        deleted_at: '2026-11-08T23:31:00Z',
        is_published: false,
      },
    }).kind,
  ).toBe('archived')
  expect(
    auditPresentation({
      ...auditUpdated,
      before_data: { ...auditRateData, deleted_at: '2026-11-08T23:00:00Z' },
    }).kind,
  ).toBe('restored')
  expect(
    auditPresentation({
      ...auditUpdated,
      action: 'admin_accounts.update',
      before_data: { active: true },
      after_data: { active: false },
    }).label,
  ).toBe('Acceso desactivado')
})
it('describes assignments and missing actors without inventing account names', () => {
  expect(
    auditPresentation({ ...auditCreated, action: 'user_roles.delete' }).label,
  ).toBe('Rol retirado')
  expect(auditActor({ ...auditCreated, actor_email: null })).toBe(
    'Cuenta no disponible',
  )
  expect(
    auditActor({ ...auditCreated, actor_id: null, actor_email: null }),
  ).toBe('Sistema o servicio')
})
it('describes scheduling relative to the recorded time and keeps later title edits as updates', () => {
  const publication = {
    title: 'Noticia de prueba',
    is_published: true,
    published_at: '2027-01-01T00:00:00Z',
  }
  expect(
    auditPresentation({
      ...auditCreated,
      action: 'news.insert',
      after_data: publication,
    }).kind,
  ).toBe('scheduled')
  expect(
    auditPresentation({
      ...auditUpdated,
      action: 'news.update',
      before_data: publication,
      after_data: { ...publication, title: 'Otro título' },
    }).kind,
  ).toBe('updated')
})
it('groups only the current page by the Argentina calendar date while keeping server order', () => {
  const entries = [
    { ...auditCreated, created_at: '2026-11-09T03:30:00Z' },
    { ...auditUpdated, created_at: '2026-11-09T01:30:00Z' },
    auditCreated,
  ]
  const groups = groupAuditDays(entries)
  expect(groups.map((group) => group.day)).toEqual(['2026-11-09', '2026-11-08'])
  expect(groups[1]?.entries).toEqual(entries.slice(1))
})
