import { fireEvent, render, screen } from '@testing-library/react'
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
function mount(path = '/') {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>
        <TournamentDetail id={id} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
afterEach(() => {
  vi.unstubAllGlobals()
})

it('splits the leaderboard and the description into two tabs', async () => {
  stub('Categoría Mayores: $25.000\nCategoría Seniors: $20.000')
  mount()
  const board = await screen.findByRole('tab', { name: 'Tabla de posiciones' })
  const info = screen.getByRole('tab', { name: 'Información' })
  // The QR promises the leaderboard: it opens first.
  expect(board.getAttribute('aria-selected')).toBe('true')
  expect(screen.queryByRole('heading', { name: 'Sobre el torneo' })).toBeNull()
  fireEvent.click(info)
  expect(info.getAttribute('aria-selected')).toBe('true')
  const text = screen.getByText(/Categoría Mayores/)
  expect(text.textContent).toBe(
    'Categoría Mayores: $25.000\nCategoría Seniors: $20.000',
  )
  expect(text.className).toContain('whitespace-pre-line')
  expect(
    screen.queryByRole('region', { name: 'Tabla de posiciones' }),
  ).toBeNull()
  // Arrow keys move between tabs, as in any tab list.
  fireEvent.keyDown(info, { key: 'ArrowLeft' })
  expect(board.getAttribute('aria-selected')).toBe('true')
  expect(document.activeElement).toBe(board)
})

it('opens the details directly from a ?seccion=info link', async () => {
  stub('Premio a la pieza mayor')
  mount('/?seccion=info')
  expect(
    await screen.findByRole('heading', { name: 'Sobre el torneo' }),
  ).toBeTruthy()
  expect(
    screen
      .getByRole('tab', { name: 'Información' })
      .getAttribute('aria-selected'),
  ).toBe('true')
})

it('shows only the leaderboard, without tabs, when there is no description', async () => {
  stub(null)
  mount()
  await screen.findByRole('heading', { level: 1, name: 'Tradicional 12 hs' })
  expect(screen.queryByRole('tablist')).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Sobre el torneo' })).toBeNull()
  expect(
    screen.getByRole('region', { name: 'Tabla de posiciones' }),
  ).toBeTruthy()
})
