import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { requestUrl } from '@/test/content-api'
import { FeesSection } from './FeesSection'

const schedule = [
  { valid_from: '2026-10-01', note: 'Se abonan en secretaría.' },
]
const fees = [
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
    kind: 'service',
    name: 'Carpa',
    detail: 'Por día',
    icon: 'tent',
    price_cents: 1200000,
  },
]
function stub(respond: (table: string) => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) =>
      Promise.resolve(
        respond(requestUrl(input).pathname.split('/').at(-1) ?? ''),
      ),
    ),
  )
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
function mount() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <FeesSection />
    </QueryClientProvider>,
  )
}
afterEach(() => {
  vi.unstubAllGlobals()
})

it('lists membership fees and services with their prices and validity', async () => {
  stub((table) => json(table === 'fee_schedules' ? schedule : fees))
  mount()
  expect(
    screen.getByRole('status', { name: 'Cargando cuotas y servicios' }),
  ).toBeTruthy()
  expect(
    await screen.findByText('Valores vigentes desde octubre de 2026.'),
  ).toBeTruthy()
  const memberships = screen.getByRole('region', { name: 'Cuotas' })
  expect(within(memberships).getByText('Social')).toBeTruthy()
  expect(
    within(memberships)
      .getByText(/30\.000/)
      .textContent?.replace(/\s/g, ''),
  ).toBe('$30.000')
  const services = screen.getByRole('region', { name: 'Servicios' })
  expect(within(services).getByText('Carpa')).toBeTruthy()
  expect(within(services).getByText('Por día')).toBeTruthy()
  expect(screen.getByText('Se abonan en secretaría.')).toBeTruthy()
})

it('explains the failure and offers a retry when prices cannot be read', async () => {
  // 400, not 503: the client retries 503 responses with a backoff.
  stub(() => json({ message: 'unavailable' }, 400))
  mount()
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
})

it('never renders rows that break the expected shape', async () => {
  stub((table) =>
    json(
      table === 'fee_schedules' ? schedule : [{ ...fees[0], icon: 'rocket' }],
    ),
  )
  mount()
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByText('Social')).toBeNull()
})
