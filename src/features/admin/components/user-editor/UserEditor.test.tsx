import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as data from '../../api/data'
import type { Account } from '../../schemas/admin'
import { accessAccount, accessRoles, accessViewer } from '@/test/admin-access'
import { UserEditor } from '../UserEditor'

vi.mock('../../api/data', () => ({
  listAdmin: vi.fn(),
  inviteUser: vi.fn(),
  saveUser: vi.fn(),
  removeUser: vi.fn(),
}))
beforeEach(() => {
  vi.mocked(data.listAdmin).mockResolvedValue(accessRoles.slice(0, 2))
  vi.mocked(data.inviteUser).mockResolvedValue(null)
  vi.mocked(data.saveUser).mockResolvedValue(null)
  vi.mocked(data.removeUser).mockResolvedValue(null)
})
function mount(account: Account | null = null, userId = accessViewer) {
  const close = vi.fn()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <UserEditor account={account} userId={userId} onClose={close} />
    </QueryClientProvider>,
  )
  return close
}
async function fill() {
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Correo electrónico' }),
    { target: { value: '  new@example.test  ' } },
  )
  fireEvent.click(
    await screen.findByRole('checkbox', { name: 'Administrador general' }),
  )
}

it('describes validation errors and focuses the email and then the role selector', async () => {
  mount()
  await screen.findByRole('checkbox', { name: 'Administrador general' })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  const email = screen.getByRole('textbox', { name: 'Correo electrónico' })
  expect(document.activeElement).toBe(email)
  expect(email.getAttribute('aria-invalid')).toBe('true')
  fireEvent.change(email, { target: { value: 'valid@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  expect(document.activeElement?.hasAttribute('data-role-picker')).toBe(true)
  expect(data.inviteUser).not.toHaveBeenCalled()
})

it('requires confirmation, sends a normalized invitation and returns after success', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const close = mount()
  await fill()
  fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  expect(data.inviteUser).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  await screen.findByRole('heading', { name: 'Invitación enviada' })
  expect(data.inviteUser).toHaveBeenCalledWith('new@example.test', [
    accessRoles[0]!.id,
  ])
  fireEvent.click(screen.getByRole('button', { name: 'Volver al listado' }))
  expect(close).toHaveBeenCalledOnce()
  expect(confirm).toHaveBeenCalledTimes(2)
})

it('preserves selected roles across pages and enforces the ten-role limit', async () => {
  vi.mocked(data.listAdmin).mockImplementation((_kind, filter) =>
    Promise.resolve(
      filter.cursor ? accessRoles.slice(20) : accessRoles.slice(0, 21),
    ),
  )
  mount()
  await screen.findByRole('checkbox', { name: 'Administrador general' })
  for (const role of accessRoles.slice(0, 8))
    fireEvent.click(screen.getByRole('checkbox', { name: role.name }))
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  fireEvent.click(
    await screen.findByRole('checkbox', { name: accessRoles[20]!.name }),
  )
  fireEvent.click(screen.getByRole('checkbox', { name: accessRoles[21]!.name }))
  expect(
    screen.getByRole('checkbox', { name: accessRoles[22]!.name }),
  ).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('checkbox', { name: accessRoles[20]!.name }))
  expect(
    screen.getByRole('checkbox', { name: accessRoles[22]!.name }),
  ).toHaveProperty('disabled', false)
  fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
  expect(
    await screen.findByRole('checkbox', { name: 'Administrador general' }),
  ).toHaveProperty('checked', true)
  expect(data.inviteUser).not.toHaveBeenCalled()
})

it('searches roles with Enter without submitting the invitation', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  mount()
  await fill()
  const search = screen.getByRole('searchbox', {
    name: 'Buscar rol por inicio del nombre',
  })
  fireEvent.change(search, { target: { value: 'Rol' } })
  const event = createEvent.keyDown(search, { key: 'Enter', cancelable: true })
  fireEvent(search, event)
  expect(event.defaultPrevented).toBe(true)
  await waitFor(() =>
    expect(data.listAdmin).toHaveBeenLastCalledWith(
      'roles',
      { cursor: null, state: 'all', search: 'Rol' },
      expect.anything(),
    ),
  )
  expect(confirm).not.toHaveBeenCalled()
  expect(data.inviteUser).not.toHaveBeenCalled()
})

it('confirms deactivation and sends the existing version without editing the email', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount(accessAccount)
  await screen.findByRole('checkbox', { name: 'Administrador general' })
  expect(
    screen.getByRole('textbox', { name: 'Correo electrónico' }),
  ).toHaveProperty('readOnly', true)
  fireEvent.click(screen.getByRole('radio', { name: 'Acceso desactivado' }))
  fireEvent.click(screen.getByRole('button', { name: 'Guardar acceso' }))
  expect(data.saveUser).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Guardar acceso' }))
  await screen.findByRole('heading', { name: 'Acceso actualizado' })
  expect(data.saveUser).toHaveBeenCalledWith(
    accessAccount,
    accessAccount.roles,
    false,
  )
})

it('blocks edits to the current administrator even if the form is submitted directly', async () => {
  mount(accessAccount, accessAccount.id)
  await screen.findByRole('checkbox', { name: 'Administrador general' })
  const button = screen.getByRole('button', { name: 'Guardar acceso' })
  expect(button).toHaveProperty('disabled', true)
  fireEvent.submit(button.closest('form')!)
  expect(data.saveUser).not.toHaveBeenCalled()
})

it('preserves changes after an error and protects leaving the form', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.mocked(data.inviteUser).mockRejectedValueOnce(
    new Error('No se pudo enviar la invitación.'),
  )
  const close = mount()
  await fill()
  fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'No se pudo enviar la invitación.',
  )
  expect(
    screen.getByRole('checkbox', { name: 'Administrador general' }),
  ).toHaveProperty('checked', true)
  confirm.mockReturnValue(false)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(close).not.toHaveBeenCalled()
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  // Unsaved work is kept as a draft instead of blocking the reload natively.
  expect(event.defaultPrevented).toBe(false)
})

it('blocks saving when roles fail to load and recovers without clearing the email', async () => {
  vi.mocked(data.listAdmin).mockRejectedValueOnce(
    new Error('No se pudo consultar los roles.'),
  )
  mount()
  await screen.findByText(
    'No pudimos cargar los roles. Conservamos tu selección.',
  )
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Correo electrónico' }),
    { target: { value: 'pending@example.test' } },
  )
  expect(
    screen.getByRole('button', { name: 'Enviar invitación' }),
  ).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar roles' }))
  expect(
    await screen.findByRole('checkbox', { name: 'Administrador general' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('textbox', { name: 'Correo electrónico' }),
  ).toHaveProperty('value', 'pending@example.test')
  expect(data.inviteUser).not.toHaveBeenCalled()
})

it('blocks duplicate submissions while the request is pending and preserves server warnings', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  let finish: (value: string | null) => void = () => {}
  const request = new Promise<string | null>((resolve) => {
    finish = resolve
  })
  vi.mocked(data.inviteUser).mockReturnValueOnce(request)
  mount()
  await fill()
  fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))
  const pending = await screen.findByRole('button', { name: 'Procesando…' })
  expect(pending).toHaveProperty('disabled', true)
  fireEvent.submit(pending.closest('form')!)
  expect(data.inviteUser).toHaveBeenCalledOnce()
  await act(async () => {
    finish('La cuenta ya existe. Se actualizó su acceso.')
    await request
  })
  expect(
    await screen.findByRole('heading', { name: 'Solicitud procesada' }),
  ).toBeTruthy()
  expect(
    screen.getByText('La cuenta ya existe. Se actualizó su acceso.'),
  ).toBeTruthy()
})

it('removes another user from the team only after a danger confirmation', async () => {
  const account = accessAccount
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
  const close = mount(account)
  const button = screen.getByRole('button', { name: 'Quitar del equipo' })
  fireEvent.click(button)
  await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1))
  expect(data.removeUser).not.toHaveBeenCalled()
  confirm.mockReturnValueOnce(true)
  fireEvent.click(button)
  await waitFor(() => expect(data.removeUser).toHaveBeenCalledTimes(1))
  expect(vi.mocked(data.removeUser).mock.calls[0]?.[0]).toBe(account)
  await waitFor(() => expect(close).toHaveBeenCalled())
  confirm.mockRestore()
})

it('does not offer removing your own account', () => {
  mount({ ...accessAccount, id: accessViewer })
  expect(screen.queryByRole('button', { name: 'Quitar del equipo' })).toBeNull()
})
