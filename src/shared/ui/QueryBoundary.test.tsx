import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueryBoundary } from './QueryBoundary'

function Subject({ load }: { load: () => Promise<string[]> }) {
  const query = useQuery({ queryKey: ['items'], queryFn: load, retry: false })
  return (
    <QueryBoundary query={query} emptyMessage="Sin resultados">
      {(items) => (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </QueryBoundary>
  )
}

function mount(load: () => Promise<string[]>, client = new QueryClient()) {
  render(
    <QueryClientProvider client={client}>
      <Subject load={load} />
    </QueryClientProvider>,
  )
  return client
}

describe('query states', () => {
  it('announces loading and an empty result', async () => {
    mount(() => Promise.resolve([]))
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe(
      'Cargando',
    )
    expect(await screen.findByText('Sin resultados')).toBeTruthy()
  })

  it('hides raw errors and allows a successful retry', async () => {
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockRejectedValueOnce(new Error('private backend detail'))
      .mockResolvedValue(['Noticia recuperada'])
    mount(load)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText('private backend detail')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Noticia recuperada')).toBeTruthy()
  })

  it('preserves cached content when background refresh fails', async () => {
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockResolvedValueOnce(['Contenido disponible'])
      .mockRejectedValue(new Error('offline'))
    const client = mount(load)
    await screen.findByText('Contenido disponible')
    await act(() => client.invalidateQueries({ queryKey: ['items'] }))
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'última información',
      ),
    )
    expect(screen.getByText('Contenido disponible')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
