import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ExternalLink } from './ExternalLink'

it('opens in a new tab without giving the other site control of this one', () => {
  render(<ExternalLink href="https://wa.me/1">Hacete socio</ExternalLink>)
  const link = screen.getByRole('link', {
    name: 'Hacete socio',
    description: 'Se abre en otra pestaña',
  })
  expect(link.getAttribute('target')).toBe('_blank')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
})

it('keeps an explicit accessible name and still tells about the new tab', () => {
  render(
    <ExternalLink href="https://example.com" aria-label="Instagram del club">
      <svg />
    </ExternalLink>,
  )
  expect(
    screen.getByRole('link', {
      name: 'Instagram del club',
      description: 'Se abre en otra pestaña',
    }),
  ).toBeTruthy()
})
