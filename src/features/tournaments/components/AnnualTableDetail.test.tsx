import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { requestUrl } from '@/test/content-api'
import { AnnualTableDetail } from './AnnualTableDetail'
import { AnnualTablesList } from './AnnualTablesList'

const id = '50000000-0000-4000-8000-000000000001'
const mayores = '80000000-0000-4000-8000-000000000001'
const seniors = '80000000-0000-4000-8000-000000000002'
const table = {
  id,
  name: 'Campeonato anual',
  year: 2026,
  categories: [
    { id: mayores, name: 'Mayores' },
    { id: seniors, name: 'Seniors' },
  ],
  tournaments: [
    {
      id: '60000000-0000-4000-8000-000000000001',
      name: 'Fecha 1',
      starts_on: '2026-03-01',
      finished: true,
    },
    {
      id: '60000000-0000-4000-8000-000000000002',
      name: 'Tradicional 12 horas',
      starts_on: '2026-11-28',
      finished: false,
    },
  ],
}
const standings: Record<string, unknown[]> = {
  [mayores]: [
    { display_name: 'Ana G.', points: 20, tournaments: 2, ranking: 1 },
    { display_name: 'Beto R.', points: 12, tournaments: 1, ranking: 2 },
  ],
  [seniors]: [],
}
const calls: { name: string; body: Record<string, string> }[] = []
function stub(detail: unknown = table) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input)
      const name = url.pathname.split('/').at(-1) ?? ''
      const raw = typeof init?.body === 'string' ? init.body : '{}'
      const body = JSON.parse(raw) as Record<string, string>
      calls.push({ name, body })
      const data =
        name === 'annual_table_get'
          ? detail
          : name === 'annual_standings'
            ? standings[body.p_category ?? '']
            : name === 'annual_tables_public'
              ? [{ id, name: 'Campeonato anual', year: 2026, finished: 1 }]
              : []
      return Promise.resolve(
        new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }),
  )
}
function mount(node: React.ReactNode) {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  )
}
afterEach(() => {
  vi.unstubAllGlobals()
  calls.length = 0
})

it('shows the season standings per category and which tournaments add up', async () => {
  stub()
  mount(<AnnualTableDetail id={id} />)
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Campeonato anual' }),
  ).toBeTruthy()
  expect(screen.getByText('Tabla anual 2026')).toBeTruthy()
  const first = await screen.findByRole('rowheader', { name: /Ana G\./ })
  expect(
    within(first.closest('tr') as HTMLElement).getByText('20'),
  ).toBeTruthy()
  expect(
    calls.find((call) => call.name === 'annual_standings')?.body,
  ).toMatchObject({ p_table: id, p_category: mayores })
  fireEvent.click(screen.getByRole('button', { name: 'Seniors' }))
  expect(
    await screen.findByText(
      'Todavía no hay torneos finalizados que sumen en esta categoría.',
    ),
  ).toBeTruthy()
  expect(screen.getByText('Ya suma')).toBeTruthy()
  expect(screen.getByText('Suma al finalizar')).toBeTruthy()
  expect(
    screen
      .getByRole('link', { name: /Tradicional 12 horas/ })
      .getAttribute('href'),
  ).toBe('/torneos/60000000-0000-4000-8000-000000000002')
})

it('says so when the table is not available', async () => {
  stub(null)
  mount(<AnnualTableDetail id={id} />)
  expect(
    await screen.findByRole('heading', {
      name: 'Esta tabla anual no está disponible',
    }),
  ).toBeTruthy()
})

it('lists the annual tables on the tournaments page', async () => {
  stub()
  mount(<AnnualTablesList />)
  const link = await screen.findByRole('link', { name: /Campeonato anual/ })
  expect(link.getAttribute('href')).toBe(`/torneos/anual/${id}`)
  expect(within(link).getByText('1 torneo finalizado')).toBeTruthy()
})
