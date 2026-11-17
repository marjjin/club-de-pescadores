import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeAll, beforeEach, expect, it, vi } from 'vitest'
import * as api from '../../api/tournaments'
import * as people from '../../api/anglers'
import type {
  AdminParticipant,
  AdminTournament,
} from '../../schemas/tournaments'
import { TournamentWorkspace } from './TournamentWorkspace'
import { TournamentsSection } from './TournamentsSection'

vi.mock('../../api/tournaments', () => ({
  listTournaments: vi.fn(),
  getAdminTournament: vi.fn(),
  saveTournament: vi.fn(),
  setTournamentStatus: vi.fn(),
  listParticipants: vi.fn(),
  addParticipant: vi.fn(),
  renameParticipant: vi.fn(),
  removeParticipant: vi.fn(),
  addPoints: vi.fn(),
  changeParticipant: vi.fn(),
  moveParticipant: vi.fn(),
  listCategories: vi.fn(),
  saveCategory: vi.fn(),
  archiveCategory: vi.fn(),
  deleteTournament: vi.fn(),
  listAnnualTables: vi.fn(),
  saveAnnualTable: vi.fn(),
  archiveAnnualTable: vi.fn(),
}))
vi.mock('../../api/anglers', () => ({
  searchAnglers: vi.fn(),
  getAngler: vi.fn(),
  saveAngler: vi.fn(),
}))

const userId = '10000000-0000-4000-8000-000000000010'
const senior = '80000000-0000-4000-8000-000000000001'
const cadetes = '80000000-0000-4000-8000-000000000002'
const person = {
  id: '90000000-0000-4000-8000-000000000001',
  first_name: 'Lucía',
  last_name: 'Benítez',
  updated_at: '2026-11-01T00:00:00Z',
  dni: null,
  dni_masked: '••••3456',
}
const tournament: AdminTournament = {
  id: '60000000-0000-4000-8000-000000000001',
  name: 'Torneo de Pesca',
  place: 'Muelle del club',
  starts_on: '2026-11-29',
  ends_on: '2026-11-30',
  start_time: '07:30',
  description: 'Modalidad caña libre.',
  status: 'published',
  participants: 2,
  categories: [
    {
      id: cadetes,
      name: 'Cadetes',
      participants: 0,
      annual_table_id: null,
      annual_table_name: null,
    },
    {
      id: senior,
      name: 'Senior',
      participants: 2,
      annual_table_id: null,
      annual_table_name: null,
    },
  ],
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
}
const participant = (
  n: number,
  name: string,
  points: number,
): AdminParticipant => ({
  id: `70000000-0000-4000-8000-00000000000${n}`,
  display_name: name,
  points,
  ranking: n,
  updated_at: '2026-11-01T00:00:00Z',
  category_id: senior,
  angler_id: `90000000-0000-4000-8000-00000000001${n}`,
  dni_masked: `••••000${n}`,
})
const annualTable = {
  id: '50000000-0000-4000-8000-000000000001',
  name: 'Campeonato anual',
  year: 2026,
  archived_at: null,
  updated_at: '2026-11-01T00:00:00Z',
  tournaments: 3,
  finished: 2,
  unlinked: 1,
}
// jsdom has no modal dialogs.
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true
    },
  })
})
beforeEach(() => {
  vi.mocked(api.listTournaments).mockResolvedValue([tournament])
  vi.mocked(api.getAdminTournament).mockResolvedValue(tournament)
  vi.mocked(api.listParticipants).mockResolvedValue([
    participant(1, 'Juan P.', 12),
    participant(2, 'Ana G.', 7),
  ])
  vi.mocked(api.addPoints).mockResolvedValue(12)
  vi.mocked(api.listCategories).mockResolvedValue([
    {
      id: senior,
      name: 'Senior',
      archived_at: null,
      updated_at: '2026-11-01T00:00:00Z',
      tournaments: 1,
    },
  ])
  vi.mocked(api.listAnnualTables).mockResolvedValue([annualTable])
  vi.mocked(people.searchAnglers).mockResolvedValue([person])
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
function mount(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/admin/torneos"
            element={<TournamentsSection userId={userId} />}
          />
          <Route
            path="/admin/torneos/:id"
            element={<TournamentWorkspace userId={userId} />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

it('lists tournaments with their dates, place, participants and next step', async () => {
  mount('/admin/torneos')
  const link = await screen.findByRole('link', {
    name: 'Gestionar Torneo de Pesca',
  })
  expect(within(link).getByText('29 NOV 2026 al 30 NOV 2026')).toBeTruthy()
  expect(within(link).getByText('Muelle del club')).toBeTruthy()
  expect(within(link).getByText(/2 participantes/)).toBeTruthy()
  expect(
    within(link).getByText('Visible en el sitio · se pueden sumar puntos'),
  ).toBeTruthy()
})

it('offers to create the first tournament and asks before discarding a draft', async () => {
  vi.mocked(api.listTournaments).mockResolvedValue([])
  mount('/admin/torneos')
  fireEvent.click(
    await screen.findByRole('button', { name: 'Crear el primer torneo' }),
  )
  expect(screen.getByRole('heading', { name: 'Nuevo torneo' })).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Fecha de inicio'), {
    target: { value: '2026-12-05' },
  })
  expect(
    screen.getByLabelText('Fecha de cierre (opcional)').getAttribute('min'),
  ).toBe('2026-12-05')
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(confirm).toHaveBeenCalled())
  expect(screen.getByRole('heading', { name: 'Nuevo torneo' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: 'Nuevo torneo' })).toBeNull(),
  )
  expect(api.saveTournament).not.toHaveBeenCalled()
})

it('shows the stage of the tournament and who leads it', async () => {
  mount(`/admin/torneos/${tournament.id}`)
  const stages = await screen.findByRole('list', { name: 'Etapas del torneo' })
  expect(
    within(stages)
      .getByText('Publicado')
      .closest('li')
      ?.getAttribute('aria-current'),
  ).toBe('step')
  expect(await screen.findByText(/Lidera/)).toBeTruthy()
  expect(screen.getByText('Juan P.', { selector: 'strong' })).toBeTruthy()
  expect(screen.getByLabelText('Puesto 1')).toBeTruthy()
})

it('adds points from a quick value and confirms it on the row', async () => {
  mount(`/admin/torneos/${tournament.id}`)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Sumar puntos a Ana G.' }),
  )
  const form = screen.getByRole('form', { name: 'Sumar puntos a Ana G.' })
  fireEvent.click(within(form).getByRole('button', { name: '+5' }))
  fireEvent.click(within(form).getByRole('button', { name: 'Sumar' }))
  expect(await screen.findByText('+5 puntos cargados')).toBeTruthy()
  expect(api.addPoints).toHaveBeenCalledWith(participant(2, 'Ana G.', 7).id, {
    points: 5,
    reason: '',
  })
  expect(
    screen.queryByRole('form', { name: 'Sumar puntos a Ana G.' }),
  ).toBeNull()
})

it('keeps the points form open with an error when the value is invalid', async () => {
  mount(`/admin/torneos/${tournament.id}`)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Sumar puntos a Juan P.' }),
  )
  const form = screen.getByRole('form', { name: 'Sumar puntos a Juan P.' })
  fireEvent.click(within(form).getByRole('button', { name: 'Sumar' }))
  expect(within(form).getByRole('alert').textContent).toBe(
    'Ingresá un número entero.',
  )
  expect(api.addPoints).not.toHaveBeenCalled()
})

it('shows one table per category and registers a person from the registry', async () => {
  mount(`/admin/torneos/${tournament.id}`)
  const tabs = await screen.findByRole('group', { name: 'Categoría' })
  fireEvent.click(within(tabs).getByRole('button', { name: /Senior/ }))
  await waitFor(() =>
    expect(api.listParticipants).toHaveBeenLastCalledWith(
      tournament.id,
      senior,
      '',
      null,
      expect.anything(),
    ),
  )
  // The sign-up form opens on demand, next to the list search.
  expect(screen.queryByLabelText('Buscá a la persona')).toBeNull()
  fireEvent.click(
    screen.getByRole('button', { name: 'Registrar participante' }),
  )
  fireEvent.change(screen.getByLabelText('Buscá a la persona'), {
    target: { value: 'Luc' },
  })
  fireEvent.click(await screen.findByRole('button', { name: /Lucía Benítez/ }))
  expect(screen.getByRole('combobox')).toHaveProperty('value', senior)
  // Signing up includes the public table: there is nothing else to tick.
  expect(screen.queryByRole('checkbox')).toBeNull()
  fireEvent.click(
    screen.getByRole('button', { name: 'Registrar en el torneo' }),
  )
  await screen.findByText('Registraste a Lucía Benítez en Senior.')
  // It stays open to register the next person, until it is closed.
  expect(screen.getByLabelText('Buscá a la persona')).toBeTruthy()
  fireEvent.click(
    screen.getByRole('button', { name: 'Cerrar registro de participante' }),
  )
  expect(screen.queryByLabelText('Buscá a la persona')).toBeNull()
  expect(api.addParticipant).toHaveBeenCalledWith(tournament.id, {
    category: senior,
    angler: person.id,
  })
})

it('changes the person of an entry, keeping its points', async () => {
  mount(`/admin/torneos/${tournament.id}`)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cambiar la persona de Ana G.' }),
  )
  fireEvent.change(
    screen.getByLabelText('¿Quién compitió en lugar de Ana G.?'),
    {
      target: { value: 'Luc' },
    },
  )
  fireEvent.click(await screen.findByRole('button', { name: /Lucía Benítez/ }))
  expect(screen.getByText(/7 puntos/)).toBeTruthy()
  const submit = screen.getByRole('button', { name: 'Cambiar persona' })
  expect(screen.queryByRole('checkbox')).toBeNull()
  fireEvent.click(submit)
  expect(await screen.findByText('Ahora figura Lucía Benítez')).toBeTruthy()
  expect(api.changeParticipant).toHaveBeenCalledWith(
    participant(2, 'Ana G.', 7).id,
    { angler: person.id },
  )
})

it('offers permanent deletion only for archived tournaments, after confirming', async () => {
  mount(`/admin/torneos/${tournament.id}`)
  await screen.findByRole('list', { name: 'Etapas del torneo' })
  expect(
    screen.queryByRole('button', { name: 'Eliminar definitivamente' }),
  ).toBeNull()
})

it('deletes an archived tournament and returns to the list', async () => {
  vi.mocked(api.getAdminTournament).mockResolvedValue({
    ...tournament,
    status: 'archived',
  })
  vi.mocked(api.deleteTournament).mockResolvedValue(undefined)
  mount(`/admin/torneos/${tournament.id}`)
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Eliminar definitivamente' }),
  )
  await waitFor(() => expect(confirm).toHaveBeenCalled())
  expect(String(confirm.mock.calls[0]?.[0])).toContain('2 inscripciones')
  expect(api.deleteTournament).not.toHaveBeenCalled()
  fireEvent.click(
    screen.getByRole('button', { name: 'Eliminar definitivamente' }),
  )
  await screen.findByRole('link', { name: 'Gestionar Torneo de Pesca' })
  expect(api.deleteTournament).toHaveBeenCalledWith(
    expect.objectContaining({ id: tournament.id }),
  )
})

it('shows a printable QR that leads to the public leaderboard', async () => {
  const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
  mount(`/admin/torneos/${tournament.id}`)
  fireEvent.click(
    await screen.findByRole('button', { name: 'QR para imprimir' }),
  )
  expect(
    screen.getByRole('img', {
      name: 'Código QR de la tabla de posiciones de Torneo de Pesca',
    }),
  ).toBeTruthy()
  // The printed copy lives directly in <body>, so it prints on the first page.
  const sheet = document.querySelector<HTMLElement>('body > [data-print-sheet]')
  expect(sheet?.textContent).toContain(`/torneos/${tournament.id}`)
  expect(sheet?.textContent).toContain('Escaneá y mirá la tabla de posiciones')
  expect(
    screen
      .getAllByText(new RegExp(`/torneos/${tournament.id}$`))
      .some((element) => !sheet?.contains(element)),
  ).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }))
  expect(print).toHaveBeenCalled()
  // The QR opens in a modal window.
  expect(
    screen.getByRole('dialog', { name: 'QR de la tabla de posiciones' }),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar QR' }))
  expect(
    screen.queryByRole('heading', { name: 'QR de la tabla de posiciones' }),
  ).toBeNull()
  expect(document.querySelector('[data-print-sheet]')).toBeNull()
})

it('edits the tournament description with a character count', async () => {
  vi.mocked(api.saveTournament).mockResolvedValue(tournament.id)
  mount(`/admin/torneos/${tournament.id}`)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar datos' }))
  const field = screen.getByLabelText('Descripción (opcional)')
  expect(field).toHaveProperty('value', 'Modalidad caña libre.')
  fireEvent.change(field, {
    target: { value: 'Modalidad caña libre.\nInscripción: $25.000' },
  })
  expect(screen.getByText('1958 caracteres disponibles')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await waitFor(() =>
    expect(api.saveTournament).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Modalidad caña libre.\nInscripción: $25.000',
      }),
      expect.objectContaining({ id: tournament.id }),
    ),
  )
})

it('sends each category of the tournament to its own annual table', async () => {
  const seniorsTable = {
    ...annualTable,
    id: '50000000-0000-4000-8000-000000000002',
    name: 'Tabla anual Senior',
  }
  vi.mocked(api.listAnnualTables).mockResolvedValue([annualTable, seniorsTable])
  vi.mocked(api.saveTournament).mockResolvedValue(tournament.id)
  vi.mocked(api.listCategories).mockResolvedValue(
    [
      [senior, 'Senior'],
      [cadetes, 'Cadetes'],
    ].map(([id = '', name = '']) => ({
      id,
      name,
      archived_at: null,
      updated_at: '2026-11-01T00:00:00Z',
      tournaments: 1,
    })),
  )
  mount(`/admin/torneos/${tournament.id}`)
  fireEvent.click(await screen.findByRole('button', { name: 'Editar datos' }))
  const cadets = await screen.findByRole('combobox', {
    name: 'Tabla anual de Cadetes',
  })
  const seniors = screen.getByRole('combobox', {
    name: 'Tabla anual de Senior',
  })
  expect(cadets).toHaveProperty('value', '')
  fireEvent.change(cadets, { target: { value: annualTable.id } })
  fireEvent.change(seniors, { target: { value: seniorsTable.id } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await waitFor(() =>
    expect(api.saveTournament).toHaveBeenCalledWith(
      expect.objectContaining({
        annual_tables: { [cadetes]: annualTable.id, [senior]: seniorsTable.id },
      }),
      expect.objectContaining({ id: tournament.id }),
    ),
  )
})

it('shows which annual tables the tournament adds to', async () => {
  vi.mocked(api.getAdminTournament).mockResolvedValue({
    ...tournament,
    categories: tournament.categories.map((category) => ({
      ...category,
      annual_table_id: annualTable.id,
      annual_table_name:
        category.id === senior ? 'Tabla anual Senior' : 'Tabla anual Cadetes',
    })),
  })
  mount(`/admin/torneos/${tournament.id}`)
  expect(
    await screen.findByText('Suma a Tabla anual Cadetes y Tabla anual Senior'),
  ).toBeTruthy()
})

it('creates annual tables and warns about entries that cannot add up', async () => {
  vi.mocked(api.saveAnnualTable).mockResolvedValue(annualTable.id)
  mount('/admin/torneos')
  fireEvent.click(await screen.findByRole('button', { name: 'Tablas anuales' }))
  const dialog = await screen.findByRole('dialog', { name: 'Tablas anuales' })
  expect(await within(dialog).findByText('Campeonato anual')).toBeTruthy()
  expect(screen.getByText('3 torneos vinculados · 2 finalizados')).toBeTruthy()
  expect(screen.getByText(/1 inscripción sin ficha no suma/)).toBeTruthy()
  expect(
    screen
      .getByRole('link', { name: 'Ver Campeonato anual en el sitio' })
      .getAttribute('href'),
  ).toBe(`/torneos/anual/${annualTable.id}`)
  fireEvent.change(screen.getByLabelText('Nombre de la nueva tabla anual'), {
    target: { value: 'Copa de invierno' },
  })
  fireEvent.change(screen.getByLabelText('Año de la tabla anual'), {
    target: { value: '2027' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Crear tabla' }))
  await waitFor(() =>
    expect(api.saveAnnualTable).toHaveBeenCalledWith(
      { name: 'Copa de invierno', year: 2027 },
      undefined,
    ),
  )
})

it('manages categories in a modal window', async () => {
  mount('/admin/torneos')
  fireEvent.click(await screen.findByRole('button', { name: 'Categorías' }))
  const dialog = await screen.findByRole('dialog', {
    name: 'Categorías de torneos',
  })
  expect(await within(dialog).findByText('Senior')).toBeTruthy()
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Cerrar categorías' }),
  )
  expect(screen.queryByRole('dialog')).toBeNull()
})
