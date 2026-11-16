import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, it } from 'vitest'
import { EventsList } from './EventsList'

const base = {
  startsOn: '2026-12-05',
  place: 'Club de Pescadores San Nicolás',
  description: null,
}

it('links tournament events to their leaderboard and keeps other events as text', () => {
  render(
    <MemoryRouter>
      <EventsList
        items={[
          {
            ...base,
            id: 'a',
            title: 'Torneo de la corvina',
            startsAt: '07:30',
            tournamentId: '60000000-0000-4000-8000-000000000001',
          },
          {
            ...base,
            id: 'b',
            title: 'Asamblea',
            startsAt: '18:00',
            tournamentId: null,
          },
        ]}
      />
    </MemoryRouter>,
  )
  const link = screen.getByRole('link', { name: 'Torneo de la corvina' })
  expect(link.getAttribute('href')).toBe(
    '/torneos/60000000-0000-4000-8000-000000000001',
  )
  expect(screen.queryByRole('link', { name: 'Asamblea' })).toBeNull()
  const [tournament] = screen.getAllByRole('listitem')
  expect(within(tournament!).getByText('Torneo')).toBeTruthy()
  expect(within(tournament!).getByText('07:30 hs')).toBeTruthy()
})

it('shows only the day while a tournament has no start time', () => {
  render(
    <MemoryRouter>
      <EventsList
        items={[
          {
            ...base,
            id: 'a',
            title: 'Torneo anterior',
            startsAt: null,
            tournamentId: '60000000-0000-4000-8000-000000000002',
          },
        ]}
      />
    </MemoryRouter>,
  )
  expect(screen.queryByText(/hs$/)).toBeNull()
})
