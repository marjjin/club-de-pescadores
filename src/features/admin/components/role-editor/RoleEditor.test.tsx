import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as data from '../../api/data'
import type { Role } from '../../schemas/admin'
import {
  editableRole,
  protectedRole,
  rolePermissionCatalog,
} from '@/test/admin-roles'
import { RoleEditor } from './RoleEditor'

vi.mock('../../api/data', () => ({
  getPermissions: vi.fn(),
  saveRole: vi.fn(),
  deleteRole: vi.fn(),
}))
beforeEach(() => {
  vi.mocked(data.getPermissions).mockResolvedValue(rolePermissionCatalog)
  vi.mocked(data.saveRole).mockResolvedValue(undefined)
})
function mount(role: Role | null = null) {
  const close = vi.fn()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <RoleEditor role={role} userId="root-test" onClose={close} />
    </QueryClientProvider>,
  )
  return close
}

it('focuses an invalid name and exposes only assignable permissions as controls', async () => {
  mount()
  await screen.findByRole('checkbox', { name: 'Ver noticias' })
  expect(screen.queryByRole('checkbox', { name: 'Gestionar roles' })).toBeNull()
  expect(
    screen.queryByRole('checkbox', { name: 'Actualizar altura del río' }),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))
  const name = screen.getByRole('textbox', { name: 'Nombre del rol' })
  expect(document.activeElement).toBe(name)
  expect(name.getAttribute('aria-invalid')).toBe('true')
  expect(data.saveRole).not.toHaveBeenCalled()
})

it('includes read permission for dependent actions and clears only their module when read is removed', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  mount()
  fireEvent.click(
    await screen.findByRole('checkbox', { name: 'Editar noticias' }),
  )
  expect(screen.getByRole('checkbox', { name: 'Ver noticias' })).toHaveProperty(
    'checked',
    true,
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Ver eventos' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Ver noticias' }))
  expect(
    screen.getByRole('checkbox', { name: 'Editar noticias' }),
  ).toHaveProperty('checked', false)
  expect(screen.getByRole('checkbox', { name: 'Ver eventos' })).toHaveProperty(
    'checked',
    true,
  )
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Seleccionar todos los permisos de Noticias',
    }),
  )
  expect(
    screen.getByRole('checkbox', { name: 'Publicar noticias' }),
  ).toHaveProperty('checked', true)
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Quitar todos los permisos de Noticias',
    }),
  )
  expect(screen.getByRole('checkbox', { name: 'Ver noticias' })).toHaveProperty(
    'checked',
    false,
  )
  expect(confirm).not.toHaveBeenCalled()
  expect(data.saveRole).not.toHaveBeenCalled()
})

it('requires confirmation and keeps the existing role version when saving permission changes', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const close = mount(editableRole)
  fireEvent.click(
    await screen.findByRole('checkbox', { name: 'Publicar noticias' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))
  expect(data.saveRole).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))
  await waitFor(() =>
    expect(data.saveRole).toHaveBeenCalledWith(
      editableRole.name,
      ['noticias.ver', 'noticias.publicar'],
      editableRole,
    ),
  )
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
})

it('allows creating an explicitly confirmed role without permissions', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  mount()
  await screen.findByRole('checkbox', { name: 'Ver noticias' })
  fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del rol' }), {
    target: { value: ' Sin permisos ' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))
  await waitFor(() =>
    expect(data.saveRole).toHaveBeenCalledWith('Sin permisos', [], null),
  )
})

it('shows the complete protected role as read-only and refuses direct form submission', async () => {
  mount(protectedRole)
  expect(
    await screen.findByRole('checkbox', { name: 'Ver noticias' }),
  ).toHaveProperty('checked', true)
  expect(screen.getByText('Todos')).toBeTruthy()
  const button = screen.getByRole('button', { name: 'Guardar rol' })
  expect(button).toHaveProperty('disabled', true)
  fireEvent.submit(button.closest('form')!)
  expect(data.saveRole).not.toHaveBeenCalled()
})

it('blocks saving after a catalog error and retries without losing the name', async () => {
  vi.mocked(data.getPermissions).mockRejectedValueOnce(
    new Error('No se pudo consultar el catálogo.'),
  )
  mount()
  await screen.findByText(
    'No pudimos cargar el catálogo de permisos. Conservamos lo que completaste.',
  )
  fireEvent.change(screen.getByRole('textbox', { name: 'Nombre del rol' }), {
    target: { value: 'Rol preparado' },
  })
  expect(screen.getByRole('button', { name: 'Guardar rol' })).toHaveProperty(
    'disabled',
    true,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar permisos' }))
  expect(
    await screen.findByRole('checkbox', { name: 'Ver noticias' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('textbox', { name: 'Nombre del rol' }),
  ).toHaveProperty('value', 'Rol preparado')
  expect(data.saveRole).not.toHaveBeenCalled()
})

it('keeps permission changes after an error and protects discarding them', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.mocked(data.saveRole).mockRejectedValueOnce(
    new Error('Otra persona modificó el rol. Actualizá antes de guardar.'),
  )
  const close = mount(editableRole)
  fireEvent.click(
    await screen.findByRole('checkbox', { name: 'Editar noticias' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Otra persona modificó el rol. Actualizá antes de guardar.',
  )
  expect(
    screen.getByRole('checkbox', { name: 'Editar noticias' }),
  ).toHaveProperty('checked', true)
  confirm.mockReturnValue(false)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(close).not.toHaveBeenCalled()
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
})

it('blocks duplicate writes and closing while saving', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  let finish: () => void = () => {}
  const request = new Promise<void>((resolve) => {
    finish = resolve
  })
  vi.mocked(data.saveRole).mockReturnValueOnce(request)
  const close = mount(editableRole)
  fireEvent.click(
    await screen.findByRole('checkbox', { name: 'Editar noticias' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Guardar rol' }))
  const button = await screen.findByRole('button', { name: 'Guardando…' })
  expect(button).toHaveProperty('disabled', true)
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty(
    'disabled',
    true,
  )
  fireEvent.submit(button.closest('form')!)
  expect(data.saveRole).toHaveBeenCalledOnce()
  await act(async () => {
    finish()
    await request
  })
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
})
