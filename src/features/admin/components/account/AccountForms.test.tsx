import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as auth from '../../api/auth'
import { AccountSection } from '../AccountSection'
import { EmailForm } from '../EmailForm'
import { PasswordForm } from '../PasswordForm'
import { SessionSecurity } from './SessionSecurity'

vi.mock('../../api/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  recoverPassword: vi.fn(),
  updatePassword: vi.fn(),
  updateEmail: vi.fn(),
  enrollFactor: vi.fn(),
  verifyFactor: vi.fn(),
}))

function mount(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  )
}
function input(label: string, value: string) {
  const field = screen.getByLabelText<HTMLInputElement>(label)
  fireEvent.change(field, { target: { value } })
  return field
}
function fillPassword() {
  input('Nueva contraseña', 'sample-password')
  input('Repetí la contraseña', 'sample-password')
}
function unloadPrevented() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(auth.updateEmail).mockResolvedValue(undefined)
  vi.mocked(auth.updatePassword).mockResolvedValue(undefined)
  vi.mocked(auth.signOut).mockResolvedValue(undefined)
})
afterEach(() => vi.restoreAllMocks())

describe('account forms', () => {
  it('focuses the invalid email and associates its error without making a request', () => {
    mount(<EmailForm currentEmail="owner@example.test" />)
    const email = input('Nuevo correo electrónico', 'invalid')
    fireEvent.click(
      screen.getByRole('button', { name: 'Solicitar cambio de correo' }),
    )
    expect(document.activeElement).toBe(email)
    expect(email.getAttribute('aria-invalid')).toBe('true')
    expect(email.getAttribute('aria-describedby')).toContain(
      screen.getByRole('alert').id,
    )
    expect(auth.updateEmail).not.toHaveBeenCalled()
  })

  it('retains the current email until confirmation and prevents resubmitting a successful request', async () => {
    mount(<EmailForm currentEmail="owner@example.test" />)
    input('Nuevo correo electrónico', 'next@example.test')
    input('Repetí el nuevo correo', 'NEXT@example.test')
    // The native reload warning is gone from the panel.
    expect(unloadPrevented()).toBe(false)
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    expect((await screen.findByRole('status')).textContent).toContain(
      'Confirmación pendiente',
    )
    expect(screen.getByText('owner@example.test')).toBeTruthy()
    expect(screen.queryByLabelText('Nuevo correo electrónico')).toBeNull()
    fireEvent.submit(form)
    expect(auth.updateEmail).toHaveBeenCalledExactlyOnceWith(
      'next@example.test',
    )
    expect(unloadPrevented()).toBe(false)
  })

  it('preserves the email after failure and supports discarding with restored focus', async () => {
    vi.mocked(auth.updateEmail).mockRejectedValue(
      new Error('No se pudo actualizar el correo.'),
    )
    mount(<EmailForm currentEmail="owner@example.test" />)
    const email = input('Nuevo correo electrónico', 'next@example.test')
    input('Repetí el nuevo correo', 'next@example.test')
    fireEvent.submit(screen.getByRole('form'))
    await screen.findByRole('alert')
    expect(email.value).toBe('next@example.test')
    fireEvent.click(
      screen.getByRole('button', { name: 'Descartar cambios de correo' }),
    )
    expect(email.value).toBe('')
    expect(document.activeElement).toBe(email)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(unloadPrevented()).toBe(false)
  })

  it('toggles password visibility independently and focuses invalid confirmation', () => {
    mount(<PasswordForm />)
    const password = input('Nueva contraseña', 'sample-password')
    const confirm = input('Repetí la contraseña', 'different-password')
    fireEvent.click(
      screen.getByRole('button', { name: 'Mostrar nueva contraseña' }),
    )
    expect(password.type).toBe('text')
    expect(confirm.type).toBe('password')
    fireEvent.submit(screen.getByRole('form'))
    expect(document.activeElement).toBe(confirm)
    expect(screen.getByRole('alert').textContent).toBe(
      'Las contraseñas no coinciden.',
    )
    expect(auth.updatePassword).not.toHaveBeenCalled()
  })

  it('blocks duplicate requests while saving, then clears and hides passwords before continuing', async () => {
    let finish = () => {}
    const request = new Promise<void>((resolve) => {
      finish = resolve
    })
    vi.mocked(auth.updatePassword).mockReturnValue(request)
    const onSaved = vi.fn()
    mount(<PasswordForm onSaved={onSaved} />)
    fillPassword()
    fireEvent.click(
      screen.getByRole('button', { name: 'Mostrar nueva contraseña' }),
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Mostrar confirmación de contraseña',
      }),
    )
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    await screen.findByRole('button', { name: 'Guardando…' })
    expect(
      screen
        .getByLabelText<HTMLInputElement>('Nueva contraseña')
        .matches(':disabled'),
    ).toBe(true)
    expect(onSaved).not.toHaveBeenCalled()
    fireEvent.submit(form)
    expect(auth.updatePassword).toHaveBeenCalledExactlyOnceWith(
      'sample-password',
    )
    await act(async () => {
      finish()
      await request
    })
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
    for (const label of ['Nueva contraseña', 'Repetí la contraseña']) {
      const field = screen.getByLabelText<HTMLInputElement>(label)
      expect(field.value).toBe('')
      expect(field.type).toBe('password')
    }
    expect(screen.getByRole('status').textContent).toBe(
      'Contraseña actualizada.',
    )
    expect(unloadPrevented()).toBe(false)
  })

  it('keeps passwords after a failed request and clears them on discard', async () => {
    vi.mocked(auth.updatePassword).mockRejectedValue(
      new Error('No se pudo actualizar la contraseña.'),
    )
    mount(<PasswordForm />)
    fillPassword()
    fireEvent.submit(screen.getByRole('form'))
    await screen.findByRole('alert')
    const password = screen.getByLabelText<HTMLInputElement>('Nueva contraseña')
    expect(password.value).toBe('sample-password')
    fireEvent.click(
      screen.getByRole('button', { name: 'Descartar cambios de contraseña' }),
    )
    expect(password.value).toBe('')
    expect(document.activeElement).toBe(password)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('account security and navigation', () => {
  it('connects shortcuts to labelled account sections', () => {
    mount(<AccountSection email="owner@example.test" />)
    expect(
      within(screen.getByRole('region', { name: 'Cuenta actual' })).getByText(
        'owner@example.test',
      ),
    ).toBeTruthy()
    const navigation = screen.getByRole('navigation', {
      name: 'Configuración de cuenta',
    })
    for (const link of within(navigation).getAllByRole('link')) {
      const target = document.querySelector(link.getAttribute('href') ?? '')
      expect(target?.getAttribute('aria-labelledby')).toBeTruthy()
    }
  })

  it('requires confirmation and closes only other sessions', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    mount(<SessionSecurity />)
    const button = screen.getByRole('button', { name: 'Cerrar otras sesiones' })
    fireEvent.click(button)
    expect(auth.signOut).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(button)
    expect((await screen.findByRole('status')).textContent).toContain(
      'Esta sesión sigue abierta',
    )
    expect(auth.signOut).toHaveBeenCalledExactlyOnceWith(true)
  })
})
