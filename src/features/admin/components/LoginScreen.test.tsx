import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import type { TurnstileOptions } from '@/lib/turnstile'
import * as auth from '../api/auth'
import { LoginScreen } from './LoginScreen'

const widget = vi.hoisted(() => ({
  options: null as TurnstileOptions | null,
  reset: vi.fn(),
}))
vi.mock('@/lib/turnstile', () => ({
  turnstileSiteKey: '0xTESTSITEKEY',
  loadTurnstile: () =>
    Promise.resolve({
      render: (_element: HTMLElement, options: TurnstileOptions) => {
        widget.options = options
        return 'widget-1'
      },
      reset: widget.reset,
      remove: vi.fn(),
    }),
}))
vi.mock('../api/auth', async (original) => ({
  ...(await original<typeof auth>()),
  signIn: vi.fn(),
  recoverPassword: vi.fn(),
}))

beforeEach(() => {
  widget.options = null
  widget.reset.mockClear()
  vi.mocked(auth.signIn).mockReset().mockResolvedValue(undefined)
  vi.mocked(auth.recoverPassword).mockReset().mockResolvedValue(undefined)
})

function mount() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <LoginScreen />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'admin@example.test' },
  })
}

async function passCaptcha(token: string) {
  await waitFor(() => expect(widget.options).not.toBeNull())
  widget.options?.callback(token)
}

it('waits for the security check before signing in, then sends its token', async () => {
  mount()
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'una-clave-larga' },
  })
  const waiting = screen.getByRole('button', {
    name: 'Verificando la conexión…',
  })
  expect(waiting).toHaveProperty('disabled', true)
  await passCaptcha('token-1')
  fireEvent.click(await screen.findByRole('button', { name: 'Ingresar' }))
  await waitFor(() =>
    expect(auth.signIn).toHaveBeenCalledWith(
      'admin@example.test',
      'una-clave-larga',
      'token-1',
    ),
  )
  // Tokens are single-use: the widget restarts for the next attempt.
  await waitFor(() => expect(widget.reset).toHaveBeenCalledWith('widget-1'))
  expect(
    screen.getByRole('button', { name: 'Verificando la conexión…' }),
  ).toBeTruthy()
})

it('protects the password recovery email with the same check', async () => {
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Olvidé mi contraseña' }))
  await passCaptcha('token-2')
  fireEvent.click(
    await screen.findByRole('button', { name: 'Enviar instrucciones' }),
  )
  await waitFor(() =>
    expect(auth.recoverPassword).toHaveBeenCalledWith(
      'admin@example.test',
      'token-2',
    ),
  )
})

it('explains what to do when the security check fails', async () => {
  mount()
  await waitFor(() => expect(widget.options).not.toBeNull())
  widget.options?.['error-callback']()
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Recargá la página',
  )
})
