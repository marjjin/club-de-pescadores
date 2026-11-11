import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as media from '../../api/media'
import * as pier from '../../api/pier'
import { PierReportForm } from './PierReportForm'

vi.mock('../../api/pier', () => ({
  publishPierReport: vi.fn(),
  listPierReports: vi.fn(),
  setPierReportPublished: vi.fn(),
}))
vi.mock('../../api/media', () => ({
  uploadClubMedia: vi.fn(),
  removeClubMedia: vi.fn(),
  pruneClubMedia: vi.fn(),
  clubMediaUrl: (path: string) => `https://cdn.test/${path}`,
  isVideoFile: (file: File) => file.type.startsWith('video/'),
  mediaFiles: (items: { path: string }[]) => items.map((item) => item.path),
}))
const owner = '10000000-0000-4000-8000-000000000010'
const uploaded = {
  kind: 'image' as const,
  path: `${owner}/20000000-0000-4000-8000-000000000000.webp`,
  width: 1600,
  height: 1200,
}
beforeEach(() => {
  vi.mocked(pier.publishPierReport).mockResolvedValue({})
  vi.mocked(pier.listPierReports).mockResolvedValue([])
  vi.mocked(media.uploadClubMedia).mockResolvedValue(uploaded)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
function mount() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { mutations: { retry: false } },
        })
      }
    >
      <PierReportForm userId={owner} />
    </QueryClientProvider>,
  )
}
const photo = () => new File(['x'], 'muelle.jpg', { type: 'image/jpeg' })

it('publishes height, conditions and photos in one step after confirmation', async () => {
  mount()
  fireEvent.change(screen.getByLabelText(/Altura del río/), {
    target: { value: '3,30' },
  })
  fireEvent.change(screen.getByLabelText('¿Cómo está el muelle?'), {
    target: { value: 'Agua clara' },
  })
  fireEvent.change(screen.getByLabelText(/Sumar fotos o videos/), {
    target: { files: [photo()] },
  })
  expect(await screen.findByText('Principal')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Publicar parte' }))
  await waitFor(() => expect(pier.publishPierReport).toHaveBeenCalled())
  const sent = vi.mocked(pier.publishPierReport).mock.calls[0]?.[0]
  expect(sent).toMatchObject({
    height_cm: 330,
    conditions: 'Agua clara',
    media: [{ path: uploaded.path }],
  })
  expect(sent?.media[0]?.alt).toContain('Muelle')
  expect(await screen.findByText('Parte publicado')).toBeTruthy()
})

it('blocks publishing while files upload and explains a missing height', async () => {
  let finish: (value: typeof uploaded) => void = () => {}
  vi.mocked(media.uploadClubMedia).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  mount()
  fireEvent.change(screen.getByLabelText(/Sumar fotos o videos/), {
    target: { files: [photo()] },
  })
  expect(
    await screen.findByRole('button', { name: 'Esperando archivos…' }),
  ).toHaveProperty('disabled', true)
  finish(uploaded)
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar parte' }))
  expect(await screen.findByText(/Ingresá la altura en metros/)).toBeTruthy()
  expect(pier.publishPierReport).not.toHaveBeenCalled()
})

it('removes uploaded files from storage when the report is discarded', async () => {
  mount()
  fireEvent.change(screen.getByLabelText(/Sumar fotos o videos/), {
    target: { files: [photo()] },
  })
  await screen.findByText('Principal')
  fireEvent.click(screen.getByRole('button', { name: 'Descartar' }))
  expect(media.removeClubMedia).toHaveBeenCalledWith([uploaded.path])
  expect(screen.queryByText('Principal')).toBeNull()
})

it('fills the conditions with one quick choice per group', () => {
  mount()
  const text = () =>
    screen.getByLabelText<HTMLTextAreaElement>('¿Cómo está el muelle?').value
  fireEvent.click(screen.getByRole('button', { name: 'Se puede pescar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Muchos camalotes' }))
  expect(text()).toBe('Se puede pescar, muchos camalotes')
  fireEvent.click(screen.getByRole('button', { name: 'No se puede pescar' }))
  expect(text()).toBe('Muchos camalotes, no se puede pescar')
  expect(
    screen
      .getByRole('button', { name: 'No se puede pescar' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  expect(screen.queryByRole('button', { name: /Agua clara/ })).toBeNull()
})
