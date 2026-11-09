import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import {
  auditCreated,
  auditDeleted,
  auditRateData,
  auditUpdated,
} from '@/test/audit'
import { AuditChanges } from './AuditChanges'

it('renders created tariff fields as readable data without an empty before column or raw JSON', () => {
  const { container } = render(<AuditChanges entry={auditCreated} />)
  expect(
    screen.getByRole('heading', { name: 'Datos del registro creado' }),
  ).toBeTruthy()
  expect(screen.getByText('Precio familiar')).toBeTruthy()
  expect(screen.getByText(/1.234,50/)).toBeTruthy()
  expect(screen.getByText(/0,00/)).toBeTruthy()
  expect(screen.getByText('Publicado')).toBeTruthy()
  expect(screen.getByText('Sin fecha final')).toBeTruthy()
  expect(screen.queryByText('Antes')).toBeNull()
  expect(screen.queryByText('family_price_cents')).toBeNull()
  expect(screen.queryByText(/^null$/)).toBeNull()
  expect(container.querySelector('pre')).toBeNull()
})
it('shows only business changes and keeps technical details in a separate closed disclosure', () => {
  render(<AuditChanges entry={auditUpdated} />)
  expect(screen.getByText('1 campo modificado')).toBeTruthy()
  expect(screen.getByText(/1.234,50/)).toBeTruthy()
  expect(screen.getByText(/1.235,00/)).toBeTruthy()
  expect(screen.queryByText('Estado de publicación')).toBeNull()
  expect(screen.queryByText('Condiciones del grupo familiar')).toBeNull()
  const reference = screen.getByText(auditUpdated.id).closest('details')!
  expect(reference.open).toBe(false)
  fireEvent.click(screen.getByText('Referencias del registro'))
  expect(reference.open).toBe(true)
  expect(screen.getByText('pool_rates.update')).toBeTruthy()
})
it('shows deleted data without inventing an after value', () => {
  render(<AuditChanges entry={auditDeleted} />)
  expect(
    screen.getByRole('heading', { name: 'Datos del registro eliminado' }),
  ).toBeTruthy()
  expect(screen.queryByText('Después')).toBeNull()
  expect(screen.getByText(/1.234,50/)).toBeTruthy()
})
it('preserves text literally and exposes image links only after explicit user choice', () => {
  const { container } = render(
    <AuditChanges
      entry={{
        ...auditCreated,
        action: 'news.insert',
        after_data: {
          title: 'Prueba',
          excerpt: '<script>alert(1)</script>',
          image_url: 'https://example.test/photo.webp',
        },
      }}
    />,
  )
  expect(screen.getByText('<script>alert(1)</script>')).toBeTruthy()
  expect(container.querySelector('script')).toBeNull()
  expect(container.querySelector('img')).toBeNull()
  const link = screen.getByRole('link', {
    name: 'Abrir imagen en otra pestaña',
  })
  expect(link.getAttribute('href')).toBe('https://example.test/photo.webp')
  expect(link.getAttribute('rel')).toContain('noreferrer')
})
it('does not turn unsafe historical URLs into links and separates assignment identifiers', () => {
  const { rerender } = render(
    <AuditChanges
      entry={{
        ...auditCreated,
        after_data: { image_url: 'javascript:alert(1)' },
      }}
    />,
  )
  expect(screen.queryByRole('link')).toBeNull()
  rerender(
    <AuditChanges
      entry={{
        ...auditCreated,
        action: 'user_roles.insert',
        after_data: { user_id: 'user-reference', role_id: 'role-reference' },
      }}
    />,
  )
  const identifier = screen.getByText('role-reference')
  expect(identifier.closest('details')?.open).toBe(false)
  expect(
    screen.getByText(/Esta actividad registra una relación de acceso/),
  ).toBeTruthy()
  expect(screen.queryByText(auditRateData.season)).toBeNull()
})
