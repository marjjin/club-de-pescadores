import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as data from '../../api/data'
import {
  editableRole,
  protectedRole,
  rolePermissionCatalog,
} from '@/test/admin-roles'
import { RolesSection } from '../RolesSection'

vi.mock('../../api/data', () => ({
  listAdmin: vi.fn(),
  getPermissions: vi.fn(),
  saveRole: vi.fn(),
  deleteRole: vi.fn(),
}))
beforeEach(() => {
  vi.mocked(data.listAdmin).mockResolvedValue([protectedRole, editableRole])
  vi.mocked(data.getPermissions).mockResolvedValue(rolePermissionCatalog)
  vi.mocked(data.saveRole).mockResolvedValue(undefined)
  vi.mocked(data.deleteRole).mockResolvedValue(undefined)
})
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <RolesSection userId="root-test" />
    </QueryClientProvider>,
  )
}

it('marks the system role as protected and hides actions and pagination that do not apply', async () => {
  mount()
  await screen.findByRole('heading', { name: 'Administrador general' })
  expect(screen.getByText('Protegido')).toBeTruthy()
  expect(
    screen.queryByRole('button', { name: 'Editar rol Administrador general' }),
  ).toBeNull()
  expect(
    screen.queryByRole('button', {
      name: 'Eliminar rol Administrador general',
    }),
  ).toBeNull()
  expect(screen.getByText('1 permiso asignado')).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull()
  expect(
    screen.getByText('2 roles en esta página · Más recientes primero'),
  ).toBeTruthy()
})

it('uses server prefix search on submit and clears an empty result', async () => {
  vi.mocked(data.listAdmin).mockImplementation((_kind, filter) =>
    Promise.resolve(filter.search ? [] : [protectedRole, editableRole]),
  )
  mount()
  await screen.findByRole('heading', { name: 'Editor de noticias' })
  const calls = vi.mocked(data.listAdmin).mock.calls.length
  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Buscar por inicio del nombre' }),
    { target: { value: ' unknown ' } },
  )
  expect(data.listAdmin).toHaveBeenCalledTimes(calls)
  fireEvent.submit(screen.getByRole('search', { name: 'Buscar roles' }))
  await screen.findByRole('heading', { name: 'No encontramos roles' })
  expect(data.listAdmin).toHaveBeenLastCalledWith(
    'roles',
    { cursor: null, state: 'all', search: 'unknown' },
    expect.anything(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Ver todos los roles' }))
  expect(
    await screen.findByRole('heading', { name: 'Editor de noticias' }),
  ).toBeTruthy()
})

it('opens the grouped editor and confirms successful saving back in the list', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  mount()
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Editar rol Editor de noticias',
    }),
  )
  await screen.findByRole('checkbox', { name: 'Ver noticias' })
  fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del rol' }), {
    target: { value: 'Lector de noticias' },
  })
  vi.mocked(data.listAdmin).mockResolvedValue([
    protectedRole,
    { ...editableRole, name: 'Lector de noticias' },
  ])
  fireEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))
  expect(
    await screen.findByText('Rol «Lector de noticias» guardado.'),
  ).toBeTruthy()
  expect(
    await screen.findByRole('heading', { name: 'Lector de noticias' }),
  ).toBeTruthy()
})

it('requires delete confirmation and leaves an assigned role visible when the server rejects deletion', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  vi.mocked(data.deleteRole).mockRejectedValue(
    new Error('El rol tiene usuarios asignados.'),
  )
  mount()
  const button = await screen.findByRole('button', {
    name: 'Eliminar rol Editor de noticias',
  })
  fireEvent.click(button)
  expect(data.deleteRole).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(button)
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'El rol tiene usuarios asignados.',
  )
  expect(data.deleteRole).toHaveBeenCalledWith(editableRole)
  expect(
    screen.getByRole('heading', { name: 'Editor de noticias' }),
  ).toBeTruthy()
})

it('distinguishes an initial load error from the empty state and supports retry', async () => {
  vi.mocked(data.listAdmin).mockRejectedValueOnce(
    new Error('No se pudo consultar los roles.'),
  )
  mount()
  await screen.findByRole('heading', { name: 'No pudimos cargar los roles' })
  expect(
    screen.queryByRole('heading', { name: 'Organizá los accesos del equipo' }),
  ).toBeNull()
  vi.mocked(data.listAdmin).mockResolvedValue([])
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar listado' }))
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Organizá los accesos del equipo' }),
    ).toBeTruthy(),
  )
})
