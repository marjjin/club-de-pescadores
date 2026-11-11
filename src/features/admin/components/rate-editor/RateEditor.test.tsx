import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as data from '../../api/data'
import type { Rate } from '../../schemas/admin'
import { ContentEditor } from '../ContentEditor'

vi.mock('../../api/data', () => ({
  saveContent: vi.fn(),
  archiveContent: vi.fn(),
}))
beforeEach(() => {
  vi.mocked(data.saveContent).mockResolvedValue(undefined)
})
function mount(row: Rate | null = null) {
  const onClose = vi.fn()
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ContentEditor kind="pool_rates" row={row} onClose={onClose} />
    </QueryClientProvider>,
  )
  return onClose
}
function fill() {
  const fields = [
    ['Temporada', 'Temporada de prueba'],
    ['Período', 'Día'],
    ['Precio familiar (ARS)', '1234,50'],
    ['Precio individual (ARS)', '0.29'],
    ['Condiciones del grupo familiar', 'Condiciones de prueba'],
    ['Vigente desde', '2030-01-01'],
  ] as const
  for (const [name, value] of fields)
    fireEvent.change(screen.getByLabelText(name, { exact: false }), {
      target: { value },
    })
}

it('saves a draft with exact prices, optional dates and no confirmation', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const close = mount()
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  await waitFor(() =>
    expect(data.saveContent).toHaveBeenCalledWith(
      'pool_rates',
      {
        season: 'Temporada de prueba',
        period: 'Día',
        family_price_cents: 123450,
        individual_price_cents: 29,
        family_description: 'Condiciones de prueba',
        discount_note: null,
        valid_from: '2030-01-01',
        valid_until: null,
        is_published: false,
      },
      null,
      null,
    ),
  )
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
  expect(confirm).not.toHaveBeenCalled()
})

it('focuses and describes invalid fields and blocks invalid date ranges', () => {
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  const season = screen.getByRole('textbox', { name: 'Temporada' })
  expect(season.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement).toBe(season)
  fill()
  fireEvent.change(screen.getByLabelText(/Vigente hasta/), {
    target: { value: '2029-01-01' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  expect(
    screen.getByText('La fecha final debe ser posterior al inicio.'),
  ).toBeTruthy()
  expect(document.activeElement).toBe(screen.getByLabelText(/Vigente hasta/))
  expect(data.saveContent).not.toHaveBeenCalled()
})

it('updates the preview while typing and keeps publication behind confirmation', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  fill()
  const preview = within(
    screen.getByRole('region', { name: 'Vista previa de la tarifa' }),
  )
  expect(
    preview.getByRole('heading', { name: 'Temporada de prueba · Día' }),
  ).toBeTruthy()
  expect(preview.getByText(/1.234,50/)).toBeTruthy()
  fireEvent.click(screen.getByRole('radio', { name: /^Publicar en el sitio/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Publicar tarifa' }))
  expect(confirm).toHaveBeenCalled()
  expect(data.saveContent).not.toHaveBeenCalled()
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Publicar tarifa' }))
  await waitFor(() =>
    expect(data.saveContent).toHaveBeenCalledWith(
      'pool_rates',
      expect.objectContaining({ is_published: true }),
      null,
      null,
    ),
  )
})

it('protects unsaved changes and allows discarding them explicitly', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const close = mount()
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Volver a tarifas' }))
  expect(close).not.toHaveBeenCalled()
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  // Unsaved work is kept as a draft instead of blocking the reload natively.
  expect(event.defaultPrevented).toBe(false)
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
})

it('preserves existing amounts and version and confirms removing a published rate', async () => {
  const row: Rate = {
    id: '30000000-0000-4000-8000-000000000001',
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-02T00:00:00Z',
    season: 'Temporada existente',
    period: 'Día',
    family_price_cents: 2147483647,
    individual_price_cents: 0,
    family_description: 'Condiciones',
    discount_note: null,
    valid_from: '2030-01-01',
    valid_until: null,
    is_published: true,
    deleted_at: null,
  }
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount(row)
  expect(
    screen.getByRole('textbox', { name: 'Precio familiar (ARS)' }),
  ).toHaveProperty('value', '21474836.47')
  expect(
    screen.getByRole('textbox', { name: 'Precio individual (ARS)' }),
  ).toHaveProperty('value', '0.00')
  fireEvent.click(screen.getByRole('radio', { name: /^Guardar como borrador/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  expect(data.saveContent).not.toHaveBeenCalled()
  expect(confirm).toHaveBeenCalledWith(
    '¿Retirar esta tarifa del sitio y guardarla como borrador?',
  )
  confirm.mockReturnValue(true)
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  await waitFor(() =>
    expect(data.saveContent).toHaveBeenCalledWith(
      'pool_rates',
      expect.objectContaining({
        family_price_cents: 2147483647,
        individual_price_cents: 0,
        is_published: false,
      }),
      row.id,
      row.updated_at,
    ),
  )
})

it('disables duplicate saves and keeps the entered values after a recoverable error', async () => {
  let fail: (error: Error) => void = () => {}
  vi.mocked(data.saveContent).mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        fail = reject
      }),
  )
  const close = mount()
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Guardando…' })).toHaveProperty(
      'disabled',
      true,
    ),
  )
  expect(
    screen.getByRole('textbox', { name: 'Temporada' }).closest('fieldset'),
  ).toHaveProperty('disabled', true)
  await act(async () => {
    fail(new Error('No se pudo guardar. Intentá nuevamente.'))
    await Promise.resolve()
  })
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'No se pudo guardar. Intentá nuevamente.',
  )
  expect(screen.getByRole('textbox', { name: 'Temporada' })).toHaveProperty(
    'value',
    'Temporada de prueba',
  )
  expect(close).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  await waitFor(() => expect(close).toHaveBeenCalledOnce())
})
