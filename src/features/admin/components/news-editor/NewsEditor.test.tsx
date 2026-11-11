import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeAll, beforeEach, expect, it, vi } from 'vitest'
import * as data from '../../api/data'
import * as images from '../../api/images'
import { NewsEditor } from './NewsEditor'

vi.mock('../../api/data', () => ({
  saveContent: vi.fn(),
  archiveContent: vi.fn(),
}))
vi.mock('../../api/images', async (original) => ({
  newsImagePath: (await original<typeof images>()).newsImagePath,
  uploadNewsImage: vi.fn(),
  removeNewsImages: vi.fn(),
}))
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false
      this.dispatchEvent(new Event('close'))
    },
  })
})
beforeEach(() => {
  vi.mocked(data.saveContent).mockResolvedValue(undefined)
})
function mount(onClose = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <NewsEditor row={null} onClose={onClose} />
    </QueryClientProvider>,
  )
  return onClose
}
function fill() {
  fireEvent.change(screen.getByRole('textbox', { name: 'Título' }), {
    target: { value: 'Encuentro de prueba' },
  })
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Texto de la noticia' }),
    {
      target: { value: 'Texto de prueba para la noticia.' },
    },
  )
  fireEvent.click(screen.getByText('Usar un enlace de imagen'))
  fireEvent.change(screen.getByLabelText('URL de la imagen'), {
    target: { value: 'https://example.test/image.webp' },
  })
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Descripción de la imagen' }),
    {
      target: { value: 'Una imagen de prueba' },
    },
  )
}
it('saves a draft without asking for a publication date or confirmation', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const close = mount()
  fill()
  expect(screen.queryByLabelText('Fecha y hora de publicación')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  await waitFor(() =>
    expect(data.saveContent).toHaveBeenCalledWith(
      'news',
      expect.objectContaining({
        title: 'Encuentro de prueba',
        is_published: false,
      }),
      null,
      null,
    ),
  )
  await waitFor(() => expect(close).toHaveBeenCalled())
  expect(confirm).not.toHaveBeenCalled()
})
it('focuses and describes the first invalid field instead of sending an incomplete record', async () => {
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  expect(
    await screen.findByText('Escribí un título para la noticia.'),
  ).toBeTruthy()
  const title = screen.getByRole('textbox', { name: 'Título' })
  expect(title.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(title)
  expect(data.saveContent).not.toHaveBeenCalled()
})
it('keeps publication behind an explicit confirmation', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  fill()
  fireEvent.click(screen.getByRole('radio', { name: /^Publicar ahora/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Publicar noticia' }))
  expect(confirm).toHaveBeenCalled()
  expect(data.saveContent).not.toHaveBeenCalled()
})
it('requires a future schedule and sends Argentina time correctly', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  mount()
  fill()
  fireEvent.click(screen.getByRole('radio', { name: /^Programar publicación/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Programar noticia' }))
  expect(
    await screen.findByText(
      'Elegí una fecha y hora futuras para programar la noticia.',
    ),
  ).toBeTruthy()
  expect(data.saveContent).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Fecha y hora de publicación'), {
    target: { value: '2099-01-02T10:30' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Programar noticia' }))
  await waitFor(() =>
    expect(data.saveContent).toHaveBeenCalledWith(
      'news',
      expect.objectContaining({
        is_published: true,
        published_at: '2099-01-02T13:30:00.000Z',
      }),
      null,
      null,
    ),
  )
})
it('updates the live preview and opens the full preview without saving', async () => {
  mount()
  fireEvent.change(screen.getByRole('textbox', { name: 'Título' }), {
    target: { value: 'Vista de prueba' },
  })
  expect(
    within(
      screen.getByRole('region', { name: 'Vista previa en vivo' }),
    ).getByRole('heading', { name: 'Vista de prueba' }),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }))
  const dialog = await screen.findByRole('dialog', {
    name: 'Vista previa de la noticia',
  })
  expect(
    within(dialog).getByRole('heading', { name: 'Vista de prueba' }),
  ).toBeTruthy()
  expect(data.saveContent).not.toHaveBeenCalled()
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Cerrar vista previa' }),
  )
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})
it('protects unsaved changes when leaving the editor', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const close = mount()
  fireEvent.change(screen.getByRole('textbox', { name: 'Título' }), {
    target: { value: 'Cambios de prueba' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Volver a noticias' }))
  expect(close).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
})
it('accepts a dropped image and prevents saving until the upload finishes', async () => {
  let finish: (url: string) => void = () => {}
  const uploading = new Promise<string>((resolve) => {
    finish = resolve
  })
  vi.mocked(images.uploadNewsImage).mockReturnValue(uploading)
  mount()
  const file = new File(['fixture'], 'photo.png', { type: 'image/png' })
  fireEvent.drop(screen.getByText('Elegir una imagen').closest('label')!, {
    dataTransfer: { files: [file] },
  })
  await waitFor(() =>
    expect(images.uploadNewsImage).toHaveBeenCalledWith(
      file,
      expect.anything(),
    ),
  )
  expect(
    screen.getByRole('button', { name: 'Guardar borrador' }),
  ).toHaveProperty('disabled', true)
  await act(async () => {
    finish('https://example.test/uploaded.webp')
    await uploading
  })
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Guardar borrador' }),
    ).toHaveProperty('disabled', false),
  )
  expect(screen.getByLabelText('URL de la imagen')).toHaveProperty(
    'value',
    'https://example.test/uploaded.webp',
  )
  expect(data.saveContent).not.toHaveBeenCalled()
})

it('removes an uploaded cover from Storage when the editor closes without saving', async () => {
  const uploaded =
    'https://project.supabase.co/storage/v1/object/public/news-images/10000000-0000-4000-8000-000000000010/20000000-0000-4000-8000-000000000000.webp'
  vi.mocked(images.uploadNewsImage).mockResolvedValue(uploaded)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const close = mount()
  fireEvent.drop(screen.getByText('Elegir una imagen').closest('label')!, {
    dataTransfer: {
      files: [new File(['fixture'], 'photo.png', { type: 'image/png' })],
    },
  })
  await waitFor(() =>
    expect(screen.getByLabelText('URL de la imagen')).toHaveProperty(
      'value',
      uploaded,
    ),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
  expect(images.removeNewsImages).toHaveBeenCalledWith([
    '10000000-0000-4000-8000-000000000010/20000000-0000-4000-8000-000000000000.webp',
  ])
})

it('starts the next new article empty after saving one', async () => {
  const close = mount()
  fill()
  // Let the debounced draft reach storage, as it does while someone types.
  await waitFor(() =>
    expect(localStorage.getItem('club-draft:news:new')).not.toBeNull(),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  await waitFor(() => expect(close).toHaveBeenCalled())
  expect(localStorage.getItem('club-draft:news:new')).toBeNull()
  cleanup()
  mount()
  expect(screen.getByRole('textbox', { name: 'Título' })).toHaveProperty(
    'value',
    '',
  )
  expect(screen.queryByText('Recuperamos tu borrador')).toBeNull()
})
