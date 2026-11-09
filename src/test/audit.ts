export const auditRateData = {
  id: '30000000-0000-4000-8000-000000000001',
  season: 'Temporada de prueba',
  period: 'Día',
  family_price_cents: 123450,
  individual_price_cents: 0,
  family_description: 'Condiciones de prueba',
  discount_note: null,
  valid_from: '2026-11-01',
  valid_until: null,
  is_published: true,
  deleted_at: null,
  created_at: '2026-11-08T23:30:00Z',
  updated_at: '2026-11-08T23:30:00Z',
}
export const auditCreated = {
  id: '60000000-0000-4000-8000-000000000001',
  actor_id: '10000000-0000-4000-8000-000000000001',
  actor_email: 'admin@example.test',
  action: 'pool_rates.insert',
  resource_id: auditRateData.id,
  before_data: null,
  after_data: auditRateData,
  created_at: '2026-11-08T23:30:00Z',
}
export const auditUpdated = {
  ...auditCreated,
  id: '60000000-0000-4000-8000-000000000002',
  action: 'pool_rates.update',
  before_data: auditRateData,
  after_data: {
    ...auditRateData,
    family_price_cents: 123500,
    updated_at: '2026-11-08T23:31:00Z',
  },
  created_at: '2026-11-08T23:31:00Z',
}
export const auditDeleted = {
  ...auditCreated,
  action: 'pool_rates.delete',
  before_data: auditRateData,
  after_data: null,
}
