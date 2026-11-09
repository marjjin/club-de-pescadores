import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as data from '../../api/data'
import { auditCreated, auditUpdated } from '@/test/audit'
import { AuditSection } from '../AuditSection'

vi.mock('../../api/data', () => ({ listAdmin: vi.fn() }))
beforeEach(() => {
  vi.mocked(data.listAdmin).mockResolvedValue([auditUpdated, auditCreated])
})
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AuditSection userId="root-test" />
    </QueryClientProvider>,
  )
}
it('groups activity by day, shows the actor and preserves a read-only history without empty pagination', async () => {
  mount()
  await screen.findByText(
    '2 actividades en esta página · Más recientes primero',
  )
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
  expect(screen.getAllByText('admin@example.test')).toHaveLength(2)
  expect(screen.getByText('20:30')).toBeTruthy()
  expect(screen.getByText('Historial de solo lectura')).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull()
  expect(screen.queryByRole('button', { name: /Eliminar|Editar/ })).toBeNull()
  fireEvent.click(screen.getAllByText('Ver detalle')[0]!)
  expect(
    screen.getByRole('heading', { name: 'Cambios en este registro' }),
  ).toBeTruthy()
})
it('filters on section selection through the server and resets an empty result', async () => {
  vi.mocked(data.listAdmin).mockImplementation((_kind, filter) =>
    Promise.resolve(filter.search ? [] : [auditCreated]),
  )
  mount()
  await screen.findByText('1 actividad en esta página · Más recientes primero')
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Filtrar por sección' }),
    { target: { value: 'news.' } },
  )
  await screen.findByRole('heading', {
    name: 'No hay actividad para esta selección',
  })
  expect(data.listAdmin).toHaveBeenLastCalledWith(
    'audit',
    { cursor: null, state: 'all', search: 'news.' },
    expect.anything(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Ver toda la actividad' }))
  expect(
    await screen.findByText(
      '1 actividad en esta página · Más recientes primero',
    ),
  ).toBeTruthy()
  expect(
    screen.getByRole('combobox', { name: 'Filtrar por sección' }),
  ).toHaveProperty('value', '')
})
it('distinguishes a load error from an empty history and supports retry', async () => {
  vi.mocked(data.listAdmin).mockRejectedValueOnce(
    new Error('No se pudo consultar la actividad.'),
  )
  mount()
  await screen.findByRole('heading', { name: 'No pudimos cargar la actividad' })
  expect(
    screen.queryByRole('heading', {
      name: 'Todavía no hay actividad registrada',
    }),
  ).toBeNull()
  vi.mocked(data.listAdmin).mockResolvedValue([])
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar actividad' }))
  expect(
    await screen.findByRole('heading', {
      name: 'Todavía no hay actividad registrada',
    }),
  ).toBeTruthy()
})
it('renders only the cursor page and retains its section filter across pagination', async () => {
  const rows = Array.from({ length: 22 }, (_, index) => ({
    ...auditCreated,
    id: `60000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    after_data: { ...auditCreated.after_data, season: `Registro ${index + 1}` },
  }))
  vi.mocked(data.listAdmin).mockImplementation((_kind, filter) =>
    Promise.resolve(filter.cursor ? rows.slice(20) : rows.slice(0, 21)),
  )
  mount()
  await screen.findByRole('heading', { name: 'Registro 1 · Día' })
  fireEvent.change(
    screen.getByRole('combobox', { name: 'Filtrar por sección' }),
    { target: { value: 'pool_rates.' } },
  )
  const next = await screen.findByRole('button', { name: 'Siguiente' })
  await waitFor(() => expect(next).toHaveProperty('disabled', false))
  fireEvent.click(next)
  expect(
    await screen.findByRole('heading', { name: 'Registro 21 · Día' }),
  ).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Registro 1 · Día' })).toBeNull()
  const filter = vi.mocked(data.listAdmin).mock.calls.at(-1)?.[1]
  expect(filter?.search).toBe('pool_rates.')
  expect(filter?.cursor?.id).toBe(rows[19]?.id)
})
