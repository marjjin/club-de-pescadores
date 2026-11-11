import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import * as data from '../api/data'
import type { News } from '../schemas/admin'
import { ContentSection } from './ContentSection'

vi.mock('../api/data', () => ({
  listAdmin: vi.fn(),
  saveContent: vi.fn(),
  archiveContent: vi.fn(),
}))
const article: News = {
  id: '20000000-0000-4000-8000-000000000001',
  title: 'Noticia de prueba',
  excerpt: 'Resumen de la noticia de prueba.',
  image_url: 'https://example.test/image.webp',
  image_alt: 'Imagen de prueba',
  image_focus_x: 50,
  image_focus_y: 50,
  published_at: '2026-01-01T00:00:00Z',
  is_published: false,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ContentSection kind="news" userId="test-admin" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
beforeEach(() => {
  vi.mocked(data.listAdmin).mockResolvedValue([])
  vi.mocked(data.archiveContent).mockResolvedValue(undefined)
})

it('offers a direct creation action in the empty state and hides irrelevant pagination', async () => {
  mount()
  expect(
    await screen.findByRole('heading', {
      name: 'Tu próxima noticia empieza acá',
    }),
  ).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull()
  const region = screen.getByRole('region', { name: 'Administrar noticias' })
  fireEvent.click(within(region).getByRole('button', { name: 'Crear noticia' }))
  expect(
    await screen.findByRole('heading', { name: 'Crear noticia' }),
  ).toBeTruthy()
})
it('applies search on submit and keeps it when switching status filters', async () => {
  mount()
  await screen.findByRole('heading', { name: 'Tu próxima noticia empieza acá' })
  const calls = vi.mocked(data.listAdmin).mock.calls.length
  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Buscar por palabras' }),
    { target: { value: '  encuentro  ' } },
  )
  expect(data.listAdmin).toHaveBeenCalledTimes(calls)
  fireEvent.submit(screen.getByRole('search', { name: 'Buscar contenido' }))
  await waitFor(() =>
    expect(data.listAdmin).toHaveBeenLastCalledWith(
      'news',
      { state: 'all', search: 'encuentro', cursor: null },
      expect.anything(),
    ),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Borradores' }))
  await waitFor(() =>
    expect(data.listAdmin).toHaveBeenLastCalledWith(
      'news',
      { state: 'draft', search: 'encuentro', cursor: null },
      expect.anything(),
    ),
  )
  expect(
    screen
      .getByRole('button', { name: 'Borradores' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  expect(screen.getByRole('searchbox')).toHaveProperty('value', 'encuentro')
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
  await waitFor(() =>
    expect(data.listAdmin).toHaveBeenLastCalledWith(
      'news',
      { state: 'draft', search: '', cursor: null },
      expect.anything(),
    ),
  )
})
it('explains an empty trash without suggesting creation inside it', async () => {
  mount()
  await screen.findByRole('heading', { name: 'Tu próxima noticia empieza acá' })
  fireEvent.click(screen.getByRole('button', { name: 'Papelera' }))
  expect(
    await screen.findByRole('heading', { name: 'La papelera está vacía' }),
  ).toBeTruthy()
  expect(
    within(
      screen.getByRole('region', { name: 'Administrar noticias' }),
    ).queryByRole('button', { name: 'Crear noticia' }),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Ver contenido activo' }))
  await screen.findByRole('heading', { name: 'Tu próxima noticia empieza acá' })
  expect(
    screen
      .getByRole('button', { name: 'Activas' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
})
it('distinguishes a failed request from an empty list and lets the user retry', async () => {
  vi.mocked(data.listAdmin).mockRejectedValue(new Error('No se pudo conectar.'))
  mount()
  expect(
    await screen.findByRole('heading', {
      name: 'No pudimos cargar el contenido',
    }),
  ).toBeTruthy()
  expect(
    screen.queryByRole('heading', { name: 'Tu próxima noticia empieza acá' }),
  ).toBeNull()
  vi.mocked(data.listAdmin).mockResolvedValue([article])
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(
    await screen.findByRole('heading', { name: article.title }),
  ).toBeTruthy()
})
it('shows useful row details and retains confirmation for sending content to trash', async () => {
  vi.mocked(data.listAdmin).mockResolvedValue([article])
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  await screen.findByRole('heading', { name: article.title })
  expect(screen.getByText(article.excerpt)).toBeTruthy()
  expect(screen.getByText('Borrador')).toBeTruthy()
  expect(screen.getByText(/1 noticia en esta página/)).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull()
  fireEvent.click(
    screen.getByRole('button', {
      name: `Enviar «${article.title}» a la papelera`,
    }),
  )
  expect(data.archiveContent).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(
    screen.getByRole('button', {
      name: `Enviar «${article.title}» a la papelera`,
    }),
  )
  await waitFor(() =>
    expect(data.archiveContent).toHaveBeenCalledWith(
      'news',
      article.id,
      article.updated_at,
      false,
    ),
  )
})
it('keeps cursor pagination available when there is more than one page', async () => {
  const rows = Array.from({ length: 21 }, (_, index) => ({
    ...article,
    id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    title: `Noticia ${index + 1}`,
  }))
  vi.mocked(data.listAdmin).mockImplementation((_kind, filter) =>
    Promise.resolve(filter.cursor ? [rows[20]!] : rows),
  )
  mount()
  await screen.findByRole('heading', { name: 'Noticia 1' })
  expect(screen.queryByRole('heading', { name: 'Noticia 21' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  expect(
    await screen.findByRole('heading', { name: 'Noticia 21' }),
  ).toBeTruthy()
  expect(screen.getByText('Página 2')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
  expect(await screen.findByRole('heading', { name: 'Noticia 1' })).toBeTruthy()
})
