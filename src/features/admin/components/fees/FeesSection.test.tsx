import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as api from '../../api/fees'
import { AccessContext } from '../../hooks/useAccess'
import type { AdminFees } from '../../schemas/fees'
import { FeesSection } from './FeesSection'

vi.mock('../../api/fees', () => ({
  getAdminFees: vi.fn(),
  saveFees: vi.fn(),
}))

const userId = '10000000-0000-4000-8000-000000000010'
const data: AdminFees = {
  valid_from: '2026-10-01',
  note: null,
  updated_at: '2026-11-26T12:00:00Z',
  fees: [
    {
      id: '60000000-0000-4000-8000-000000000001',
      kind: 'membership',
      name: 'Social',
      detail: null,
      icon: 'person',
      price_cents: 3000000,
    },
    {
      id: '60000000-0000-4000-8000-000000000002',
      kind: 'membership',
      name: 'Familiar',
      detail: null,
      icon: 'family',
      price_cents: 3000000,
    },
    {
      id: '60000000-0000-4000-8000-000000000003',
      kind: 'service',
      name: 'Carpa',
      detail: null,
      icon: 'tent',
      price_cents: 1200000,
    },
  ],
}
beforeEach(() => {
  vi.mocked(api.getAdminFees).mockResolvedValue(data)
  vi.mocked(api.saveFees).mockResolvedValue({
    ...data,
    updated_at: '2026-11-26T13:00:00Z',
  })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
function mount(permissions: string[] | null = null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AccessContext.Provider
        value={
          permissions
            ? { general: false, permissions }
            : { general: true, permissions: [] }
        }
      >
        <FeesSection userId={userId} />
      </AccessContext.Provider>
    </QueryClientProvider>,
  )
}
const publish = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Publicar valores' }))
const memberships = () => within(screen.getByRole('list', { name: /^Cuotas/ }))

it('publishes edited prices, a new service and the new order', async () => {
  mount()
  await screen.findAllByLabelText('Precio')
  expect(memberships().getAllByLabelText('Precio')).toHaveLength(2)
  fireEvent.change(memberships().getAllByLabelText('Precio')[0]!, {
    target: { value: '35.000' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Bajar «Social»' }))
  expect(
    screen
      .getByText('Social quedó en el lugar 2 de cuotas.')
      .getAttribute('role'),
  ).toBe('status')
  fireEvent.click(screen.getByRole('button', { name: 'Agregar servicio' }))
  const services = within(screen.getByRole('list', { name: /^Servicios/ }))
  fireEvent.change(services.getAllByLabelText('Nombre')[1]!, {
    target: { value: 'Parrilla' },
  })
  fireEvent.change(services.getAllByLabelText('Precio')[1]!, {
    target: { value: '5000' },
  })
  fireEvent.change(screen.getByLabelText('Mes'), { target: { value: '12' } })
  publish()
  await waitFor(() => expect(api.saveFees).toHaveBeenCalledTimes(1))
  const [input, version] = vi.mocked(api.saveFees).mock.calls[0]!
  expect(version).toBe(data.updated_at)
  expect(input.valid_from).toBe('2026-12-01')
  expect(
    input.fees.map((fee) => [fee.kind, fee.name, fee.price_cents]),
  ).toEqual([
    ['membership', 'Familiar', 3000000],
    ['membership', 'Social', 3500000],
    ['service', 'Carpa', 1200000],
    ['service', 'Parrilla', 500000],
  ])
  expect(
    await screen.findByText('Listo: los nuevos valores ya se ven en el sitio.'),
  ).toBeTruthy()
})

it('marks invalid prices and empty names without saving', async () => {
  mount()
  await screen.findAllByLabelText('Precio')
  fireEvent.change(memberships().getAllByLabelText('Precio')[0]!, {
    target: { value: 'treinta' },
  })
  fireEvent.change(memberships().getAllByLabelText('Nombre')[1]!, {
    target: { value: ' ' },
  })
  publish()
  expect(
    await screen.findByText('Escribí solo el número, por ejemplo 30.000.'),
  ).toBeTruthy()
  expect(screen.getByText('Completá el nombre.')).toBeTruthy()
  expect(memberships().getAllByLabelText('Precio')[0]).toBe(
    document.activeElement,
  )
  expect(api.saveFees).not.toHaveBeenCalled()
})

it('shows the values read-only to roles without edit permission', async () => {
  mount(['cuotas.ver'])
  expect(
    await screen.findByText(
      'Tu rol permite ver los valores pero no modificarlos.',
    ),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Publicar valores' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Agregar cuota' })).toBeNull()
  expect(
    // Disabled through the fieldset, which the property does not reflect.
    memberships().getAllByLabelText('Precio')[0]!.matches(':disabled'),
  ).toBe(true)
})
