import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { RiverNewsLink } from './RiverNewsLink'

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>
}
function mount(dirty: boolean, pending = false) {
  render(
    <MemoryRouter initialEntries={['/admin/rio']}>
      <RiverNewsLink dirty={dirty} pending={pending} />
      <LocationProbe />
    </MemoryRouter>,
  )
}
afterEach(() => vi.restoreAllMocks())

it('asks before leaving unsaved river data to create a news item', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount(true)
  fireEvent.click(
    screen.getByRole('link', { name: 'Crear noticia del muelle' }),
  )
  expect(screen.getByTestId('location').textContent).toBe('/admin/rio')
  confirm.mockReturnValue(true)
  fireEvent.click(
    screen.getByRole('link', { name: 'Crear noticia del muelle' }),
  )
  expect(screen.getByTestId('location').textContent).toBe(
    '/admin/noticias/nueva',
  )
})

it('blocks the news shortcut during a pending save', () => {
  const confirm = vi.spyOn(window, 'confirm')
  mount(true, true)
  const link = screen.getByRole('link', { name: 'Crear noticia del muelle' })
  expect(link.getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(link)
  expect(confirm).not.toHaveBeenCalled()
  expect(screen.getByTestId('location').textContent).toBe('/admin/rio')
})

it('opens the news editor directly when there are no unsaved changes', () => {
  const confirm = vi.spyOn(window, 'confirm')
  mount(false)
  fireEvent.click(
    screen.getByRole('link', { name: 'Crear noticia del muelle' }),
  )
  expect(confirm).not.toHaveBeenCalled()
  expect(screen.getByTestId('location').textContent).toBe(
    '/admin/noticias/nueva',
  )
})
