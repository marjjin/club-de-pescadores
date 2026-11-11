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
  vi.mocked(media.uploadClubMedia).mockResolvedValue({
    media: uploaded,
    bytes: 245_000,
    format: 'WebP',
  })
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
  fireEvent.change(screen.getByLabelText(/¿Cómo está el muelle?/), {
    target: { value: 'Agua clara' },
  })
  fireEvent.change(screen.getByLabelText(/Sumar fotos o videos/), {
    target: { files: [photo()] },
  })
  expect(await screen.findByText('Principal')).toBeTruthy()
  expect(screen.getByText('WebP · 239 KB')).toBeTruthy()
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
  let finish: (
    value: Awaited<ReturnType<typeof media.uploadClubMedia>>,
  ) => void = () => {}
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
  finish({ media: uploaded, bytes: 245_000, format: 'WebP' })
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
  await waitFor(() =>
    expect(media.removeClubMedia).toHaveBeenCalledWith([uploaded.path]),
  )
  expect(screen.queryByText('Principal')).toBeNull()
})

it('fills the conditions with one quick choice per group', () => {
  mount()
  const text = () =>
    screen.getByLabelText<HTMLTextAreaElement>(/¿Cómo está el muelle?/).value
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

it('starts from the last published height and warns when it did not change', async () => {
  vi.mocked(pier.listPierReports).mockResolvedValue([
    {
      id: '40000000-0000-4000-8000-000000000000',
      height_cm: 320,
      measured_at: new Date(Date.now() - 3_600_000).toISOString(),
      conditions: null,
      is_published: true,
      created_at: new Date().toISOString(),
      author_email: 'staff@example.test',
      media_count: 0,
    },
  ])
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  const input = await screen.findByDisplayValue('3,20')
  expect(screen.getByText('Igual que el último parte')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Subir 5 centímetros' }))
  expect(input).toHaveProperty('value', '3,25')
  expect(screen.getByText('Subió 5 cm')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Bajar 5 centímetros' }))
  fireEvent.click(screen.getByRole('button', { name: 'Publicar parte' }))
  expect(confirm).toHaveBeenLastCalledWith(
    expect.stringContaining('la misma del último parte'),
  )
  expect(pier.publishPierReport).not.toHaveBeenCalled()
})

it('restores an unsent report after a reload and lets staff start over', () => {
  localStorage.setItem(
    `club-draft:pier:${owner}`,
    JSON.stringify({
      savedAt: new Date(Date.now() - 60_000).toISOString(),
      data: {
        version: null,
        values: { height: '3,40', conditions: 'Se puede pescar' },
        extra: [uploaded],
      },
    }),
  )
  mount()
  expect(screen.getByText('Recuperamos tu borrador')).toBeTruthy()
  expect(screen.getByDisplayValue('3,40')).toBeTruthy()
  expect(screen.getByDisplayValue('Se puede pescar')).toBeTruthy()
  expect(screen.getByText('Principal')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Empezar de cero' }))
  expect(screen.queryByText('Recuperamos tu borrador')).toBeNull()
  expect(media.removeClubMedia).toHaveBeenCalledWith([uploaded.path])
  expect(localStorage.getItem(`club-draft:pier:${owner}`)).toBeNull()
})
