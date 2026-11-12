import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import * as data from '../../api/data'
import { accessAccount, accessViewer } from '@/test/admin-access'
import { UsersSection } from '../UsersSection'

vi.mock('../../api/data', () => ({
  listAdmin: vi.fn(),
  inviteUser: vi.fn(),
  saveUser: vi.fn(),
  removeUser: vi.fn(),
}))
const accounts = [
  accessAccount,
  {
    ...accessAccount,
    id: accessViewer,
    email: 'root@example.test',
    active: false,
  },
]
beforeEach(() => {
  vi.mocked(data.listAdmin).mockResolvedValue(accounts)
})
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UsersSection userId={accessViewer} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
it('distinguishes account state, singular roles and the protected current account without unnecessary pagination', async () => {
  mount()
  await screen.findByRole('heading', { name: 'team@example.test' })
  expect(screen.getByText('Activo')).toBeTruthy()
  expect(screen.getByText('Desactivado')).toBeTruthy()
  expect(screen.getAllByText('1 rol asignado')).toHaveLength(2)
  expect(
    screen.getByRole('link', { name: 'Mi cuenta' }).getAttribute('href'),
  ).toBe('/admin/cuenta')
  expect(
    screen.queryByRole('button', {
      name: 'Gestionar acceso de root@example.test',
    }),
  ).toBeNull()
  expect(
    screen.getByRole('button', {
      name: 'Gestionar acceso de team@example.test',
    }),
  ).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull()
  expect(
    screen.getByText('2 usuarios en esta página · Más recientes primero'),
  ).toBeTruthy()
})
it('applies the server prefix search only on submission and clears filters from the empty state', async () => {
  vi.mocked(data.listAdmin).mockImplementation((_kind, filter) =>
    Promise.resolve(filter.search ? [] : accounts),
  )
  mount()
  await screen.findByRole('heading', { name: 'team@example.test' })
  const initialCalls = vi.mocked(data.listAdmin).mock.calls.length
  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Buscar por inicio del correo' }),
    { target: { value: ' unknown ' } },
  )
  expect(data.listAdmin).toHaveBeenCalledTimes(initialCalls)
  fireEvent.submit(screen.getByRole('search', { name: 'Buscar usuarios' }))
  await screen.findByRole('heading', { name: 'No encontramos usuarios' })
  expect(data.listAdmin).toHaveBeenLastCalledWith(
    'users',
    { cursor: null, state: 'all', search: 'unknown' },
    expect.anything(),
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Ver todos los usuarios' }),
  )
  expect(
    await screen.findByRole('heading', { name: 'team@example.test' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('searchbox', { name: 'Buscar por inicio del correo' }),
  ).toHaveProperty('value', '')
})
it('shows a recoverable load error separately from an empty team', async () => {
  vi.mocked(data.listAdmin).mockRejectedValueOnce(
    new Error('No se pudo consultar el equipo.'),
  )
  mount()
  await screen.findByRole('heading', { name: 'No pudimos cargar los usuarios' })
  expect(screen.queryByRole('heading', { name: 'Sumá a tu equipo' })).toBeNull()
  vi.mocked(data.listAdmin).mockResolvedValue([])
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar usuarios' }))
  expect(
    await screen.findByRole('heading', { name: 'Sumá a tu equipo' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('button', { name: 'Invitar al primer usuario' }),
  ).toBeTruthy()
})
it('opens the selected account with its existing access', async () => {
  vi.mocked(data.listAdmin).mockImplementation((kind) =>
    Promise.resolve(kind === 'users' ? accounts : []),
  )
  mount()
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Gestionar acceso de team@example.test',
    }),
  )
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Gestionar acceso' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('textbox', { name: 'Correo electrónico' }),
  ).toHaveProperty('value', accessAccount.email)
  await waitFor(() =>
    expect(screen.getByRole('radio', { name: 'Acceso activo' })).toHaveProperty(
      'checked',
      true,
    ),
  )
})
