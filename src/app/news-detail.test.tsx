import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { mockResponse, newsRows, requestUrl } from '@/test/content-api'
import { Providers } from './Providers'
import { AppRoutes } from './routes'

const id = newsRows[0]!.id
const body = `${'Información sobre la actividad del club. '.repeat(8)}\n\nEste es el último párrafo completo.`

function mount(path: string) {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  render(
    <Providers>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  )
}

describe('reading a news article', () => {
  it('shows a short card, opens the full article and returns to the archive', async () => {
    mockResponse([{ ...newsRows[0], excerpt: body }])
    const scroll = vi.spyOn(window, 'scrollTo')
    mount('/noticias')
    const link = await screen.findByRole('link', {
      name: 'Leer noticia: Noticia de prueba',
    })
    expect(link.getAttribute('href')).toBe(`/noticias/${id}`)
    expect(link.textContent).not.toContain('último párrafo completo')
    expect(link.textContent).toContain('…')
    fireEvent.click(link)
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Noticia de prueba',
      }),
    ).toHaveProperty('textContent', 'Noticia de prueba')
    expect(screen.getByRole('article').textContent).toContain(body)
    expect(scroll).toHaveBeenLastCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
    expect(
      screen
        .getByRole('link', { name: 'Ver imagen completa (abre otra pestaña)' })
        .getAttribute('href'),
    ).toBe(newsRows[0]!.image_url)
    fireEvent.click(
      screen.getByRole('link', { name: 'Volver a todas las noticias' }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Noticias del club' }),
    ).toBeTruthy()
  })

  it('opens the complete news article directly through its shareable URL', async () => {
    mockResponse([{ ...newsRows[0], excerpt: body }])
    mount(`/noticias/${id}`)
    await screen.findByRole('heading', { name: 'Noticia de prueba' })
    expect(screen.getByRole('article').textContent).toContain(body)
  })

  it.each([id, 'invalid-id'])(
    'handles an unavailable article at %s',
    async (key) => {
      mockResponse([])
      mount(`/noticias/${key}`)
      expect(
        await screen.findByRole('heading', {
          name: 'Esta noticia no está disponible',
        }),
      ).toBeTruthy()
      expect(
        screen.getByRole('link', { name: 'Volver a noticias' }),
      ).toBeTruthy()
      if (key === 'invalid-id')
        expect(
          vi
            .mocked(fetch)
            .mock.calls.some(([input]) =>
              requestUrl(input).pathname.endsWith('/news'),
            ),
        ).toBe(false)
    },
  )

  it('offers a working retry after a failed request without exposing raw errors', async () => {
    mockResponse({ message: 'sensitive internal failure' }, 500)
    mount(`/noticias/${id}`)
    await screen.findByRole('heading', { name: 'No pudimos cargar la noticia' })
    expect(screen.queryByText('sensitive internal failure')).toBeNull()
    mockResponse(newsRows)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(
      await screen.findByRole('heading', { name: 'Noticia de prueba' }),
    ).toBeTruthy()
  })
})
