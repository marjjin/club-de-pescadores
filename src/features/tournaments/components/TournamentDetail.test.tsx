import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { requestUrl } from '@/test/content-api'
import { TournamentDetail } from './TournamentDetail'

const id = '60000000-0000-4000-8000-000000000001'
const row = {
  id,
  name: 'Tradicional 12 hs',
  place: 'Muelle',
  starts_on: '2026-11-28',
  ends_on: null,
  status: 'published',
}
function stub(description: string | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = requestUrl(input)
      const body = url.pathname.endsWith('/tournaments')
        ? [{ ...row, description }]
        : []
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }),
  )
}
function mount() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <TournamentDetail id={id} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
afterEach(() => {
  vi.unstubAllGlobals()
})

it('shows the tournament description keeping its line breaks', async () => {
  stub('Categoría Mayores: $25.000\nCategoría Seniors: $20.000')
  mount()
  expect(
    await screen.findByRole('heading', { name: 'Sobre el torneo' }),
  ).toBeTruthy()
  const text = screen.getByText(/Categoría Mayores/)
  expect(text.textContent).toBe(
    'Categoría Mayores: $25.000\nCategoría Seniors: $20.000',
  )
  expect(text.className).toContain('whitespace-pre-line')
})

it('leaves the section out when there is no description', async () => {
  stub(null)
  mount()
  await screen.findByRole('heading', { level: 1, name: 'Tradicional 12 hs' })
  expect(screen.queryByRole('heading', { name: 'Sobre el torneo' })).toBeNull()
})
