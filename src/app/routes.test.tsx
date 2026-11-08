import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Providers } from './Providers'
import { AppRoutes } from './routes'
import { mockContentApi, newsRows, requestUrl } from '@/test/content-api'

class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function mount(path: string) {
  mockContentApi()
  vi.stubGlobal('IntersectionObserver', Observer)
  render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  )
}

describe('public routes', () => {
  it('renders the home page and its data sections', async () => {
    mount('/')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveProperty(
      'textContent',
      'Club de PescadoresSan Nicolás',
    )
    expect(await screen.findByText('Noticia de prueba')).toBeTruthy()
    expect(
      await screen.findByText('Temporada de prueba · Período de prueba'),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'Saltar al contenido' })
        .getAttribute('href'),
    ).toBe('#contenido')
  })

  it('provides a way home from unknown URLs', async () => {
    mount('/una-ruta-inexistente')
    expect(
      await screen.findByRole('heading', {
        name: 'No encontramos esta página',
      }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Volver al inicio' }))
    expect(await screen.findByRole('heading', { level: 1 })).toHaveProperty(
      'textContent',
      'Club de PescadoresSan Nicolás',
    )
  })

  it('scrolls to a section after its lazy page has mounted', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    mount('/#pileta')
    await screen.findByRole('heading', {
      name: 'Temporada de pileta',
    })
    expect(scroll).toHaveBeenCalled()
    expect(scroll.mock.contexts[0]).toHaveProperty('id', 'pileta')
  })

  it.each([
    ['/noticias', 'Noticias del club', 'Noticia de prueba'],
    ['/eventos', 'Calendario de eventos', 'Evento de prueba'],
  ])('renders the archive at %s', async (path, title, item) => {
    mount(path)
    expect(await screen.findByRole('heading', { name: title })).toBeTruthy()
    expect(await screen.findByText(item)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('navigates news cursor pages and restores the previous page', async () => {
    mount('/noticias')
    const rows = Array.from({ length: 15 }, (_, index) => ({
      ...newsRows[0],
      id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      title: `Artículo ${index + 1}`,
    }))
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = requestUrl(input)
        const items = url.searchParams.has('or')
          ? rows.slice(12)
          : rows.slice(0, 12)
        return Promise.resolve(
          new Response(JSON.stringify(items), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }),
    )
    await screen.findByText('Artículo 1')
    const next = screen.getByRole('button', { name: 'Siguiente' })
    await waitFor(() => expect(next).toHaveProperty('disabled', false))
    fireEvent.click(next)
    expect(await screen.findByText('Artículo 13')).toBeTruthy()
    await waitFor(() => expect(next).toHaveProperty('disabled', true))
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Artículo 1')).toBeTruthy()
    expect(screen.queryByText('Artículo 13')).toBeNull()
  })
})
