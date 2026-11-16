import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { requestUrl } from '@/test/content-api'
import { FacilitiesSection } from './FacilitiesSection'

const owner = '10000000-0000-4000-8000-000000000010'
const uploaded = `${owner}/20000000-0000-4000-8000-000000000000.webp`
const section = [
  { title: 'Nuestras instalaciones', description: 'Junto al río.' },
]
const cards = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    name: 'Pileta',
    description: 'Para el verano.',
    image_path: uploaded,
    default_image: null,
    image_alt: 'Pileta del club',
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    name: 'Muelle',
    description: 'Sobre el río.',
    image_path: null,
    default_image: 'pier',
    image_alt: 'Muelle con baranda',
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
      <FacilitiesSection />
    </QueryClientProvider>,
  )
}
afterEach(() => {
  vi.unstubAllGlobals()
})

it('shows the heading and cards edited from the panel, in order', async () => {
  stub((table) => json(table === 'facility_sections' ? section : cards))
  mount()
  expect(
    screen.getByRole('status', { name: 'Cargando instalaciones' }),
  ).toBeTruthy()
  expect(
    await screen.findByRole('heading', { name: 'Nuestras instalaciones' }),
  ).toBeTruthy()
  const list = screen.getByRole('list', { name: 'Instalaciones del club' })
  expect(
    within(list)
      .getAllByRole('heading')
      .map((heading) => heading.textContent),
  ).toEqual(['Pileta', 'Muelle'])
  const photo = within(list).getByRole('img', { name: 'Pileta del club' })
  expect(photo.getAttribute('src')).toContain(
    `/storage/v1/object/public/club-media/${uploaded}`,
  )
  expect(
    within(list)
      .getByRole('img', { name: 'Muelle con baranda' })
      .getAttribute('src'),
  ).not.toContain('/storage/')
})

it('keeps the original section when the database cannot be read', async () => {
  // 400, not 503: the client retries 503 responses with a backoff.
  stub(() => json({ message: 'unavailable' }, 400))
  mount()
  expect(
    await screen.findByRole('heading', {
      name: 'Un espacio pensado para los socios',
    }),
  ).toBeTruthy()
  expect(
    within(screen.getByRole('list', { name: 'Instalaciones del club' }))
      .getAllByRole('heading')
      .map((heading) => heading.textContent),
  ).toEqual(['Muelle', 'Quincho', 'Parrillas', 'Entorno natural'])
})

it('never renders rows that break the expected shape', async () => {
  stub((table) =>
    json(
      table === 'facility_sections'
        ? section
        : [{ ...cards[0], image_path: 'https://evil.example/x.webp' }],
    ),
  )
  mount()
  expect(
    await screen.findByRole('heading', {
      name: 'Un espacio pensado para los socios',
    }),
  ).toBeTruthy()
})
