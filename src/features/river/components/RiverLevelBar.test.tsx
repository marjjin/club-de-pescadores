import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it } from 'vitest'
import { mockResponse } from '@/test/content-api'
import { riverRow } from '@/test/river'
import { RiverLevelBar } from './RiverLevelBar'

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <RiverLevelBar />
    </QueryClientProvider>,
  )
}
it('shows source, Argentina measurement time and the age of the last published reading', async () => {
  mockResponse([riverRow])
  mount()
  expect(await screen.findByText('2,34 m')).toBeTruthy()
  expect(screen.getByText('Estación de prueba')).toBeTruthy()
  expect(screen.getByText('Fuente: Fuente de prueba')).toBeTruthy()
  expect(screen.getByText('01/01/2026, 10:30')).toBeTruthy()
  expect(screen.getByText('Medición de hace más de 24 h')).toBeTruthy()
})
it('does not invent a level when there is no published measurement', async () => {
  mockResponse([])
  mount()
  expect(
    await screen.findByText('Todavía no hay una medición publicada.'),
  ).toBeTruthy()
  expect(screen.queryByText('0,00 m')).toBeNull()
})
it('keeps pier conditions out of the river measurement bar', async () => {
  mockResponse([{ ...riverRow, note: 'Condiciones del muelle de prueba' }])
  mount()
  await screen.findByText('2,34 m')
  expect(screen.queryByText('Condiciones del muelle de prueba')).toBeNull()
})
it('recovers from a failed request with an explicit retry', async () => {
  mockResponse({ message: 'private technical details' }, 500)
  mount()
  await screen.findByText('No pudimos consultar la altura del río.')
  expect(screen.queryByText('private technical details')).toBeNull()
  mockResponse([riverRow])
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar medición' }))
  expect(await screen.findByText('2,34 m')).toBeTruthy()
})
