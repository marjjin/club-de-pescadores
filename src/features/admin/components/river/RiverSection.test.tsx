import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as api from '../../api/river'
import { riverRow } from '@/test/river'
import { RiverSection } from './RiverSection'

vi.mock('../../api/river', () => ({
  getAdminRiverLevel: vi.fn(),
  saveRiverLevel: vi.fn(),
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.getAdminRiverLevel).mockResolvedValue(null)
  vi.mocked(api.saveRiverLevel).mockResolvedValue(riverRow)
})
afterEach(() => vi.restoreAllMocks())
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RiverSection userId="root-test" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
async function fill() {
  fireEvent.change(await screen.findByLabelText('Altura en metros'), {
    target: { value: '2,34' },
  })
  for (const [name, value] of [
    ['Punto de medición', 'Estación de prueba'],
    ['Fuente de la medición', 'Fuente de prueba'],
    ['Fecha y hora de medición', '2026-01-01T10:30'],
  ] as const)
    fireEvent.change(screen.getByLabelText(name), { target: { value } })
}
it('focuses invalid fields without saving an incomplete measurement', async () => {
  mount()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Guardar sin publicar' }),
  )
  expect(document.activeElement).toBe(screen.getByLabelText('Altura en metros'))
  expect(
    screen.getByLabelText('Altura en metros').getAttribute('aria-invalid'),
  ).toBe('true')
  expect(api.saveRiverLevel).not.toHaveBeenCalled()
  expect(screen.queryByRole('textbox', { name: /aclaración/i })).toBeNull()
  expect(
    screen.queryByRole('textbox', { name: 'Texto de la noticia' }),
  ).toBeNull()
})
it('confirms publication, preserves exact units and carries the saved version into the next edit', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  await fill()
  fireEvent.click(
    screen.getByRole('radio', { name: /Mostrar en el sitio público/ }),
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar y publicar medición' }),
  )
  expect(api.saveRiverLevel).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar y publicar medición' }),
  )
  await waitFor(() =>
    expect(api.saveRiverLevel).toHaveBeenCalledWith(
      {
        version: null,
        input: {
          height_cm: 234,
          measured_at: '2026-01-01T13:30:00.000Z',
          station: 'Estación de prueba',
          source: 'Fuente de prueba',
          note: null,
          is_published: true,
        },
      },
      expect.anything(),
    ),
  )
  await screen.findByText('Medición guardada y publicada en el sitio.')
  fireEvent.change(screen.getByLabelText('Altura en metros'), {
    target: { value: '-0,29' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar y publicar medición' }),
  )
  await waitFor(() => expect(api.saveRiverLevel).toHaveBeenCalledTimes(2))
  const last = vi.mocked(api.saveRiverLevel).mock.calls.at(-1)?.[0]
  expect(last?.version).toBe(riverRow.updated_at)
  expect(last?.input.height_cm).toBe(-29)
})
it('keeps entered data when saving fails and protects against closing the page', async () => {
  vi.mocked(api.saveRiverLevel).mockRejectedValue(
    new Error('Otra persona modificó esta medición. Recargá los datos.'),
  )
  mount()
  await fill()
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sin publicar' }))
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Otra persona modificó esta medición. Recargá los datos.',
  )
  expect(screen.getByLabelText('Altura en metros')).toHaveProperty(
    'value',
    '2,34',
  )
})
it('can retry an initial load failure without discarding an existing form silently', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.mocked(api.getAdminRiverLevel).mockRejectedValueOnce(
    new Error('No se pudo cargar.'),
  )
  mount()
  await screen.findByText('No se pudo cargar.')
  fireEvent.click(
    screen.getByRole('button', { name: 'Recargar medición guardada' }),
  )
  expect(await screen.findByLabelText('Altura en metros')).toBeTruthy()
})

it('previews the entered height, source and Argentina time without inventing an initial reading', async () => {
  mount()
  await screen.findByText('Cargá la primera medición')
  const preview = screen.getByRole('region', {
    name: 'Vista previa de la medición',
  })
  expect(within(preview).getByText('— m')).toBeTruthy()
  expect(within(preview).queryByText('0,00 m')).toBeNull()
  await fill()
  expect(within(preview).getByText('2,34 m')).toBeTruthy()
  expect(within(preview).getByText('Estación de prueba')).toBeTruthy()
  expect(within(preview).getByText('Fuente de prueba')).toBeTruthy()
  expect(within(preview).getByText('01/01/2026, 10:30')).toBeTruthy()
  expect(within(preview).getByText('Medición de hace más de 24 h')).toBeTruthy()
  expect(screen.getByText('Cargá la primera medición')).toBeTruthy()
  expect(api.saveRiverLevel).not.toHaveBeenCalled()
})

it('keeps the published reading separate from the unsaved preview and confirms discarding edits', async () => {
  vi.mocked(api.getAdminRiverLevel).mockResolvedValue(riverRow)
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  const height =
    await screen.findByLabelText<HTMLInputElement>('Altura en metros')
  fireEvent.change(height, { target: { value: '1,23' } })
  fireEvent.change(screen.getByLabelText('Fuente de la medición'), {
    target: { value: 'Otra fuente de prueba' },
  })
  const saved = screen.getByRole('region', { name: 'Medición guardada' })
  const preview = screen.getByRole('region', {
    name: 'Vista previa de la medición',
  })
  expect(within(saved).getByText('2,34 m')).toBeTruthy()
  expect(within(saved).getByText('Publicada en el sitio')).toBeTruthy()
  expect(within(preview).getByText('1,23 m')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }))
  expect(height.value).toBe('1,23')
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }))
  expect(height.value).toBe('2,34')
  expect(screen.getByLabelText('Fuente de la medición')).toHaveProperty(
    'value',
    riverRow.source,
  )
  expect(document.activeElement).toBe(height)
  expect(screen.queryByRole('button', { name: 'Descartar cambios' })).toBeNull()
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  expect(api.saveRiverLevel).not.toHaveBeenCalled()
})

it('flags a future measurement in the preview and focuses its date before saving', async () => {
  mount()
  await fill()
  const date = screen.getByLabelText('Fecha y hora de medición')
  fireEvent.change(date, { target: { value: '2999-01-01T10:30' } })
  expect(
    screen.getByText('La fecha es futura. Corregila antes de guardar.'),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sin publicar' }))
  expect(date.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(date)
  expect(api.saveRiverLevel).not.toHaveBeenCalled()
})

it('confirms withdrawing a published reading and sends the original version and legacy note', async () => {
  const previous = { ...riverRow, note: 'Referencia histórica de prueba' }
  vi.mocked(api.getAdminRiverLevel).mockResolvedValue(previous)
  vi.mocked(api.saveRiverLevel).mockResolvedValue({
    ...previous,
    is_published: false,
  })
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  fireEvent.click(
    await screen.findByRole('radio', { name: /Guardar sin publicar/ }),
  )
  expect(
    screen.getByText(
      'Al guardar, la medición actual dejará de verse en la página pública.',
    ),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sin publicar' }))
  expect(api.saveRiverLevel).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sin publicar' }))
  expect((await screen.findByRole('status')).textContent).toBe(
    'Medición guardada sin publicar. Solo está visible en el panel.',
  )
  const payload = vi.mocked(api.saveRiverLevel).mock.calls[0]?.[0]
  expect(payload?.version).toBe(previous.updated_at)
  expect(payload?.input.is_published).toBe(false)
  expect(payload?.input.note).toBe(previous.note)
  expect(
    within(screen.getByRole('region', { name: 'Medición guardada' })).getByText(
      'Sin publicar',
    ),
  ).toBeTruthy()
  expect(screen.queryByText(previous.note)).toBeNull()
})

it('disables editing, reload and repeated submissions while a save is in progress', async () => {
  let finish: (value: typeof riverRow) => void = () => {}
  const request = new Promise<typeof riverRow>((resolve) => {
    finish = resolve
  })
  vi.mocked(api.saveRiverLevel).mockReturnValue(request)
  mount()
  await fill()
  const form = screen.getByRole('form', { name: 'Actualizar altura del río' })
  fireEvent.submit(form)
  await screen.findByRole('button', { name: 'Guardando…' })
  expect(screen.getByLabelText('Altura en metros').matches(':disabled')).toBe(
    true,
  )
  expect(
    screen.getByRole('button', { name: 'Descartar cambios' }),
  ).toHaveProperty('disabled', true)
  expect(
    screen.getByRole('button', { name: 'Recargar medición guardada' }),
  ).toHaveProperty('disabled', true)
  fireEvent.submit(form)
  expect(api.saveRiverLevel).toHaveBeenCalledOnce()
  await act(async () => {
    finish(riverRow)
    await request
  })
  await screen.findByText('Sin cambios pendientes')
  expect(screen.getByLabelText('Altura en metros').matches(':disabled')).toBe(
    false,
  )
})
