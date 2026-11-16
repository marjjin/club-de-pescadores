import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import * as api from '../../api/facilities'
import { AccessContext } from '../../hooks/useAccess'
import type { AdminFacilities } from '../../schemas/facilities'
import { FacilitiesSection } from './FacilitiesSection'

vi.mock('../../api/facilities', () => ({
  getAdminFacilities: vi.fn(),
  saveFacilities: vi.fn(),
  uploadFacilityPhoto: vi.fn(),
}))
vi.mock('../../api/media', () => ({ pruneClubMedia: vi.fn() }))

const userId = '10000000-0000-4000-8000-000000000010'
const uploaded = `${userId}/20000000-0000-4000-8000-000000000000.webp`
const data: AdminFacilities = {
  title: 'Un espacio pensado para los socios',
  description: 'Todo lo que necesitás.',
  updated_at: '2026-11-17T12:00:00Z',
  cards: [
    {
      id: '50000000-0000-4000-8000-000000000001',
      name: 'Muelle',
      description: 'Acceso al río.',
      image_path: null,
      default_image: 'pier',
      image_alt: 'Muelle con baranda',
    },
    {
      id: '50000000-0000-4000-8000-000000000002',
      name: 'Quincho',
      description: 'Para reuniones.',
      image_path: null,
      default_image: 'hall',
      image_alt: 'Quincho amarillo',
    },
  ],
}
beforeEach(() => {
  vi.mocked(api.getAdminFacilities).mockResolvedValue(data)
  vi.mocked(api.saveFacilities).mockResolvedValue({
    ...data,
    updated_at: '2026-11-17T13:00:00Z',
  })
  vi.mocked(api.uploadFacilityPhoto).mockResolvedValue(uploaded)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
function mount(permissions: string[] | null = null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AccessContext.Provider
        value={
          permissions
            ? { general: false, permissions }
            : { general: true, permissions: [] }
        }
      >
        <FacilitiesSection userId={userId} />
      </AccessContext.Provider>
    </QueryClientProvider>,
  )
}
const cards = () =>
  within(screen.getByRole('list', { name: 'Tarjetas de instalaciones' }))
const publish = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Publicar cambios' }))

it('validates new cards before publishing and never saves an incomplete one', async () => {
  mount()
  await screen.findByDisplayValue('Muelle')
  expect(
    screen.getByRole('button', { name: 'Publicar cambios' }),
  ).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: 'Agregar tarjeta' }))
  publish()
  expect(await screen.findByText('Subí una foto.')).toBeTruthy()
  expect(screen.getByText('Completá el título.')).toBeTruthy()
  expect(api.saveFacilities).not.toHaveBeenCalled()
})

it('uploads a photo, reorders and publishes the whole section with its version', async () => {
  mount()
  await screen.findByDisplayValue('Muelle')
  fireEvent.change(screen.getByLabelText('Título de la sección'), {
    target: { value: 'Nuestras instalaciones' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Agregar tarjeta' }))
  const added = cards().getAllByRole('listitem')[2]!
  const file = new File(['x'], 'pileta.jpg', { type: 'image/jpeg' })
  fireEvent.change(within(added).getByLabelText('Subir foto'), {
    target: { files: [file] },
  })
  await waitFor(() =>
    expect(api.uploadFacilityPhoto).toHaveBeenCalledWith(file),
  )
  await within(added).findByText('Cambiar foto')
  fireEvent.change(within(added).getByLabelText('Título'), {
    target: { value: 'Pileta' },
  })
  fireEvent.change(within(added).getByLabelText('Descripción'), {
    target: { value: 'Para el verano.' },
  })
  fireEvent.change(within(added).getByLabelText(/^Descripción de la foto/), {
    target: { value: 'Pileta del club' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Mover «Pileta» antes' }))
  publish()
  await screen.findByText('Listo: la sección ya se actualizó en el sitio.')
  expect(api.saveFacilities).toHaveBeenCalledWith(
    {
      title: 'Nuestras instalaciones',
      description: data.description,
      cards: [
        expect.objectContaining({ id: data.cards[0]!.id }),
        {
          id: null,
          name: 'Pileta',
          description: 'Para el verano.',
          image_path: uploaded,
          default_image: null,
          image_alt: 'Pileta del club',
        },
        expect.objectContaining({ id: data.cards[1]!.id }),
      ],
    },
    data.updated_at,
  )
})

it('asks before removing a card and keeps at least one', async () => {
  mount()
  await screen.findByDisplayValue('Muelle')
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
  fireEvent.click(screen.getByRole('button', { name: 'Quitar «Quincho»' }))
  await waitFor(() => expect(confirm).toHaveBeenCalled())
  expect(screen.getByDisplayValue('Quincho')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Quitar «Quincho»' }))
  await waitFor(() => expect(screen.queryByDisplayValue('Quincho')).toBeNull())
  expect(
    screen.getByRole('button', { name: 'Quitar «Muelle»' }),
  ).toHaveProperty('disabled', true)
})

it('shows the section read-only to roles that can only view it', async () => {
  mount(['instalaciones.ver'])
  await screen.findByDisplayValue('Muelle')
  expect(
    screen.getByText('Tu rol permite ver esta sección pero no modificarla.'),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Publicar cambios' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Agregar tarjeta' })).toBeNull()
  expect(screen.getByDisplayValue('Muelle').matches(':disabled')).toBe(true)
})
