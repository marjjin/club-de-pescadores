import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeAll, expect, it } from 'vitest'
import { mockResponse } from '@/test/content-api'
import { PierReportSection } from './PierReportSection'

const owner = '10000000-0000-4000-8000-000000000010'
const report = {
  id: '40000000-0000-4000-8000-000000000000',
  height_cm: 330,
  measured_at: '2026-11-11T13:30:00+00:00',
  conditions: 'Se puede pescar, muchos camalotes, agua del color del mate.',
  created_at: '2026-11-11T13:30:00+00:00',
  media_items: [
    {
      kind: 'image',
      path: `${owner}/20000000-0000-4000-8000-000000000000.webp`,
      poster_path: null,
      width: 1600,
      height: 1200,
      alt: 'Muelle del club',
      position: 0,
    },
    {
      kind: 'video',
      path: `${owner}/30000000-0000-4000-8000-000000000000.mp4`,
      poster_path: `${owner}/30000000-0000-4000-8000-000000000000.webp`,
      width: 1280,
      height: 720,
      alt: 'Video del muelle',
      position: 1,
    },
  ],
}
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true
    },
  })
})
function mount() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PierReportSection />
    </QueryClientProvider>,
  )
}

it('shows the latest report with its height, conditions and gallery', async () => {
  mockResponse([report])
  mount()
  expect(await screen.findByText('3,30 m')).toBeTruthy()
  expect(screen.getByText('Se puede pescar')).toBeTruthy()
  // Quick phrases become chips; the staff's own words stay as a note.
  expect(
    within(screen.getByRole('list', { name: 'Condiciones' })).getByText(
      'Muchos camalotes',
    ),
  ).toBeTruthy()
  expect(screen.getByText('Agua del color del mate')).toBeTruthy()
  const video = screen.getByRole('button', {
    name: 'Reproducir video 2 de 2: Video del muelle',
  })
  // The video file is not requested until the visitor opens it.
  expect(document.querySelector('video')).toBeNull()
  fireEvent.click(video)
  expect(document.querySelector('video')?.getAttribute('src')).toContain(
    '30000000-0000-4000-8000-000000000000.mp4',
  )
  expect(screen.getByText('2 de 2')).toBeTruthy()
})

it('renders nothing until the first report exists', async () => {
  mockResponse([])
  mount()
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(screen.queryByRole('region', { name: 'Hoy en el muelle' })).toBeNull()
})
