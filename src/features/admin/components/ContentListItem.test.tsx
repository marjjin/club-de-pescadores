import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, it, vi } from 'vitest'
import type { ClubEvent } from '../schemas/admin'
import { ContentListItem } from './ContentListItem'

const event: ClubEvent = {
  id: '10000000-0000-4000-8000-000000000001',
  created_at: '2026-11-01T00:00:00+00:00',
  updated_at: '2026-11-01T00:00:00+00:00',
  is_published: true,
  deleted_at: null,
  title: 'Torneo de la corvina',
  starts_at: '2026-12-05T10:30:00+00:00',
  place: 'Club de Pescadores San Nicolás',
  description: null,
  tournament_id: '60000000-0000-4000-8000-000000000001',
}
function mount(row: ClubEvent) {
  const actions = { onEdit: vi.fn(), onArchive: vi.fn() }
  render(
    <MemoryRouter>
      <ContentListItem row={row} busy={false} {...actions} />
    </MemoryRouter>,
  )
  return actions
}

it('sends tournament events to Torneos instead of editing them here', () => {
  mount(event)
  expect(
    screen
      .getByRole('link', {
        name: 'Gestionar «Torneo de la corvina» en Torneos',
      })
      .getAttribute('href'),
  ).toBe(`/admin/torneos/${event.tournament_id}`)
  expect(screen.getByText('Torneo')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Editar/ })).toBeNull()
  expect(screen.queryByRole('button', { name: /papelera/ })).toBeNull()
})

it('keeps editing and archiving for ordinary events', () => {
  mount({ ...event, title: 'Asamblea', tournament_id: null })
  expect(screen.getByRole('button', { name: 'Editar «Asamblea»' })).toBeTruthy()
  expect(
    screen.getByRole('button', { name: 'Enviar «Asamblea» a la papelera' }),
  ).toBeTruthy()
})
